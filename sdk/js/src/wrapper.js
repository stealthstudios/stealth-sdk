import axios from "axios";
import { setConfig } from "openblox/config";
import {
    StandardDataStoresApi_V2,
    OrderedDataStoresApi_V2,
    MemoryStoresApi,
} from "openblox/cloud";

/**
 * @typedef {Object} SDKData
 * @property {string} url - URL of the chatbot API
 * @property {string} auth - Authorization token
 * @property {string} openCloudKey - OpenCloud key for Roblox APIs
 */

/**
 * @typedef {Object} Personality
 * @property {string} name - Name of the personality
 * @property {string[]} bio - Biography details
 * @property {string[]} lore - Lore/background information
 * @property {string[]} knowledge - Knowledge base
 * @property {Array<Array<{user: string, content: string}>>} messageExamples - Example conversation flows
 */

/**
 * @typedef {Object} User
 * @property {number} id - Unique user ID
 * @property {string} name - User name
 */

/**
 * @typedef {Object} ConversationData
 * @property {string} id - Unique conversation ID
 * @property {string} secret - Secret token for the conversation
 */

export default class ConversationWrapper {
    /** @type {SDKData} */
    #wrapperData = {};

    /**
     * Formats a dictionary into an array of key-value pairs
     * @param {Object.<string, string>} dictionary - Dictionary to format
     * @returns {Array<{key: string, value: string}>}
     */
    #formatDictionary(dictionary) {
        return Object.entries(dictionary).map(([key, value]) => ({
            key,
            value,
        }));
    }

    /**
     * Initializes the wrapper with configuration data
     * @param {SDKData} data - Configuration data
     */
    constructor(data) {
        this.#wrapperData = data;

        setConfig({
            cloudKey: data.openCloudKey,
        });
    }

    /**
     * Creates a new conversation
     * @param {Personality} personality - Personality configuration
     * @param {Array<{User}>} [users] - Array of users
     * @param {string} [persistenceToken] - Token for conversation persistence
     * @returns {Promise<ConversationData|null>}
     */
    async create(personality, users, persistenceToken) {
        try {
            const response = await axios.post(
                `${this.#wrapperData.url}/api/conversation/create`,
                {
                    persistenceToken,
                    personality,
                    users: users || [],
                },
                {
                    headers: { Authorization: this.#wrapperData.auth },
                },
            );

            if (!response.data) {
                throw new Error(response);
            }

            return response.data;
        } catch (error) {
            console.warn(`Failed to create conversation:`, error.message);
            return null;
        }
    }

    /**
     * Sends a message in a conversation
     * @param {ConversationData} conversation - Conversation data
     * @param {string} message - Message content
     * @param {Object.<string, string>} [context] - Additional context
     * @param {number} id - ID of user sending the message
     * @returns {Promise<{flagged: boolean, content: string}|null>}
     */
    async send(conversation, message, context, id) {
        if (context.datastore) {
            const datastoreData = context.datastore;
            context.datastore = null;

            switch (datastoreData.type) {
                case "standard": {
                    const { data } =
                        await StandardDataStoresApi_V2.standardDataStoreEntry({
                            universeId: datastoreData.universeId,
                            dataStore: datastoreData.datastoreName,
                            entryId: datastoreData.datastoreKey,
                            scope: datastoreData.scope,
                        });

                    if (data) {
                        let fields = data.value;

                        if (datastoreData.fieldsPredicate) {
                            fields = datastoreData.fieldsPredicate(fields);
                        }

                        if (fields) {
                            // inject fields into context
                            for (const [key, value] of Object.entries(fields)) {
                                context[key] = value;
                            }
                        }
                    }

                    break;
                }

                case "ordered": {
                    break;
                }

                case "memory": {
                    break;
                }
            }
        }

        try {
            const response = await axios.post(
                `${this.#wrapperData.url}/api/conversation/send`,
                {
                    secret: conversation.secret,
                    context: context ? this.#formatDictionary(context) : [],
                    message,
                    playerId: id,
                },
                {
                    headers: { Authorization: this.#wrapperData.auth },
                },
            );
            return response.data;
        } catch (error) {
            console.warn(
                `Failed to send message to conversation ${conversation.id}:`,
                error.message,
            );
            return null;
        }
    }

    /**
     * Updates a conversation
     * @param {ConversationData} conversation - Conversation to update
     * @param {Array<{id: string|number, name: string}>} [users] - Updated users
     * @returns {Promise<boolean>}
     */
    async update(conversation, users) {
        try {
            await axios.post(
                `${this.#wrapperData.url}/api/conversation/update`,
                {
                    secret: conversation.secret,
                    users: users || [],
                },
                {
                    headers: { Authorization: this.#wrapperData.auth },
                },
            );
            return true;
        } catch (error) {
            console.warn(
                `Failed to update conversation ${conversation.id}:`,
                error.message,
            );
            return false;
        }
    }

    /**
     * Finishes a conversation
     * @param {ConversationData} conversation - Conversation to finish
     * @returns {Promise<boolean>}
     */
    async finish(conversation) {
        try {
            await axios.post(
                `${this.#wrapperData.url}/api/conversation/finish`,
                {
                    secret: conversation.secret,
                },
                {
                    headers: { Authorization: this.#wrapperData.auth },
                },
            );
            return true;
        } catch (error) {
            console.warn(
                `Failed to finish conversation ${conversation.id}:`,
                error.message,
            );
            return false;
        }
    }
}
