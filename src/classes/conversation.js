import prismaClient from "#utils/prisma.js";
import { getEncoding } from "js-tiktoken";
import aiWrapper from "#utils/aiWrapper.js";
import logger from "#utils/logger.js";
import { startAgent, agents } from "#utils/eliza/index.js";

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
     * Checks if conversation exists in database
     */
    async exists() {
        const conversation = await prismaClient.conversation.findUnique({
            where: { id: this.id },
        });
        return conversation !== null;
    }

    /**
     * Updates conversation users
     * @param {{users: Array<{id: string, name: string}>}} data Update data containing users
     */
    async update({ users }) {
        if (!users || !(await this.exists())) {
            return;
        }

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
            logger.error(
                "An error occurred while updating conversation users. This is a non-critical error, it generally just means that the conversation or user was deleted before this function was ran. Error:",
            );
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
     * @returns {Promise<{flagged: boolean, content: string, cancelled?: boolean}|null>}
     */
    async send(message, context, userId) {
        const conversation = await prismaClient.conversation.findUnique({
            where: { id: this.id },
            select: { busy: true },
        });

        if (conversation.busy) {
            return null;
        }

        await this.setBusyState(true);

        try {
            const { messages, response } = await this.processMessage(
                message,
                context,
                userId,
            );

            try {
                await this.saveMessages(messages, context);
            } catch (err) {
                logger.error(
                    "Error saving messages to database. Conversation likely finished while awaiting AI response. Non-critical error:",
                );
                logger.error(err);
                return { flagged: false, cancelled: true, content: "" };
            }

            return response;
        } catch (error) {
            logger.error(error);
        } finally {
            if (await this.exists()) {
                await this.setBusyState(false);
            }
        }

        return { flagged: false, cancelled: true, content: "" };
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

        if (
            !agents.has(record.personality.hash) &&
            process.env.AGENT_PROVIDER === "eliza"
        ) {
            await startAgent(
                record.personality.personality,
                record.personality.hash,
            );
        }

        const { usedMessages, tokenCount } = this.prepareMessageHistory(
            record.messages,
            encoding,
        );
        const contextMessage = this.buildContextMessage(
            context,
            record.users,
            userId,
        );

        usedMessages.push(
            { role: "system", content: contextMessage },
            { role: "user", content: message },
        );

        const username = record.users.find((user) => user.id === userId)?.name;

        if (!username) {
            logger.debug(`User ${userId} not found in conversation ${this.id}`);

            return {
                messages: [],
                response: { flagged: false, content: "", cancelled: true },
            };
        }

        const totalTokens =
            tokenCount +
            encoding.encode(record.personality.prompt).length +
            encoding.encode(message).length;

        logger.debug(
            `${username} (${userId}) sent message to conversation ${this.id} (total tokens: ${totalTokens})`,
        );

        const response = await this.getAIResponse(
            usedMessages,
            message,
            userId,
            record.personality.functions,
            record.personality.name,
            this.persistenceToken || this.id,
            username,
        );

        let responseContent = response.content;
        if (
            process.env.PROVIDER === "anthropic" &&
            responseContent.length === 0
        ) {
            responseContent = "This action was handled via functions.";
        }

        return {
            messages: [
                { role: "system", content: contextMessage },
                { role: "user", content: message, senderId: userId },
                { role: "assistant", content: responseContent },
            ],
            response: {
                flagged: response.flagged,
                content: response.flagged ? "" : response.content,
                calls: response.calls,
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
                value: users.find((user) => user.id === userId)?.name,
            },
        ];

        return [
            "## Context",
            ...contextWithUsers.map((ctx) => `${ctx.key}: ${ctx.value}`),
        ].join("\n");
    }

    /**
     * Gets AI response and handles moderation
     * @private
     */
    async getAIResponse(
        messages,
        userMessage,
        userId,
        functions,
        agentName,
        roomId,
        userName,
    ) {
        const tools = functions
            ? functions.map((func) => ({
                  type: "function",
                  function: {
                      name: func.name,
                      similes: func.similes,
                      description: func.description,
                      parameters: {
                          type: "object",
                          properties: func.parameters,
                      },
                  },
              }))
            : [];

        let systemMessage;
        if (process.env.PROVIDER === "anthropic") {
            const systemMessages = messages.filter(
                (msg) => msg.role === "system",
            );
            const contextMessages = systemMessages.filter((msg) =>
                msg.content.startsWith("# Context"),
            );
            const lastContextMessage =
                contextMessages[contextMessages.length - 1]?.content || "";

            systemMessage = `${systemMessages[0].content}\n\n${lastContextMessage}`;
            messages = messages.filter((msg) => msg.role !== "system");
        }

        const response = await aiWrapper.query(
            messages,
            tools.length > 0 ? tools : null,
            systemMessage,
            {
                agentName,
                roomId,
                userId,
                userName,
            },
        );

        if (!response) {
            throw new Error("No response from AI Provider");
        }

        if (response.tool_calls) {
            logger.debug(
                `Got ${response.tool_calls.length} tool calls from last message response`,
            );
            return {
                flagged: false,
                content: "",
                calls: response.tool_calls.map((call) => ({
                    name: call.function.name,
                    parameters: JSON.parse(call.function.arguments),
                })),
            };
        }

        if (response.action) {
            return {
                flagged: false,
                content: response.message,
                calls: [
                    {
                        name: response.action.action,
                        message: response.action.data.message,
                        parameters: response.action.data.parameters,
                    },
                ],
            };
        }

        const moderationResult = await this.moderateContent(
            userMessage,
            userId,
            response.message,
        );
        const content = response.message.replace(/\n+$/, "");

        return {
            flagged: moderationResult.flagged,
            content,
        };
    }

    /**
     * Moderates message content
     * @private
     */
    async moderateContent(userMessage, userId, responseContent) {
        const moderationResponse = await aiWrapper.moderate(
            `${userMessage} ${responseContent}`,
        );

        if (!moderationResponse) {
            throw new Error("No moderation response from AI Provider");
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
            data: messages
                .filter((msg) => msg != null)
                .map((msg) => ({
                    ...msg,
                    conversationId: this.id,
                })),
        });

        if (!context?.length) {
            return;
        }

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
