/*
  Warnings:

  - You are about to drop the column `documentation` on the `hackathon` table. All the data in the column will be lost.
  - You are about to drop the column `documentation` on the `project` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[contentId]` on the table `hackathon` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[contentId]` on the table `project` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."hackathon" DROP COLUMN "documentation",
ADD COLUMN     "contentId" TEXT;

-- AlterTable
ALTER TABLE "public"."project" DROP COLUMN "documentation",
ADD COLUMN     "contentId" TEXT;

-- CreateTable
CREATE TABLE "public"."Content" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hackathon_contentId_key" ON "public"."hackathon"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "project_contentId_key" ON "public"."project"("contentId");

-- AddForeignKey
ALTER TABLE "public"."hackathon" ADD CONSTRAINT "hackathon_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."Content"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project" ADD CONSTRAINT "project_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."Content"("id") ON DELETE SET NULL ON UPDATE CASCADE;
