export class Conversation {
    /**
     * @private
     * @type {import('./wrapper.js').ConversationWrapper}
     */
    #wrapper;
    /**
     * @type {import('./wrapper.js').User[]}
     */
    users;

    /**
     * @private
     * @type {string}
     */
    #id;

    /**
     * @private
     * @type {string}
     */
    #secret;

    /**
     * @type boolean
     */
    finished = false;

    /**
     * @param {string} id - Conversation ID
     * @param {string} secret - Conversation secret
     * @param {import('./wrapper.js').ConversationWrapper} wrapper - Conversation wrapper
     */
    constructor(id, secret, wrapper) {
        this.#id = id;
        this.#secret = secret;
        this.#wrapper = wrapper;

        this.users = [];
    }

    async addUser(user) {
        this.users.push(user);
        await this.#wrapper.update(
            {
                id: this.#id,
                secret: this.#secret,
            },

            this.users,
        );
    }

    async removeUser(user) {
        this.users = this.users.filter((u) => u.id !== user.id);
        await this.#wrapper.update(
            {
                id: this.#id,
                secret: this.#secret,
            },
            this.users,
        );
    }

    /**
     * Sends a message to the conversation
     * @param {number} - ID of user sending the message
     * @param {string} message - Message content
     * @param {Object.<string, any>} [context] - Additional context
     * @returns {Promise<{flagged: boolean, content: string}|null>}
     */
    async send(id, message, context) {
        return this.#wrapper.send(
            {
                id: this.#id,
                secret: this.#secret,
            },
            message,
            context,
            id,
        );
    }

    async finish() {
        if (this.finished) {
            return;
        }

        this.finished = true;
        await this.#wrapper.finish({
            id: this.#id,
            secret: this.#secret,
        });
    }

    containsPlayer(player) {
        return this.users.some((user) => user.id === player.id);
    }

    isEmpty() {
        return this.users.length === 0;
    }

    destroy() {
        this.finish();
    }
}
