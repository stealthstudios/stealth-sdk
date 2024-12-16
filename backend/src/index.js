import "dotenv/config";
import logger from "#utils/logger.js";
import server from "#src/server.js";
import fastifyAutoload from "@fastify/autoload";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const requiredEnvVars = ["SERVER_PORT", "OPENAI_API_KEY", "ENDPOINT_API_KEY"];

async function main() {
    // check if all environment variables are set
    const missingEnvVars = requiredEnvVars.filter(
        (envVar) => !process.env[envVar],
    );

    let a = ""

    if (missingEnvVars.length > 0) {
        logger.error(
            `Missing environment variables: ${missingEnvVars.join(", ")}`,
        );
        process.exit(1);
    }

    if (process.env.ENVIRONMENT == "development") {
        logger.warn("Running in development mode - API keys are exposed!");
    }

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    server.register(fastifyAutoload, {
        dir: join(__dirname, "routes"),
        autoHooks: true,
        cascadeHooks: true,
    });

    server.listen({ port: process.env.SERVER_PORT });
    logger.info(`Server is running on port ${process.env.SERVER_PORT}`);
}

main();
