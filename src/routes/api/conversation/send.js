import conversationManager from "#src/classes/conversationManager.js";
import ConversationMessage from "#src/classes/conversationMessage.js";
import database from "#utils/database.js";
import logger from "#utils/logger.js";

/** @param {import('fastify').FastifyInstance} app */
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
                    required: ["conversation-secret", "message", "playerId"],
                    properties: {
                        "conversation-secret": { type: "string" },
                        message: { type: "string" },
                        playerId: { type: "string" },
                    },
                },
                response: {
                    200: {
                        description: "Message sent successfully",
                        type: "object",
                        properties: {
                            reply: { type: "string" },
                        },
                    },
                    422: {
                        description: "Content moderated or error in OpenAI API",
                        type: "object",
                        properties: {
                            message: { type: "string" },
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
                },
            },
        },
        async (request, reply) => {
            const conversationSecret = request.body["conversation-secret"];
            const conversation =
                conversationManager.getConversationBySecret(conversationSecret);

            if (!conversation) {
                reply.code(404).send({ message: "Conversation not found" });
                return;
            }

            try {
                const response = await conversationManager.sendMessage(
                    conversation,
                    new ConversationMessage(
                        "user",
                        request.body.message,
                        request.body.playerId,
                        new Date(),
                    ),
                );

                database.set(conversation.id, conversation);

                reply.code(200).send({ reply: response });
            } catch (error) {
                logger.error(error);
                reply.code(422).send({ message: error.message });
            }
        },
    );
}
