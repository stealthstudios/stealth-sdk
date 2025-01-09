import "dotenv/config";
import logger from "#utils/logger.js";
import server from "#src/server.js";
import fastifyAutoload from "@fastify/autoload";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const REQUIRED_ENV_VARS = ["AI_API_KEY", "ENDPOINT_API_KEY", "PROVIDER"];

async function startServer() {
    // Validate required environment variables
    const missingEnvVars = REQUIRED_ENV_VARS.filter(
        (envVar) => !process.env[envVar],
    );

    if (missingEnvVars.length > 0) {
        const missingVarsStr = missingEnvVars.join(", ");
        logger.error(`Missing environment variables: ${missingVarsStr}`);
        process.exit(1);
    }

    // Check development environment
    const isDevelopment = process.env.ENVIRONMENT === "development";
    if (isDevelopment) {
        logger.warn("Running in development mode - API keys are exposed!");
    }

    // Set up server configuration
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const routesDir = join(__dirname, "routes");

    await server.register(fastifyAutoload, {
        dir: routesDir,
        autoHooks: true,
        cascadeHooks: true,
    });

    // Start server
    const port = process.env.SERVER_PORT || 3000;
    const host = "0.0.0.0";

    await server.listen({ port, host });
    logger.info(`Server is running on port ${port}`);
}

startServer();
