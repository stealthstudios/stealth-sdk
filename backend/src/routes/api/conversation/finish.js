import conversationManager from "#src/classes/conversationManager.js";
import logger from "#utils/logger.js";

/** @param { import('fastify').FastifyInstance } app */
export default async function (app) {
    app.post(
        "/finish",
        {
            schema: {
                description:
                    "Finish a conversation. Do not call if conversation data should persist.",
                summary: "finish",
                tags: ["conversation"],
                security: [{ endpointAuth: [] }],
                body: {
                    type: "object",
                    required: ["secret"],
                    properties: {
                        secret: { type: "string" },
                    },
                },
                response: {
                    200: {
                        description: "Conversation finished successfully",
                        type: "object",
                        properties: {},
                    },
                    404: {
                        description: "Conversation not found",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                        },
                    },
                    500: {
                        description: "Failed to end conversation",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                        },
                    },
                },
            },
        },
        async (request, reply) => {
            const { secret } = request.body;
            const conversation =
                await conversationManager.getConversationBySecret(secret);

            if (!conversation) {
                return reply.code(404).send({
                    message: "Conversation not found",
                });
            }

            try {
                await conversation.delete();
                return reply.code(200).send();
            } catch (error) {
                logger.error(error);
                return reply.code(500).send({
                    message: `Failed to finish conversation: ${error}`,
                });
            }
        },
    );
}
