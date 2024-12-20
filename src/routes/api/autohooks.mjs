import logger from "#utils/logger.js";

/** @param { import('fastify').FastifyInstance } app */
export default async function (app) {
    // Validate API key on each request
    app.addHook("onRequest", (request, reply, next) => {
        const isValidApiKey =
            request.headers.authorization === process.env.ENDPOINT_API_KEY;

        if (!isValidApiKey) {
            return reply.status(403).send({ message: "Invalid API key" });
        }

        next();
    });

    // Log any errors that occur
    app.addHook("onError", (_, __, error, next) => {
        logger.error(error);
        next();
    });
}
