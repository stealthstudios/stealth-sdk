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
 * @property {string[]} topics - Topics to discuss
 * @property {string[]} adjectives - Adjectives to describe the personality
 * @property {string[]} style - Style of the personality
 */

/**
 * @typedef {Object} FunctionParameter
 * @property {string} name - Name of the parameter
 * @property {string} description - Description of what the parameter does
 * @property {("string"|"number"|"boolean")} type - Type of the parameter
 */

/**
 * @typedef {Object} Function
 * @property {string} [description] - Optional description of what the function does
 * @property {Object.<string, FunctionParameter>} parameters - Map of parameter names to their definitions
 * @property {function(string, Object.<string, *>): void} callback - Function to execute with player ID and args
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

    async create(_personality, functions = [], users = [], persistenceToken) {
        const personality = JSON.parse(JSON.stringify(_personality));

        const formattedFunctions = [];

        if (functions) {
            for (const [name, func] of Object.entries(functions)) {
                formattedFunctions.push({
                    name: name,
                    similes: func.similes,
                    description: func.description,
                    parameters: func.parameters,
                });
            }
        }

        if (personality.style) {
            personality.style = {
                all: [...personality.style],
            };
        }

        try {
            const response = await axios.post(
                `${this.#wrapperData.url}/api/conversation/create`,
                {
                    persistenceToken,
                    personality,
                    users,
                    functions: formattedFunctions,
                },
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
                            if (datastoreData.fieldsMutator) {
                                fields = datastoreData.fieldsMutator(fields);

                                for (const [key, value] of Object.entries(
                                    fields,
                                )) {
                                    if (value === undefined) {
                                        delete fields[key];
                                    }
                                }
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
