/*
  Warnings:

  - Added the required column `prompt` to the `Conversation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_personalityId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_senderId_fkey";

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "prompt" TEXT NOT NULL,
ALTER COLUMN "personalityId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "role" TEXT NOT NULL,
ALTER COLUMN "senderId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_personalityId_fkey" FOREIGN KEY ("personalityId") REFERENCES "Personality"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
