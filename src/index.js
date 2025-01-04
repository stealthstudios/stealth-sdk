import "dotenv/config";
import logger from "#utils/logger.js";
import server from "#src/server.js";
import fastifyAutoload from "@fastify/autoload";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const REQUIRED_ENV_VARS = ["AI_API_KEY", "ENDPOINT_API_KEY", "PROVIDER"];

async function startServer() {
    // Validate environment variables
    const missingEnvVars = REQUIRED_ENV_VARS.filter(
        (envVar) => !process.env[envVar],
    );
    if (missingEnvVars.length > 0) {
        logger.error(
            `Missing environment variables: ${missingEnvVars.join(", ")}`,
        );
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
        cascadeHooks: true,
    });

    const port = process.env.SERVER_PORT || 3000;

    server.listen({ port, host: "0.0.0.0" });
    logger.info(`Server is running on port ${port}`);
}

startServer();
