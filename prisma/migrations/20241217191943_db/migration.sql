/*
  Warnings:

  - The primary key for the `Conversation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `prompt` on the `Conversation` table. All the data in the column will be lost.
  - The `id` column on the `Conversation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Message` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Message` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `MessageContext` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `MessageContext` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `MessageExample` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `MessageExample` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `nextMessageExampleId` column on the `MessageExample` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `previousMessageExampleId` column on the `MessageExample` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Personality` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Personality` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `conversationId` column on the `Player` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `personalityId` to the `Conversation` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `conversationId` on the `Message` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `messageId` on the `MessageContext` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `personalityId` on the `MessageExample` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_personalityId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "MessageContext" DROP CONSTRAINT "MessageContext_messageId_fkey";

-- DropForeignKey
ALTER TABLE "MessageExample" DROP CONSTRAINT "MessageExample_nextMessageExampleId_fkey";

-- DropForeignKey
ALTER TABLE "MessageExample" DROP CONSTRAINT "MessageExample_personalityId_fkey";

-- DropForeignKey
ALTER TABLE "Player" DROP CONSTRAINT "Player_conversationId_fkey";

-- AlterTable
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_pkey",
DROP COLUMN "prompt",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "personalityId",
ADD COLUMN     "personalityId" INTEGER NOT NULL,
ADD CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Message" DROP CONSTRAINT "Message_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "conversationId",
ADD COLUMN     "conversationId" INTEGER NOT NULL,
ADD CONSTRAINT "Message_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "MessageContext" DROP CONSTRAINT "MessageContext_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "messageId",
ADD COLUMN     "messageId" INTEGER NOT NULL,
ADD CONSTRAINT "MessageContext_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "MessageExample" DROP CONSTRAINT "MessageExample_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "personalityId",
ADD COLUMN     "personalityId" INTEGER NOT NULL,
DROP COLUMN "nextMessageExampleId",
ADD COLUMN     "nextMessageExampleId" INTEGER,
DROP COLUMN "previousMessageExampleId",
ADD COLUMN     "previousMessageExampleId" INTEGER,
ADD CONSTRAINT "MessageExample_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Personality" DROP CONSTRAINT "Personality_pkey",
ADD COLUMN     "knowledge" TEXT[],
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Personality_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Player" DROP COLUMN "conversationId",
ADD COLUMN     "conversationId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "MessageExample_nextMessageExampleId_key" ON "MessageExample"("nextMessageExampleId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageExample_previousMessageExampleId_key" ON "MessageExample"("previousMessageExampleId");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_personalityId_fkey" FOREIGN KEY ("personalityId") REFERENCES "Personality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageContext" ADD CONSTRAINT "MessageContext_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageExample" ADD CONSTRAINT "MessageExample_personalityId_fkey" FOREIGN KEY ("personalityId") REFERENCES "Personality"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageExample" ADD CONSTRAINT "MessageExample_nextMessageExampleId_fkey" FOREIGN KEY ("nextMessageExampleId") REFERENCES "MessageExample"("id") ON DELETE SET NULL ON UPDATE CASCADE;
