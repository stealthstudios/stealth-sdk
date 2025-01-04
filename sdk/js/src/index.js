import wrapper from "./wrapper.js";
import Character from "./character.js";

export default class ChatbotInterface {
    /**
     * @type {import('./wrapper.js').ConversationWrapper}
     */
    apiWrapper;

    /**
     * @param {import("./wrapper.js").SDKData} data - Configuration data
     */
    constructor(data) {
        this.apiWrapper = new wrapper(data);
    }

    /**
     * Creates a new character
     * @param {import('./wrapper.js').Personality} personality - Personality configuration
     * @param {import('./wrapper.js').Function[]} [functions] - Functions to add to the character
     * @returns {import('./character.js').Character}
     */
    createCharacter(personality, functions = []) {
        return new Character(personality, functions, this.apiWrapper);
    }
}
