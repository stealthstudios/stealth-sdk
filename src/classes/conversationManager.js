import Conversation from "#classes/conversation.js";
import prismaClient from "#utils/prisma.js";
import {
    generatePersonalityHash,
    generatePersonalityPrompt,
} from "#utils/personalityUtils.js";
import logger from "#utils/logger.js";
import { startAgent, agents } from "#utils/eliza/index.js";

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
    async createConversation(personality, functions, users, persistenceToken) {
        const personalityHash = generatePersonalityHash(personality, functions);
        const personalityRecord = await this.getOrCreatePersonality(
            personality,
            functions,
            personalityHash,
        );

        const conversation = await prismaClient.conversation.create({
            data: {
                persistenceToken,
                personalityId: personalityRecord.id,
                users: {
                    connectOrCreate: users.map((user) => ({
                        where: { id: user.id },
                        create: { id: user.id, name: user.name },
                    })),
                },
            },
        });

        if (!conversation) {
            throw new Error("Failed to create conversation");
        }

        return new Conversation(conversation);
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
    async getConversationByPersistenceToken(persistenceToken, personalityHash) {
        const conversation = await prismaClient.conversation.findFirst({
            where: { persistenceToken },
            include: {
                personality: true,
            },
        });

        if (conversation.personality.hash !== personalityHash) {
            await prismaClient.conversation.delete({
                where: { id: conversation.id },
            });
            return null;
        }

        return conversation ? new Conversation(conversation) : null;
    }

    /**
     * Creates or retrieves a personality record
     * @private
     * @param { Object } personality - The personality configuration
     * @param { Object } functions - The functions configuration
     * @param { string } personalityHash - Hash of the personality configuration
     * @returns { Promise<Object> } The personality record
     */
    async getOrCreatePersonality(personality, functions, personalityHash) {
        const existingRecord = await prismaClient.personality.findUnique({
            where: { hash: personalityHash },
        });

        personality.messageExamples = personality.messageExamples.map(
            (exampleCollection) =>
                exampleCollection.map((example) => ({
                    user: example.user,
                    content: {
                        text: example.content,
                    },
                })),
        );

        if (existingRecord) {
            if (
                !agents.has(personalityHash) &&
                process.env.AGENT_PROVIDER === "eliza"
            ) {
                await startAgent(personality, personalityHash);
            }
            return existingRecord;
        }

        logger.debug(
            `Registered new personality ${personality.name} with hash ${personalityHash}`,
        );

        if (
            !agents.has(personalityHash) &&
            process.env.AGENT_PROVIDER === "eliza"
        ) {
            await startAgent(personality, personalityHash);
        }

        return prismaClient.personality.create({
            data: {
                name: personality.name,
                hash: personalityHash,
                prompt: generatePersonalityPrompt(personality),
                personality,
                functions,
            },
        });
    }
}

export default new ConversationManager();
