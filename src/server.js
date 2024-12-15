import fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import apiReference from "@scalar/fastify-api-reference";

const server = fastify();
server.register(cors);
server.register(swagger, {
    openapi: {
        openapi: "3.0.0",
        info: {
            title: "Chatbot AI Engine",
            description: "API documentation for the Chatbot AI Engine",
            version: "1.0.0",
        },
        tags: [
            {
                name: "conversation",
                description: "Conversation related endpoints",
            },
            {
                name: "debug",
            },
        ],
        components: {
            securitySchemes: {
                endpointAuth: {
                    type: "apiKey",
                    in: "header",
                    name: "Authorization",
                    description: "Endpoint API key",
                },
            },
        },
    },
});

/** @type {import('@scalar/fastify-api-reference').FastifyApiReferenceOptions} */
const apiReferenceOptions = {
    routePrefix: "/reference",
    configuration: {
        authentication: {
            preferredSecurityScheme: "endpointAuth",
            apiKey: {
                token:
                    process.env.ENVIRONMENT == "development"
                        ? process.env.ENDPOINT_API_KEY
                        : null,
            },
        },
    },
};

server.register(apiReference, apiReferenceOptions);

export default server;
