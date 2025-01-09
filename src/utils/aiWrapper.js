import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { agents } from "./eliza/index.js";

class AIWrapper {
    /**
     * @type {string}
     */
    agentProvider;

    /**
     * @type {string}
     */
    model;

    /**
     * @type {string}
     */
    apiKey;

    aiClass;

    constructor(agentProvider, model, apiKey) {
        this.agentProvider = agentProvider;
        this.model = model;
        this.apiKey = apiKey;

        if (agentProvider === "eliza") {
            return;
        }

        switch (model) {
            case "openai":
                this.aiClass = new OpenAI({ apiKey });
                break;

            case "anthropic":
                this.aiClass = new Anthropic({ apiKey });
                break;

            case "deepseekv3":
                this.aiClass = new OpenAI({
                    baseURL: "https://api.deepseek.com",
                    apiKey,
                });
                break;

            default:
                throw new Error("Invalid model");
        }
    }

    async query(messages, tools, system, elizaData) {
        if (this.agentProvider === "eliza") {
            return await this.handleElizaQuery(messages, tools, elizaData);
        }

        switch (this.model) {
            case "openai":
                return await this.handleOpenAIQuery(messages, tools);
            case "anthropic":
                return await this.handleAnthropicQuery(messages, tools, system);
            case "deepseekv3":
                return await this.handleDeepseekQuery(messages, tools);
            default:
                throw new Error("Invalid model");
        }
    }

    async handleElizaQuery(messages, tools, elizaData) {
        const agent = agents.get(elizaData.agentName);
        const robloxClient = agent.client;
        const response = await robloxClient.handleMessage({
            agentId: agent.agentId,
            roomId: elizaData.roomId,
            userId: elizaData.userId,
            userName: elizaData.userName,
            name: elizaData.agentName,
            text: messages[messages.length - 1].content,
            context: messages[messages.length - 2].content,
            tools,
        });

        return {
            message: response.find((r) => r.text)?.text,
            action: response.find((r) => r.action && r.data),
        };
    }

    async handleOpenAIQuery(messages, tools) {
        const response = await this.aiClass.chat.completions.create({
            messages,
            tools,
            model: "gpt-4o",
        });

        if (!response.choices[0]) {
            return null;
        }

        return {
            tool_calls: response.choices[0].message.tool_calls,
            message: response.choices[0].message.content,
        };
    }

    async handleAnthropicQuery(messages, tools, system) {
        const remappedTools = tools.map((tool) => ({
            name: tool.function.name,
            description: tool.function.description,
            input_schema: tool.function.parameters,
        }));

        const response = await this.aiClass.messages.create({
            messages,
            model: "claude-3-5-sonnet-latest",
            system,
            max_tokens: 1024,
            tools: remappedTools,
        });

        const toolCalls = response.content
            .filter((entry) => entry.type === "tool_use")
            .map((entry) => ({
                function: {
                    name: entry.name,
                    arguments: JSON.stringify(entry.input),
                },
            }));

        return {
            message: response.content.find((entry) => entry.type === "text")
                ?.text,
            tool_calls: toolCalls.length > 0 ? toolCalls : null,
        };
    }

    async handleDeepseekQuery(messages, tools) {
        const response = await this.aiClass.chat.completions.create({
            messages,
            tools,
            model: "deepseek-chat",
        });

        if (!response.choices[0]) {
            return null;
        }

        return {
            tool_calls: response.choices[0].message.tool_calls,
            message: response.choices[0].message.content,
        };
    }

    async moderate(input) {
        if (this.agentProvider === "eliza") {
            return { flagged: false };
        }

        if (this.model === "openai") {
            const response = await this.aiClass.moderations.create({
                input,
                model: "omni-moderation-latest",
            });
            return response.results[0];
        }

        return { flagged: false };
    }
}

export default new AIWrapper(
    process.env.AGENT_PROVIDER,
    process.env.PROVIDER,
    process.env.AI_API_KEY,
);
