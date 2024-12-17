import Conversation from "#classes/conversation.js";
import prismaClient from "#utils/prisma.js";
import {
    generatePersonalityHash,
    generatePersonalityPrompt,
} from "#utils/personalityUtils.js";
import logger from "#utils/logger.js";

/**
 * Manages conversation creation and retrieval.
 * Acts as a wrapper around Prisma to ensure consistent class instantiation.
 */
class ConversationManager {
    /**
     * Creates a new conversation with the given personality and users
     * @param { {
     *     name: string,
     *     bio: Array<string>,
     *     lore: Array<string>,
     *     knowledge: Array<string>,
     *     messageExamples: Array<Array<{ user: string, content: string }>>,
     *     systemMessage: string
     * } } personality - The personality configuration object
     * @param { Array<{ id: string, name: string }> } users - Array of users to add to conversation
     * @param { string } persistenceToken - Token for persisting the conversation
     * @returns { Promise<Conversation> } The created conversation instance
     * @throws { Error } If conversation creation fails
     */
    async createConversation(personality, users, persistenceToken) {
        const personalityHash = generatePersonalityHash(personality);
        const personalityRecord = await this.getOrCreatePersonality(
            personality,
            personalityHash,
        );

        const fetchedConversation = await prismaClient.conversation.create({
            data: {
                persistenceToken,
                personalityId: personalityRecord.id,
                users: {
                    connectOrCreate: users.map((user) => ({
                        where: { id: user.id },
                        create: {
                            id: user.id,
                            name: user.name,
                        },
                    })),
                },
            },
        });

        if (!fetchedConversation) {
            throw new Error("Failed to create conversation");
        }

        return new Conversation(fetchedConversation);
    }

    /**
     * Gets a conversation by its ID
     * @param { string } id - The conversation ID
     * @returns { Promise<Conversation | null> } The conversation instance or null if not found
     */
    async getConversation(id) {
        const conversation = await prismaClient.conversation.findUnique({
            where: { id },
        });

        return conversation ? new Conversation(conversation) : null;
    }

    /**
     * Gets a conversation by its secret
     * @param { string } secret - The conversation secret
     * @returns { Promise<Conversation | null> } The conversation instance or null if not found
     */
    async getConversationBySecret(secret) {
        const conversation = await prismaClient.conversation.findFirst({
            where: { secret },
        });

        return conversation ? new Conversation(conversation) : null;
    }

    /**
     * Gets a conversation by its persistence token
     * @param { string } persistenceToken - The persistence token
     * @returns { Promise<Conversation | null> } The conversation instance or null if not found
     */
    async getConversationByPersistenceToken(persistenceToken) {
        const conversation = await prismaClient.conversation.findFirst({
            where: { persistenceToken },
        });

        return conversation ? new Conversation(conversation) : null;
    }

    /**
     * Creates or retrieves a personality record
     * @private
     * @param { Object } personality - The personality configuration
     * @param { string } personalityHash - Hash of the personality configuration
     * @returns { Promise<Object> } The personality record
     */
    async getOrCreatePersonality(personality, personalityHash) {
        const existingRecord = await prismaClient.personality.findUnique({
            where: { hash: personalityHash },
        });

        if (existingRecord) {
            return existingRecord;
        }

        logger.debug(
            `Registered new personality ${personality.name} with hash ${personalityHash}`,
        );

        return prismaClient.personality.create({
            data: {
                hash: personalityHash,
                name: personality.name,
                prompt: generatePersonalityPrompt(personality),
            },
        });
    }
}

export default new ConversationManager();
