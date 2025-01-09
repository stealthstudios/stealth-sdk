import conversationManager from "#src/classes/conversationManager.js";
import logger from "#utils/logger.js";

/** @param { import('fastify').FastifyInstance } app */
export default async function (app) {
    app.post(
        "/send",
        {
            schema: {
                description: "Send a message from a player to a conversation.",
                summary: "send",
                tags: ["conversation"],
                security: [{ endpointAuth: [] }],
                body: {
                    type: "object",
                    required: ["secret", "message", "playerId"],
                    properties: {
                        secret: { type: "string" },
                        message: { type: "string" },
                        playerId: { type: "string" },
                        context: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    key: { type: "string" },
                                    value: { type: "string" },
                                },
                            },
                        },
                    },
                },
                response: {
                    200: {
                        description: "Message sent successfully",
                        type: "object",
                        properties: {
                            flagged: { type: "boolean" },
                            cancelled: { type: "boolean" },
                            content: { type: "string" },
                            calls: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        name: { type: "string" },
                                        message: { type: "string" },
                                        parameters: {
                                            type: "object",
                                            additionalProperties: {
                                                type: "string",
                                            },
                                        },
                                    },
                                    required: ["name", "parameters"],
                                },
                            },
                        },
                    },
                    403: {
                        description: "Invalid API key or conversation secret",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                        },
                    },
                    404: {
                        description: "Conversation not found",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                        },
                    },
                    422: {
                        description:
                            "Content moderated or error in Provider API",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                        },
                    },
                    429: {
                        description: "Conversation is busy",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                        },
                    },
                },
            },
        },
        async (request, reply) => {
            const { secret, message, context, playerId } = request.body;

            const conversation =
                await conversationManager.getConversationBySecret(secret);
            if (!conversation) {
                return reply
                    .code(404)
                    .send({ message: "Conversation not found" });
            }

            try {
                const response = await conversation.send(
                    message,
                    context,
                    playerId,
                );

                if (!response) {
                    return reply.code(429).send({
                        message: "Conversation is busy or no longer exists",
                    });
                }

                return reply.code(200).send(response);
            } catch (error) {
                logger.error(error);
                return reply.code(422).send({ message: error.message });
            }
        },
    );
}
