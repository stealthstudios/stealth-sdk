import conversationManager from "#src/classes/conversationManager.js";

/** @param { import('fastify').FastifyInstance } app */
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
                    required: ["secret"],
                    properties: {
                        secret: { type: "string" },
                        users: {
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
            const { secret, users } = request.body;

            const conversation =
                await conversationManager.getConversationBySecret(secret);
            if (!conversation) {
                return reply
                    .code(404)
                    .send({ message: "Conversation not found" });
            }

            await conversation.update({ users });
            return reply.code(200).send();
        },
    );
}
