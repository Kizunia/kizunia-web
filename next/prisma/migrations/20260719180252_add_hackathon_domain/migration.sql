/*
  Warnings:

  - Added the required column `type` to the `link` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."HackathonMode" AS ENUM ('ONLINE', 'OFFLINE', 'HYBRID');

-- CreateEnum
CREATE TYPE "public"."HackathonVisibility" AS ENUM ('PUBLIC', 'UNLISTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."HackathonStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED');

-- AlterTable
ALTER TABLE "public"."link" ADD COLUMN     "hackathonId" TEXT,
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."media" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "alt" TEXT,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT,
    "hackathonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."hackathon" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "organizer" TEXT NOT NULL,
    "mode" "public"."HackathonMode" NOT NULL DEFAULT 'ONLINE',
    "location" TEXT,
    "registrationLink" TEXT,
    "website" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "registrationDeadline" TIMESTAMP(3),
    "minTeamSize" INTEGER,
    "maxTeamSize" INTEGER,
    "prizePool" TEXT,
    "documentation" TEXT,
    "visibility" "public"."HackathonVisibility" NOT NULL DEFAULT 'UNLISTED',
    "status" "public"."HackathonStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hackathon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."hackathon_category" (
    "hackathonId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "hackathon_category_pkey" PRIMARY KEY ("hackathonId","categoryId")
);

-- CreateTable
CREATE TABLE "public"."hackathon_technology" (
    "hackathonId" TEXT NOT NULL,
    "technologyId" TEXT NOT NULL,

    CONSTRAINT "hackathon_technology_pkey" PRIMARY KEY ("hackathonId","technologyId")
);

-- CreateTable
CREATE TABLE "public"."hackathon_maintainer" (
    "hackathonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hackathon_maintainer_pkey" PRIMARY KEY ("hackathonId","userId")
);

-- CreateTable
CREATE TABLE "public"."hackathon_bookmark" (
    "hackathonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hackathon_bookmark_pkey" PRIMARY KEY ("hackathonId","userId")
);

-- CreateIndex
CREATE INDEX "media_userId_idx" ON "public"."media"("userId");

-- CreateIndex
CREATE INDEX "media_hackathonId_idx" ON "public"."media"("hackathonId");

-- CreateIndex
CREATE UNIQUE INDEX "hackathon_slug_key" ON "public"."hackathon"("slug");

-- CreateIndex
CREATE INDEX "link_hackathonId_idx" ON "public"."link"("hackathonId");

-- AddForeignKey
ALTER TABLE "public"."link" ADD CONSTRAINT "link_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "public"."hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."media" ADD CONSTRAINT "media_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."media" ADD CONSTRAINT "media_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "public"."hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hackathon_category" ADD CONSTRAINT "hackathon_category_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "public"."hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hackathon_category" ADD CONSTRAINT "hackathon_category_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hackathon_technology" ADD CONSTRAINT "hackathon_technology_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "public"."hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hackathon_technology" ADD CONSTRAINT "hackathon_technology_technologyId_fkey" FOREIGN KEY ("technologyId") REFERENCES "public"."technology"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hackathon_maintainer" ADD CONSTRAINT "hackathon_maintainer_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "public"."hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hackathon_maintainer" ADD CONSTRAINT "hackathon_maintainer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hackathon_bookmark" ADD CONSTRAINT "hackathon_bookmark_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "public"."hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hackathon_bookmark" ADD CONSTRAINT "hackathon_bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
