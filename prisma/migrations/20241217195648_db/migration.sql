/*
  Warnings:

  - You are about to drop the `MessageExample` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MessageExample" DROP CONSTRAINT "MessageExample_nextMessageExampleId_fkey";

-- DropForeignKey
ALTER TABLE "MessageExample" DROP CONSTRAINT "MessageExample_personalityId_fkey";

-- DropTable
DROP TABLE "MessageExample";

-- CreateTable
CREATE TABLE "ExampleConversation" (
    "id" SERIAL NOT NULL,
    "personalityId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExampleConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExampleConversationMessage" (
    "index" INTEGER NOT NULL,
    "user" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "exampleConversationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExampleConversationMessage_pkey" PRIMARY KEY ("index","exampleConversationId")
);

-- AddForeignKey
ALTER TABLE "ExampleConversation" ADD CONSTRAINT "ExampleConversation_personalityId_fkey" FOREIGN KEY ("personalityId") REFERENCES "Personality"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExampleConversationMessage" ADD CONSTRAINT "ExampleConversationMessage_exampleConversationId_fkey" FOREIGN KEY ("exampleConversationId") REFERENCES "ExampleConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
