import Conversation from "#classes/conversation.js";
import database from "#utils/database.js";
import ConversationMessage from "#classes/conversationMessage.js";
import Player from "#classes/player.js";

function deserializeDataEntry(dataEntry) {
    const conversation = new Conversation(
        dataEntry.id,
        dataEntry.secret,
        dataEntry.prompt,
        [],
    );

    if (dataEntry.messageHistory && dataEntry.messageHistory.length > 1) {
        dataEntry.messageHistory.slice(1).forEach((message) => {
            conversation.messageHistory.push(
                new ConversationMessage(
                    message.role,
                    message.content,
                    message.sender,
                    message.timestamp,
                ),
            );
        });
    }

    if (dataEntry.players) {
        dataEntry.players.forEach((player) => {
            conversation.addPlayer(new Player(player.id, player.name));
        });
    }

    return conversation;
}

// Singleton class that manages conversations, allowing adding, removing, updating and retrieving conversations.
class ConversationManager {
    /** @type {import("./conversation").default[]} */
    conversations = [];

    constructor() {
        this.conversations = Object.values(database.getAll()).map(
            deserializeDataEntry,
        );
    }

    createConversation(prompt, players) {
        const id = this._getNextId();
        const secret = this._generateSecret();

        const conversation = new Conversation(id, secret, prompt, players);
        this.conversations.push(conversation);

        return conversation;
    }

    getConversation(id) {
        return this.conversations.find(
            (conversation) => conversation.id === id,
        );
    }

    getConversationBySecret(secret) {
        return this.conversations.find(
            (conversation) => conversation.secret === secret,
        );
    }

    endConversation(conversation) {
        this.conversations = this.conversations.filter(
            (c) => c.id !== conversation.id,
        );
    }

    async sendMessage(conversation, message) {
        return await conversation.sendMessage(message);
    }

    _getNextId() {
        return this.conversations.length + 1;
    }

    _generateSecret() {
        const uuid = crypto.randomUUID();

        // just in case!
        if (
            this.conversations.some(
                (conversation) => conversation.secret === uuid,
            )
        ) {
            return this._generateSecret();
        }

        return uuid;
    }
}

export default new ConversationManager();
