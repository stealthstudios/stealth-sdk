import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

class AIWrapper {
    /**
     * @type {string}
     */
    model;

    /**
     * @type {string}
     */
    apiKey;

    aiClass;

    constructor(model, apiKey) {
        this.model = model;
        this.apiKey = apiKey;

        switch (model) {
            case "openai":
                this.aiClass = new OpenAI({
                    apiKey: apiKey,
                });

                break;
            case "anthropic":
                this.aiClass = new Anthropic({
                    apiKey: apiKey,
                });

                break;
            case "deepseekv3":
                this.aiClass = new OpenAI({
                    baseURL: "https://api.deepseek.com",
                    apiKey: apiKey,
                });

                break;
            default:
                throw new Error("Invalid model");
        }
    }

    async query(messages, tools, system) {
        switch (this.model) {
            case "openai": {
                const response = await this.aiClass.chat.completions.create({
                    messages: messages,
                    tools: tools,
                    model: "gpt-4o",
                });

                return response.choices[0]
                    ? {
                          tool_calls: response.choices[0].message.tool_calls,
                          message: response.choices[0].message.content,
                      }
                    : null;
            }
            case "anthropic": {
                const remappedTools = tools.map((tool) => ({
                    name: tool.function.name,
                    description: tool.function.description,
                    input_schema: tool.function.parameters,
                }));

                const response = await this.aiClass.messages.create({
                    messages: messages,
                    model: "claude-3-5-sonnet-latest",
                    system: system,
                    max_tokens: 1024,
                    tools: remappedTools,
                });

                const toolCalls = response.content
                    .filter((entry) => entry.type == "tool_use")
                    .map((entry) => ({
                        function: {
                            name: entry.name,
                            arguments: JSON.stringify(entry.input),
                        },
                    }));

                return {
                    // find entry where "type" is text
                    message: response.content.find(
                        (entry) => entry.type === "text",
                    )?.text,
                    tool_calls: toolCalls.length > 0 ? toolCalls : null,
                };
            }
            case "deepseekv3": {
                const response = await this.aiClass.chat.completions.create({
                    messages: messages,
                    tools: tools,
                    model: "deepseek-chat",
                });

                return response.choices[0]
                    ? {
                          tool_calls: response.choices[0].message.tool_calls,
                          message: response.choices[0].message.content,
                      }
                    : null;
            }
            default:
                throw new Error("Invalid model");
        }
    }

    // Only OpenAI supports moderation
    async moderate(input) {
        switch (this.model) {
            case "openai": {
                const response = await this.aiClass.moderations.create({
                    input: input,
                    model: "omni-moderation-latest",
                });

                return response.results[0];
            }
            default:
                return { flagged: false };
        }
    }
}

export default new AIWrapper(process.env.PROVIDER, process.env.AI_API_KEY);
