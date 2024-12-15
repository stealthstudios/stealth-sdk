import client from "#utils/openai.js";
import ConversationMessage from "./conversationMessage.js";

export default class Conversation {
    /** @type {string} */
    id;
    /** @type {import("./player").default[]} */
    players = [];
    /** @type {import("./conversationMessage").default[]} */
    messageHistory = [];
    /** @type {string} */
    secret;
    /** @type {string} */
    prompt;

    constructor(id, secret, prompt, players) {
        this.id = id;
        this.secret = secret;
        this.players = players;
        this.prompt = prompt;

        this.messageHistory.push(
            new ConversationMessage("system", this.prompt, null, new Date()),
        );
    }

    async formatMessage(message) {
        const player = this.players.find((p) => p.id === message.sender);

        if (!player) {
            throw new Error("Player not found");
        }

        return {
            role: message.role,
            content: `
               Message from ${player.name}: "${message.content}"
            `,
        };
    }

    addPlayer(player) {
        this.players.push(player);
    }

    removePlayer(playerId) {
        this.players = this.players.filter((p) => p.id !== playerId);
    }

    async sendMessage(message) {
        // build the message history
        const messages = this.messageHistory.map((m) => m.toOpenAIMessage());

        const userMessage = await this.formatMessage(message);

        messages.push(userMessage);

        let response;

        try {
            response = await client.chat.completions.create({
                model: "gpt-4o",
                messages,
            });

            if (!response.choices[0].message.content) {
                throw new Error("No response from OpenAI");
            }

            this.messageHistory.push(
                new ConversationMessage(
                    "user",
                    message.content,
                    message.sender,
                    new Date(),
                ),
            );
            this.messageHistory.push(
                new ConversationMessage(
                    "assistant",
                    response.choices[0].message.content,
                    null,
                    new Date(),
                ),
            );
        } catch (error) {
            throw new Error(error);
        }

        return response.choices[0].message.content;
    }
}
