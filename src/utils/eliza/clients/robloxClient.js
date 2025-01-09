import cors from "cors";
import express from "express";
import {
    elizaLogger,
    composeContext,
    generateMessageResponse,
    messageCompletionFooter,
    ModelClass,
    stringToUuid,
} from "@elizaos/core";

const MESSAGE_HANDLER_TEMPLATE = `# Action Examples
{{actionExamples}}
(Action examples are for reference only. Do not use the information from them in your response.)

# Knowledge
{{knowledge}}

# Task: Generate dialog and actions for the character {{agentName}}.
About {{agentName}}:
{{bio}}
{{lore}}

{{providers}}

{{messageDirections}}

{{message}}

{{actions}}

# Instructions: Write the next message for {{agentName}}.
${messageCompletionFooter}`;

export class RobloxClient {
    constructor() {
        elizaLogger.log("RobloxClient constructor");
        this.app = express();
        this.app.use(cors());
        this.agents = new Map();
    }

    async handleMessage(data) {
        const {
            agentId,
            userId = "user",
            roomId: rawRoomId,
            userName,
            text,
            context,
            tools,
        } = data;
        const roomId = stringToUuid(rawRoomId ?? `default-room-${agentId}`);
        const normalizedUserId = stringToUuid(userId);

        const runtime = this.findRuntime(agentId);
        if (!runtime) {
            return {
                status: 404,
                message: "Agent not found",
            };
        }

        await runtime.ensureConnection(
            normalizedUserId,
            roomId,
            userName,
            userName,
            "direct",
        );

        const messageId = stringToUuid(Date.now().toString());
        const userMessage = {
            content: {
                text,
                source: "direct",
                inReplyTo: undefined,
            },
            userId: normalizedUserId,
            roomId,
            agentId: runtime.agentId,
        };

        const memory = await this.createMemory(
            messageId,
            normalizedUserId,
            userMessage,
            runtime,
        );
        return await this.processMessage(memory, runtime, context, tools);
    }

    findRuntime(agentId) {
        let runtime = this.agents.get(agentId);
        if (!runtime) {
            runtime = Array.from(this.agents.values()).find(
                (agent) =>
                    agent.character.name.toLowerCase() ===
                    agentId.toLowerCase(),
            );
        }
        return runtime;
    }

    async createMemory(messageId, userId, userMessage, runtime) {
        const memory = {
            id: stringToUuid(`${messageId}-${userId}`),
            ...userMessage,
            agentId: runtime.agentId,
            userId,
            roomId: userMessage.roomId,
            content: userMessage.content,
            createdAt: Date.now(),
        };

        await runtime.messageManager.addEmbeddingToMemory(memory);
        await runtime.messageManager.createMemory(memory);

        return memory;
    }

    async processMessage(memory, runtime, injectedContext, tools) {
        runtime.providers = [
            {
                get: () => injectedContext,
            },
        ];

        // This is currently nonfunctional!
        // Eliza does not (as far as I know) support tools, so we can't receive parameters for these commands!
        if (tools) {
            runtime.actions = tools.map((tool) => ({
                name: tool.function.name,
                similes: tool.function.similes,
                description: tool.function.description,
                validate: () => true,
                examples: [],
                handler: () => {
                    // TODO: Look into this more
                },
                suppressInitialMessage: true,
            }));
        }

        let state = await runtime.composeState(memory, {
            agentName: runtime.character.name,
            message: memory.content.text,
        });

        const context = composeContext({
            state,
            template: MESSAGE_HANDLER_TEMPLATE,
        });

        const response = await generateMessageResponse({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        if (!response) {
            return {
                status: 500,
                message: "No response from generateMessageResponse",
            };
        }

        const responseMessage = await this.saveResponse(
            memory,
            response,
            runtime,
        );
        state = await runtime.updateRecentMessageState(state);

        let message = null;
        await runtime.processActions(
            memory,
            [responseMessage],
            state,
            async (newMessages) => {
                message = newMessages;
                return [memory];
            },
        );

        await runtime.evaluate(memory, state);

        return this.sendResponse(response, message, runtime);
    }

    async saveResponse(memory, response, runtime) {
        const responseMessage = {
            id: stringToUuid(`${memory.id}-${runtime.agentId}`),
            ...memory,
            userId: runtime.agentId,
            content: response,
            createdAt: Date.now(),
        };

        await runtime.messageManager.addEmbeddingToMemory(responseMessage);
        await runtime.messageManager.createMemory(responseMessage);
        return responseMessage;
    }

    sendResponse(response, message, runtime) {
        const action = runtime.actions.find((a) => a.name === response.action);
        const shouldSuppressInitialMessage = action?.suppressInitialMessage;

        if (!shouldSuppressInitialMessage) {
            return message ? [response, message] : [response];
        }
        return message ? [message] : [];
    }

    registerAgent(runtime) {
        this.agents.set(runtime.agentId, runtime);
    }

    unregisterAgent(runtime) {
        this.agents.delete(runtime.agentId);
    }

    start() {}

    stop() {}
}

export const RobloxClientInterface = {
    start: async () => {
        elizaLogger.log("RobloxClientInterface start");
        return new RobloxClient();
    },
    stop: async (_runtime, client) => {
        if (client instanceof RobloxClient) {
            client.stop();
        }
    },
};

export default RobloxClientInterface;
