/** @param {import('fastify').FastifyInstance} app */
export default async function (app) {
    app.get(
        "/ping",
        {
            schema: {
                description: "Ping the server to check if it's running",
                summary: "ping",
                tags: ["debug"],
                response: {
                    200: {
                        description: "Server is running",
                        type: "string",
                    },
                },
            },
        },
        (_, reply) => {
            reply.code(200).send();
        },
    );
}
