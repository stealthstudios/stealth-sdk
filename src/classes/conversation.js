import prismaClient from "#utils/prisma.js";
import { getEncoding } from "js-tiktoken";
import { openaiClient } from "#utils/openai.js";
import logger from "#utils/logger.js";

export default class Conversation {
    /** @type {number} The unique identifier of the conversation */
    id;

    /** @type {string} The secret token used to access this conversation */
    secret;

    /** @type {string|null} Token used for conversation persistence */
    persistenceToken;

    /** @type {boolean} Whether the conversation is currently processing */
    busy = false;

    /** @type {number|null} ID of the personality associated with this conversation */
    personalityId;

    /**
     * @param {object} conversation Prisma conversation object
     */
    constructor(conversation) {
        this.id = conversation.id;
        this.secret = conversation.secret;
        this.persistenceToken = conversation.persistenceToken;
        this.busy = conversation.busy;
        this.personalityId = conversation.personalityId;
    }

    /**
     * Updates conversation users
     * @param {{users: Array<{id: string, name: string}>}} data Update data containing users
     */
    async update({ users }) {
        if (!users) return;

        try {
            await prismaClient.conversation.update({
                where: { id: this.id },
                data: {
                    users: {
                        set: [],
                        connectOrCreate: users.map((user) => ({
                            where: { id: user.id },
                            create: {
                                id: user.id,
                                name: user.name,
                            },
                        })),
                        updateMany: users.map((user) => ({
                            where: { id: user.id },
                            data: { name: user.name },
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
     * @param {string} message Message content
     * @param {Array<{key: string, value: string}>} context Additional context
     * @param {string} userId ID of sending user
     * @returns {Promise<{flagged: boolean, content: string}|null>}
     */
    async send(message, context, userId) {
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
                userId,
            );

            await this.saveMessages(messages, context);
            return response;
        } catch (error) {
            logger.error(error);
        } finally {
            await this.setBusyState(false);
        }
    }

    /**
     * Sets the conversation's busy state
     * @private
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
    async processMessage(message, context, userId) {
        const encoding = getEncoding("o200k_base");
        const record = await this.getConversationRecord();
        const { usedMessages, tokenCount } = this.prepareMessageHistory(
            record.messages,
            encoding,
        );

        const totalTokens =
            tokenCount +
            encoding.encode(record.personality.prompt).length +
            encoding.encode(message).length;

        const contextMessage = this.buildContextMessage(
            context,
            record.users,
            userId,
        );

        usedMessages.push(
            { role: "system", content: contextMessage },
            { role: "user", content: message },
        );

        const response = await this.getAIResponse(
            usedMessages,
            message,
            record.users,
            userId,
            totalTokens,
        );

        return {
            messages: [
                { role: "system", content: contextMessage },
                { role: "user", content: message, senderId: userId },
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
            const message = messagesCloned.shift();
            if (!message) break;

            usedMessages.push({
                role: message.role,
                content: message.content,
            });
            tokenCount += encoding.encode(message.content).length;
        }

        return { usedMessages, tokenCount };
    }

    /**
     * Builds context message from provided context and users
     * @private
     */
    buildContextMessage(context, users, userId) {
        const contextWithUsers = [
            ...context,
            {
                key: "users",
                description:
                    "The users participating in the conversation, separated by commas.",
                value: users.map((user) => user.name).join(", "),
            },
            {
                key: "username",
                value: users.find((user) => user.id === userId).name,
            },
        ];

        return [
            "# Context",
            ...contextWithUsers.map((ctx) => `${ctx.key}: ${ctx.value}`),
        ].join("\n");
    }

    /**
     * Gets AI response and handles moderation
     * @private
     */
    async getAIResponse(messages, userMessage, users, userId, tokenCount) {
        const rawResponse = await openaiClient.chat.completions.create({
            model: "gpt-4o",
            messages: messages,
        });

        const response = rawResponse.choices[0].message;
        if (!response) throw new Error("No response from OpenAI");

        const moderationResult = await this.moderateContent(
            userMessage,
            userId,
            response.content,
        );

        const username = users.find((user) => user.id === userId).name;
        logger.debug(
            `${username} (${userId}) sent a message to conversation ${this.id} (total tokens: ${tokenCount})`,
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
    async moderateContent(userMessage, userId, responseContent) {
        const moderationResponseRaw = await openaiClient.moderations.create({
            input: `${userMessage} ${responseContent}`,
            model: "omni-moderation-latest",
        });

        const moderationResponse = moderationResponseRaw.results[0];
        if (!moderationResponse) {
            throw new Error("No moderation response from OpenAI");
        }

        if (moderationResponse.flagged) {
            logger.warn(
                `Message by user ${userId} flagged by moderation (${JSON.stringify(
                    moderationResponse.categories,
                    null,
                    2,
                )}). The message was ${userMessage} and the response was ${responseContent}`,
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
            data: context.map((ctx) => ({
                key: ctx.key,
                value: ctx.value,
                messageId: lastMessageId,
            })),
        });
    }
}
