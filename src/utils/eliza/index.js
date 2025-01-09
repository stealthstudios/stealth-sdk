import { AgentRuntime, elizaLogger } from "@elizaos/core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { initializeDbCache } from "./cache/index.js";
import { initializeClient } from "./clients/index.js";
import { getTokenForProvider } from "./config/index.js";
import { initializeDatabase } from "./database/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const wait = (minTime = 1000, maxTime = 3000) => {
    const waitTime =
        Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
    return new Promise((resolve) => setTimeout(resolve, waitTime));
};

export const agents = new Map();

function createAgent(character, db, cache, token) {
    elizaLogger.success(
        elizaLogger.successesTitle,
        "Creating runtime for character",
        character.name,
    );

    return new AgentRuntime({
        character,
        databaseAdapter: db,
        token,
        modelProvider: character.modelProvider,
        cacheManager: cache,
        evaluators: [],
        providers: [],
        actions: [],
        services: [],
        managers: [],
    });
}

export async function startAgent(character, hash) {
    try {
        // Set default character properties
        character.id = hash;
        character.username = character.username ?? character.name;
        character.modelProvider = character.modelProvider ?? "openai";
        character.clients = character.clients ?? [];
        character.postExamples = character.postExamples ?? [];
        character.style = character.style ?? {};
        character.style.all = character.style.all ?? [];
        character.style.chat = character.style.chat ?? [];
        character.style.post = character.style.post ?? [];

        // Initialize data directory
        const dataDir = path.join(__dirname, "../data");
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Set up database and cache
        const token = getTokenForProvider(character.modelProvider, character);
        const db = initializeDatabase(dataDir);
        await db.init();
        const cache = initializeDbCache(character, db);

        // Create and initialize runtime
        const runtime = createAgent(character, db, cache, token);
        agents.set(runtime.character.name, runtime);
        await runtime.initialize();

        // Set up client
        runtime.client = await initializeClient(character, runtime);
        runtime.client.registerAgent(runtime);

        elizaLogger.debug(`Started ${character.name} as ${runtime.agentId}`);
        return runtime;
    } catch (error) {
        elizaLogger.error(
            `Error starting agent for character ${character.name}:`,
            error,
        );
        console.error(error);
        throw error;
    }
}
