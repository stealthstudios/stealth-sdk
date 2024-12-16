import conversationManager from "#src/classes/conversationManager.js";
import database from "#utils/database.js";

/** @param {import('fastify').FastifyInstance} app */
export default async function (app) {
    app.post(
        "/create",
        {
            schema: {
                description:
                    "Create a new conversation with the given players.",
                summary: "create",
                tags: ["conversation"],
                security: [{ endpointAuth: [] }],
                body: {
                    type: "object",
                    required: ["prompt", "players"],
                    properties: {
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
                        description: "Conversation created successfully",
                        type: "object",
                        properties: {
                            id: { type: "string" },
                            secret: { type: "string" },
                        },
                    },
                    403: {
                        description: "Invalid API key",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                        },
                    },
                },
            },
        },
        (request, reply) => {
            const conversation = conversationManager.createConversation(
                request.body.prompt,
                request.body.players,
            );

            database.set(conversation.id, conversation);

            reply.send({
                id: conversation.id,
                secret: conversation.secret,
            });
        },
    );
}
