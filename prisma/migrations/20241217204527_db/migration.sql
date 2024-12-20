/*
  Warnings:

  - You are about to drop the column `bio` on the `Personality` table. All the data in the column will be lost.
  - You are about to drop the column `generatedPrompt` on the `Personality` table. All the data in the column will be lost.
  - You are about to drop the column `knowledge` on the `Personality` table. All the data in the column will be lost.
  - You are about to drop the column `lore` on the `Personality` table. All the data in the column will be lost.
  - You are about to drop the `ExampleConversation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ExampleConversationMessage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ExampleConversation" DROP CONSTRAINT "ExampleConversation_personalityId_fkey";

-- DropForeignKey
ALTER TABLE "ExampleConversationMessage" DROP CONSTRAINT "ExampleConversationMessage_exampleConversationId_fkey";

-- AlterTable
ALTER TABLE "Personality" DROP COLUMN "bio",
DROP COLUMN "generatedPrompt",
DROP COLUMN "knowledge",
DROP COLUMN "lore",
ADD COLUMN     "prompt" TEXT;

-- DropTable
DROP TABLE "ExampleConversation";

-- DropTable
DROP TABLE "ExampleConversationMessage";
