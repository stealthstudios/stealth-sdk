/*
  Warnings:

  - Added the required column `user` to the `MessageExample` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MessageExample" ADD COLUMN     "user" TEXT NOT NULL;
