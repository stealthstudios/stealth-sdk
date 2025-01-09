import {
    ModelProviderName,
    settings,
    validateCharacterConfig,
} from "@elizaos/core";
import fs from "fs";
import path from "path";
import yargs from "yargs";

export function parseArguments() {
    try {
        return yargs(process.argv.slice(2))
            .option("character", {
                type: "string",
                description: "Path to the character JSON file",
            })
            .option("characters", {
                type: "string",
                description:
                    "Comma separated list of paths to character JSON files",
            })
            .parseSync();
    } catch (error) {
        console.error("Error parsing arguments:", error);
        return {};
    }
}

export async function loadCharacters(charactersArg) {
    if (!charactersArg) {
        return [];
    }

    const characterPaths = charactersArg.split(",").map((filePath) => {
        const trimmedPath = filePath.trim();
        if (path.basename(trimmedPath) === trimmedPath) {
            return path.resolve(process.cwd(), "../characters/", trimmedPath);
        }
        return path.resolve(process.cwd(), trimmedPath);
    });

    const loadedCharacters = [];

    for (const characterPath of characterPaths) {
        try {
            const fileContents = fs.readFileSync(characterPath, "utf8");
            const character = JSON.parse(fileContents);
            validateCharacterConfig(character);
            loadedCharacters.push(character);
        } catch (error) {
            console.error(
                `Error loading character from ${characterPath}: ${error}`,
            );
            process.exit(1);
        }
    }

    return loadedCharacters;
}

export function getTokenForProvider(provider, character) {
    const characterSecrets = character.settings?.secrets;

    switch (provider) {
        case ModelProviderName.OPENAI:
            return characterSecrets?.OPENAI_API_KEY || settings.OPENAI_API_KEY;

        case ModelProviderName.LLAMACLOUD: {
            const possibleTokens = [
                characterSecrets?.LLAMACLOUD_API_KEY,
                settings.LLAMACLOUD_API_KEY,
                characterSecrets?.TOGETHER_API_KEY,
                settings.TOGETHER_API_KEY,
                characterSecrets?.XAI_API_KEY,
                settings.XAI_API_KEY,
                characterSecrets?.OPENAI_API_KEY,
                settings.OPENAI_API_KEY,
            ];
            return possibleTokens.find((token) => token);
        }

        case ModelProviderName.ANTHROPIC: {
            const possibleTokens = [
                characterSecrets?.ANTHROPIC_API_KEY,
                characterSecrets?.CLAUDE_API_KEY,
                settings.ANTHROPIC_API_KEY,
                settings.CLAUDE_API_KEY,
            ];
            return possibleTokens.find((token) => token);
        }

        case ModelProviderName.REDPILL:
            return (
                characterSecrets?.REDPILL_API_KEY || settings.REDPILL_API_KEY
            );

        case ModelProviderName.OPENROUTER:
            return characterSecrets?.OPENROUTER || settings.OPENROUTER_API_KEY;

        case ModelProviderName.GROK:
            return characterSecrets?.GROK_API_KEY || settings.GROK_API_KEY;

        case ModelProviderName.HEURIST:
            return (
                characterSecrets?.HEURIST_API_KEY || settings.HEURIST_API_KEY
            );

        case ModelProviderName.GROQ:
            return characterSecrets?.GROQ_API_KEY || settings.GROQ_API_KEY;
    }
}
