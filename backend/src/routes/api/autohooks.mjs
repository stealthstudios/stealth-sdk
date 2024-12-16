/** @param {import('fastify').FastifyInstance} app */
export default async function (app) {
    app.addHook("onRequest", (request, reply, next) => {
        if (request.headers.authorization !== process.env.ENDPOINT_API_KEY) {
            reply.status(403).send({ message: "Invalid API key" });
        } else {
            next();
        }
    });
}
