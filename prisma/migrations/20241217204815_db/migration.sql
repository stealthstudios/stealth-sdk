-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_personalityId_fkey";

-- AlterTable
ALTER TABLE "Conversation" ALTER COLUMN "personalityId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_personalityId_fkey" FOREIGN KEY ("personalityId") REFERENCES "Personality"("id") ON DELETE SET NULL ON UPDATE CASCADE;
