import prismaClient from "#utils/prisma.js";
import { getEncoding } from "js-tiktoken";
import { openaiClient } from "#utils/openai.js";
import logger from "#utils/logger.js";

export default class Conversation {
    /** The unique identifier of the conversation */
    /** @type { number } */
    id;

    /** The secret token used to access this conversation */
    /** @type { string } */
    secret;

    /** Token used for conversation persistence */
    /** @type { string | null } */
    persistenceToken;

    /** Whether the conversation is currently processing */
    /** @type { boolean } */
    busy = false;

    /** ID of the personality associated with this conversation
     *  This is saved in the class instead of the database because it is unable to change mid-conversation
     *  @type { number | null }
     */
    personalityId;

    /**
     * @param { prismaClient["conversation"] } prismaConversation
     */
    constructor(prismaConversation) {
        this.id = prismaConversation.id;
        this.secret = prismaConversation.secret;
        this.persistenceToken = prismaConversation.persistenceToken;
        this.busy = prismaConversation.busy;
        this.personalityId = prismaConversation.personalityId;
    }

    /**
     * Updates conversation users
     * @param { { users: Array<{ id: string, name: string }> } } data Update data containing users
     */
    async update(data) {
        try {
            if (!data.users) return;

            await prismaClient.conversation.update({
                where: { id: this.id },
                data: {
                    users: {
                        set: [],
                        connectOrCreate: data.users.map((player) => ({
                            where: { id: player.id },
                            create: {
                                id: player.id,
                                name: player.name,
                            },
                        })),
                        updateMany: data.users.map((player) => ({
                            where: { id: player.id },
                            data: { name: player.name },
                        })),
                    },
                },
            });
        } catch (error) {
            logger.error(error);
        }
    }

    /**
     * Deletes the conversation
     */
    async delete() {
        try {
            await prismaClient.conversation.delete({
                where: { id: this.id },
            });
        } catch (error) {
            logger.error(error);
        }
    }

    /**
     * Creates initial system message with personality prompt
     */
    async createSystemMessage() {
        const personality = await prismaClient.personality.findUnique({
            where: { id: this.personalityId },
        });

        await prismaClient.message.create({
            data: {
                role: "system",
                content: personality.prompt,
                conversationId: this.id,
            },
        });
    }

    /**
     * Processes and sends a message in the conversation
     * @param { string } message Message content
     * @param { Array<{ key: string, value: string }> } context Additional context for the message
     * @param { string } playerId ID of sending player
     * @returns { Promise<{ flagged: boolean, content: string } | null> }
     */
    async send(message, context, playerId) {
        const { busy } = await prismaClient.conversation.findUnique({
            where: { id: this.id },
            select: { busy: true },
        });

        if (busy) return null;

        await this.setBusyState(true);

        try {
            const { messages, response } = await this.processMessage(
                message,
                context,
                playerId,
            );

            await this.saveMessages(messages, context);
            return response;
        } catch (error) {
            throw new Error(error);
        } finally {
            await this.setBusyState(false);
        }
    }

    /**
     * Sets the conversation's busy state
     * @param { boolean } state Busy state to set
     */
    async setBusyState(state) {
        await prismaClient.conversation.update({
            where: { id: this.id },
            data: { busy: state },
        });
    }

    /**
     * Processes a message and gets AI response
     * @private
     */
    async processMessage(message, context, playerId) {
        const encoding = getEncoding("o200k_base");
        const fullRecord = await this.getConversationRecord();
        const { usedMessages, tokenCount } = this.prepareMessageHistory(
            fullRecord.messages,
            encoding,
        );

        const totalTokens =
            tokenCount +
            encoding.encode(fullRecord.personality.prompt).length +
            encoding.encode(message).length;

        const contextMessage = this.buildContextMessage(
            context,
            fullRecord.users,
            playerId,
        );

        usedMessages.push(
            { role: "system", content: contextMessage },
            { role: "user", content: message },
        );

        const response = await this.getAIResponse(
            usedMessages,
            message,
            fullRecord.users,
            playerId,
            totalTokens,
        );

        return {
            messages: [
                { role: "system", content: contextMessage },
                { role: "user", content: message, senderId: playerId },
                { role: "assistant", content: response.content },
            ],
            response: {
                flagged: response.flagged,
                content: response.flagged ? "" : response.content,
            },
        };
    }

    /**
     * Gets the full conversation record
     * @private
     */
    async getConversationRecord() {
        return await prismaClient.conversation.findFirst({
            where: { id: this.id },
            select: {
                users: true,
                messages: true,
                personality: true,
            },
        });
    }

    /**
     * Prepares message history with token counting
     * @private
     */
    prepareMessageHistory(messages, encoding) {
        let tokenCount = 0;
        const messagesCloned = [...messages.slice(1)];
        const usedMessages = [messages[0]];

        while (tokenCount < 10000 && messagesCloned.length) {
            const recentMessage = messagesCloned.shift();
            if (!recentMessage) break;

            usedMessages.push({
                role: recentMessage.role,
                content: recentMessage.content,
            });
            tokenCount += encoding.encode(recentMessage.content).length;
        }

        return { usedMessages, tokenCount };
    }

    /**
     * Builds context message from provided context and users
     * @private
     */
    buildContextMessage(context, users, playerId) {
        const contextWithUsers = [
            ...context,
            {
                key: "users",
                description:
                    "The users participating in the conversation, separated by commas.",
                value: users.map((p) => p.name).join(", "),
            },
            {
                key: "username",
                value: users.find((p) => p.id === playerId).name,
            },
        ];

        return [
            "# Context",
            ...contextWithUsers.map((c) => `${c.key}: ${c.value}`),
        ].join("\n");
    }

    /**
     * Gets AI response and handles moderation
     * @private
     */
    async getAIResponse(messages, userMessage, users, playerId, tokenCount) {
        const rawResponse = await openaiClient.chat.completions.create({
            model: "gpt-4o",
            messages: messages,
        });

        const response = rawResponse.choices[0].message;
        if (!response) throw new Error("No response from OpenAI");

        const moderationResult = await this.moderateContent(
            userMessage,
            response.content,
        );

        const username = users.find((p) => p.id === playerId).name;
        logger.debug(
            `${username} (${playerId}) sent a message to conversation ${this.id} (total tokens: ${tokenCount})`,
        );

        return {
            flagged: moderationResult.flagged,
            content: response.content,
        };
    }

    /**
     * Moderates message content
     * @private
     */
    async moderateContent(userMessage, responseContent) {
        const moderationResponseRaw = await openaiClient.moderations.create({
            input: `${userMessage.content} ${responseContent}`,
            model: "omni-moderation-latest",
        });

        const moderationResponse = moderationResponseRaw.results[0];
        if (!moderationResponse) {
            throw new Error("No moderation response from OpenAI");
        }

        if (moderationResponse.flagged) {
            logger.warn(
                `Message by user ${userMessage.sender} flagged by moderation (${moderationResponse.categories}). The message was ${userMessage.content} and the response was ${responseContent}`,
            );
            return { flagged: true };
        }

        return { flagged: false };
    }

    /**
     * Saves messages and context to database
     * @private
     */
    async saveMessages(messages, context) {
        const createdMessages = await prismaClient.message.createManyAndReturn({
            data: messages.map((msg) => ({
                ...msg,
                conversationId: this.id,
            })),
        });

        if (!context?.length) return;

        const lastMessageId = createdMessages[createdMessages.length - 1].id;
        await prismaClient.messageContext.createMany({
            data: context.map((c) => ({
                key: c.key,
                value: c.value,
                messageId: lastMessageId,
            })),
        });
    }
}
