export default class ConversationMessage {
    /** @type {"user" | "assistant" | "system"} */
    role;
    /** @type {string} */
    content;
    /** @type {string | null} */
    sender;
    /** @type {Date} */
    timestamp;

    constructor(role, content, sender, timestamp) {
        this.role = role;
        this.content = content;
        this.sender = sender;
        this.timestamp = timestamp;
    }

    toOpenAIMessage() {
        return {
            role: this.role,
            content: this.content,
        };
    }
}
