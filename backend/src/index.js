import "dotenv/config";
import logger from "#utils/logger.js";
import server from "#src/server.js";
import fastifyAutoload from "@fastify/autoload";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const REQUIRED_ENV_VARS = [
    "SERVER_PORT",
    "OPENAI_API_KEY", 
    "ENDPOINT_API_KEY",
    "POSTGRES_USER",
    "POSTGRES_PASSWORD",
    "POSTGRES_DB"
];

async function startServer() {
    // Validate environment variables
    const missingEnvVars = REQUIRED_ENV_VARS.filter(envVar => !process.env[envVar]);
    if (missingEnvVars.length > 0) {
        logger.error(`Missing environment variables: ${missingEnvVars.join(", ")}`);
        process.exit(1);
    }

    if (process.env.ENVIRONMENT === "development") {
        logger.warn("Running in development mode - API keys are exposed!");
    }

    // Set up file paths
    const __dirname = dirname(fileURLToPath(import.meta.url));
    
    // Configure server
    server.register(fastifyAutoload, {
        dir: join(__dirname, "routes"),
        autoHooks: true,
        cascadeHooks: true
    });

    // Start server
    await server.listen({ port: process.env.SERVER_PORT });
    logger.info(`Server is running on port ${process.env.SERVER_PORT}`);
}

startServer();
