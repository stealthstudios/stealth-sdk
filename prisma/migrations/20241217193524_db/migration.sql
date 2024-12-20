/*
  Warnings:

  - You are about to drop the column `message` on the `MessageExample` table. All the data in the column will be lost.
  - You are about to drop the column `previousMessageExampleId` on the `MessageExample` table. All the data in the column will be lost.
  - Added the required column `content` to the `MessageExample` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "MessageExample_previousMessageExampleId_key";

-- AlterTable
ALTER TABLE "MessageExample" DROP COLUMN "message",
DROP COLUMN "previousMessageExampleId",
ADD COLUMN     "content" TEXT NOT NULL;
