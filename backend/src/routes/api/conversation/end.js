import conversationManager from "#src/classes/conversationManager.js";
import database from "#utils/database.js";
import logger from "#utils/logger.js";

/** @param {import('fastify').FastifyInstance} app */
export default async function (app) {
    app.post(
        "/end",
        {
            schema: {
                description: `End a conversation using the given conversation ID. If conversation data should persist, this endpoint should not be called.`,
                summary: "end",
                tags: ["conversation"],
                security: [{ endpointAuth: [] }],
                body: {
                    type: "object",
                    required: ["conversation-secret"],
                    properties: {
                        "conversation-secret": { type: "string" },
                    },
                },
                response: {
                    200: {
                        description: "Conversation ended successfully",
                        type: "object",
                        properties: {},
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
        (request, reply) => {
            const conversationSecret = request.body["conversation-secret"];
            const conversation =
                conversationManager.getConversationBySecret(conversationSecret);

            if (!conversation) {
                reply.code(404).send({ message: "Conversation not found" });
                return;
            }

            try {
                conversationManager.endConversation(conversation);
                database.set(conversation.id, undefined);
                reply.code(200).send();
            } catch (error) {
                logger.error(error);
                reply
                    .code(500)
                    .send({ message: "Failed to end conversation: " + error });
            }
        },
    );
}
