import wrapper from "./wrapper.js";
import Character from "./character.js";

export default class ChatbotInterface {
    /**
     * @type {import('./wrapper.js').ConversationWrapper}
     */
    apiWrapper;

    /**
     * @param {string} url - URL of the chatbot API
     * @param {string} auth - Authorization token
     */
    constructor(url, auth) {
        this.apiWrapper = new wrapper({ url, auth });
    }

    /**
     * Creates a new character
     * @param {import('./wrapper.js').Personality} personality - Personality configuration
     * @returns {import('./character.js').Character}
     */
    createCharacter(personality) {
        return new Character(personality, this.apiWrapper);
    }
}
