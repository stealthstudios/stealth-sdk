/** @param { import('fastify').FastifyInstance } app */
export default async function (app) {
    app.get(
        "/ping",
        {
            schema: {
                summary: "ping",
                description: "Ping the server to check if it's running",
                tags: ["debug"],
                response: {
                    200: {
                        type: "string",
                        description: "Server is running",
                    },
                },
            },
        },
        () => "pong",
    );
}
