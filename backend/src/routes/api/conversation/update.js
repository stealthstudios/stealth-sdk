import conversationManager from "#src/classes/conversationManager.js";
import Player from "#src/classes/player.js";
import database from "#utils/database.js";

/** @param {import('fastify').FastifyInstance} app */
export default async function (app) {
    app.post(
        "/update",
        {
            schema: {
                description: "Update a conversation",
                summary: "update",
                tags: ["conversation"],
                security: [{ endpointAuth: [] }],
                body: {
                    type: "object",
                    required: ["conversation-secret"],
                    properties: {
                        "conversation-secret": { type: "string" },
                        prompt: { type: "string" },
                        players: {
                            type: "array",
                            items: {
                                type: "object",
                                required: ["name", "id"],
                                properties: {
                                    name: { type: "string" },
                                    id: { type: "string" },
                                },
                            },
                        },
                    },
                },
                response: {
                    200: {
                        description: "Conversation updated",
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
                },
            },
        },
        (request, reply) => {
            const conversationSecret = request.headers["conversation-secret"];
            const conversation =
                conversationManager.getConversationBySecret(conversationSecret);

            if (!conversation) {
                reply.code(404).send({ message: "Conversation not found" });
                return;
            }

            if (request.body.prompt) {
                conversation.updatePrompt(request.body.prompt);
            }

            if (request.body.players) {
                conversation.players = request.body.players.map((player) => {
                    return new Player(player.id, player.name);
                });
            }

            database.set(conversation.id, conversation);

            reply.code(200).send();
        },
    );
}
