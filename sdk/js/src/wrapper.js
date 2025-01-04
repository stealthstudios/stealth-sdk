import axios from "axios";
import { setConfig } from "openblox/config";
import {
    StandardDataStoresApi_V2,
    OrderedDataStoresApi_V2,
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
    #wrapperData = {};

    constructor(data) {
        this.#wrapperData = data;
        setConfig({ cloudKey: data.openCloudKey });
    }

    #formatDictionary(dictionary) {
        return Object.entries(dictionary).map(([key, value]) => ({
            key,
            value,
        }));
    }

    async create(personality, users = [], persistenceToken) {
        try {
            const response = await axios.post(
                `${this.#wrapperData.url}/api/conversation/create`,
                { persistenceToken, personality, users },
                { headers: { Authorization: this.#wrapperData.auth } },
            );

            if (!response.data) {
                throw new Error("No response data received");
            }

            return response.data;
        } catch (error) {
            console.warn("Failed to create conversation:", error.message);
            return null;
        }
    }

    async send(conversation, message, context = {}, id) {
        if (context.datastores) {
            const datastoresData = context.datastores;
            delete context.datastores;

            for (const datastoreData of datastoresData) {
                const params = {
                    universeId: datastoreData.universeId,
                    dataStore: datastoreData.datastoreName,
                    entryId: datastoreData.entryKey,
                    scope: datastoreData.scope,
                };

                try {
                    if (datastoreData.type === "standard") {
                        const { data } =
                            await StandardDataStoresApi_V2.standardDataStoreEntry(
                                params,
                            );
                        if (data?.value) {
                            let fields = data.value;
                            if (datastoreData.fieldsPredicate) {
                                fields = datastoreData.fieldsPredicate(fields);
                            }
                            Object.assign(context, fields);
                        }
                    } else if (datastoreData.type === "ordered") {
                        const { data } =
                            await OrderedDataStoresApi_V2.orderedDataStoreEntry(
                                params,
                            );
                        if (data) {
                            context[data.fieldName] = data.value;
                        }
                    }
                } catch (error) {
                    console.warn(
                        `Failed to fetch ${datastoreData.type} datastore:`,
                        error.message,
                    );
                }
            }
        }

        try {
            const response = await axios.post(
                `${this.#wrapperData.url}/api/conversation/send`,
                {
                    secret: conversation.secret,
                    context: Object.keys(context).length
                        ? this.#formatDictionary(context)
                        : [],
                    message,
                    playerId: id,
                },
                { headers: { Authorization: this.#wrapperData.auth } },
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

    async update(conversation, users = []) {
        try {
            await axios.post(
                `${this.#wrapperData.url}/api/conversation/update`,
                { secret: conversation.secret, users },
                { headers: { Authorization: this.#wrapperData.auth } },
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

    async finish(conversation) {
        try {
            await axios.post(
                `${this.#wrapperData.url}/api/conversation/finish`,
                { secret: conversation.secret },
                { headers: { Authorization: this.#wrapperData.auth } },
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
