/*
  Warnings:

  - The values [DRAFT,SUBMITTED,PENDING_REVIEW,APPROVED,PUBLISHED] on the enum `HackathonStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `icon` on the `link` table. All the data in the column will be lost.
  - You are about to drop the column `label` on the `link` table. All the data in the column will be lost.
  - You are about to drop the column `banner` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `hackathon_maintainer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `media` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `verification_badge` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `title` to the `link` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `link` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."SuggestionStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "public"."HackathonMemberRole" AS ENUM ('OWNER', 'ORGANIZER', 'MAINTAINER');

-- CreateEnum
CREATE TYPE "public"."AssetProvider" AS ENUM ('CLOUDINARY');

-- CreateEnum
CREATE TYPE "public"."LinkType" AS ENUM ('WEBSITE', 'REGISTRATION', 'GITHUB', 'GITLAB', 'DEMO', 'DOCUMENTATION', 'FIGMA', 'DEVPOST', 'DEVFOLIO', 'UNSTOP', 'LINKEDIN', 'TWITTER', 'INSTAGRAM', 'DISCORD', 'YOUTUBE', 'PORTFOLIO', 'OTHER');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."HackathonStatus_new" AS ENUM ('UPCOMING', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'ONGOING', 'COMPLETED', 'CANCELLED');
ALTER TABLE "public"."hackathon" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."hackathon" ALTER COLUMN "status" TYPE "public"."HackathonStatus_new" USING ("status"::text::"public"."HackathonStatus_new");
ALTER TYPE "public"."HackathonStatus" RENAME TO "HackathonStatus_old";
ALTER TYPE "public"."HackathonStatus_new" RENAME TO "HackathonStatus";
DROP TYPE "public"."HackathonStatus_old";
ALTER TABLE "public"."hackathon" ALTER COLUMN "status" SET DEFAULT 'UPCOMING';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."hackathon_maintainer" DROP CONSTRAINT "hackathon_maintainer_hackathonId_fkey";

-- DropForeignKey
ALTER TABLE "public"."hackathon_maintainer" DROP CONSTRAINT "hackathon_maintainer_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."media" DROP CONSTRAINT "media_hackathonId_fkey";

-- DropForeignKey
ALTER TABLE "public"."media" DROP CONSTRAINT "media_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."media" DROP CONSTRAINT "media_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."project_badge" DROP CONSTRAINT "project_badge_badgeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_badge" DROP CONSTRAINT "user_badge_badgeId_fkey";

-- AlterTable
ALTER TABLE "public"."hackathon" ADD COLUMN     "bannerAssetId" TEXT,
ADD COLUMN     "coverAssetId" TEXT,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "logoAssetId" TEXT,
ADD COLUMN     "updatedById" TEXT,
ALTER COLUMN "status" SET DEFAULT 'UPCOMING';

-- AlterTable
ALTER TABLE "public"."link" DROP COLUMN "icon",
DROP COLUMN "label",
ADD COLUMN     "hackathonSuggestionId" TEXT,
ADD COLUMN     "title" TEXT NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "public"."LinkType" NOT NULL;

-- AlterTable
ALTER TABLE "public"."project" ADD COLUMN     "coverAssetId" TEXT,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "logoAssetId" TEXT,
ADD COLUMN     "updatedById" TEXT;

-- AlterTable
ALTER TABLE "public"."technology" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "public"."user" DROP COLUMN "banner",
ADD COLUMN     "avatarAssetId" TEXT,
ADD COLUMN     "coverAssetId" TEXT;

-- DropTable
DROP TABLE "public"."hackathon_maintainer";

-- DropTable
DROP TABLE "public"."media";

-- DropTable
DROP TABLE "public"."verification_badge";

-- CreateTable
CREATE TABLE "public"."asset" (
    "id" TEXT NOT NULL,
    "provider" "public"."AssetProvider" NOT NULL,
    "publicId" TEXT NOT NULL,
    "secureUrl" TEXT NOT NULL,
    "format" TEXT,
    "mimeType" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "bytes" INTEGER,
    "checksum" TEXT,
    "originalFilename" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."badge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "iconUrl" TEXT,

    CONSTRAINT "badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."hackathon_suggestion" (
    "id" TEXT NOT NULL,
    "status" "public"."SuggestionStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "rejectionReason" TEXT,
    "hackathonId" TEXT,
    "submittedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "title" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "logoAssetId" TEXT,
    "bannerAssetId" TEXT,
    "coverAssetId" TEXT,

    CONSTRAINT "hackathon_suggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."hackathon_member" (
    "hackathonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."HackathonMemberRole" NOT NULL DEFAULT 'MAINTAINER',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hackathon_member_pkey" PRIMARY KEY ("hackathonId","userId")
);

-- CreateTable
CREATE TABLE "public"."hackathon_suggestion_category" (
    "suggestionId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "hackathon_suggestion_category_pkey" PRIMARY KEY ("suggestionId","categoryId")
);

-- CreateTable
CREATE TABLE "public"."hackathon_suggestion_technology" (
    "suggestionId" TEXT NOT NULL,
    "technologyId" TEXT NOT NULL,

    CONSTRAINT "hackathon_suggestion_technology_pkey" PRIMARY KEY ("suggestionId","technologyId")
);

-- CreateIndex
CREATE UNIQUE INDEX "asset_publicId_key" ON "public"."asset"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "badge_name_key" ON "public"."badge"("name");

-- CreateIndex
CREATE INDEX "hackathon_suggestion_status_idx" ON "public"."hackathon_suggestion"("status");

-- CreateIndex
CREATE INDEX "hackathon_suggestion_submittedById_idx" ON "public"."hackathon_suggestion"("submittedById");

-- CreateIndex
CREATE INDEX "hackathon_suggestion_reviewedById_idx" ON "public"."hackathon_suggestion"("reviewedById");

-- CreateIndex
CREATE INDEX "hackathon_suggestion_hackathonId_idx" ON "public"."hackathon_suggestion"("hackathonId");

-- CreateIndex
CREATE INDEX "hackathon_suggestion_createdAt_idx" ON "public"."hackathon_suggestion"("createdAt");

-- CreateIndex
CREATE INDEX "hackathon_status_idx" ON "public"."hackathon"("status");

-- CreateIndex
CREATE INDEX "hackathon_visibility_idx" ON "public"."hackathon"("visibility");

-- CreateIndex
CREATE INDEX "hackathon_deletedAt_idx" ON "public"."hackathon"("deletedAt");

-- CreateIndex
CREATE INDEX "hackathon_startDate_idx" ON "public"."hackathon"("startDate");

-- CreateIndex
CREATE INDEX "hackathon_registrationDeadline_idx" ON "public"."hackathon"("registrationDeadline");

-- CreateIndex
CREATE INDEX "hackathon_createdById_idx" ON "public"."hackathon"("createdById");

-- CreateIndex
CREATE INDEX "hackathon_updatedById_idx" ON "public"."hackathon"("updatedById");

-- CreateIndex
CREATE INDEX "link_hackathonSuggestionId_idx" ON "public"."link"("hackathonSuggestionId");

-- AddForeignKey
ALTER TABLE "public"."user" ADD CONSTRAINT "user_avatarAssetId_fkey" FOREIGN KEY ("avatarAssetId") REFERENCES "public"."asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user" ADD CONSTRAINT "user_coverAssetId_fkey" FOREIGN KEY ("coverAssetId") REFERENCES "public"."asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."link" ADD CONSTRAINT "link_hackathonSuggestionId_fkey" FOREIGN KEY ("hackathonSuggestionId") REFERENCES "public"."hackathon_suggestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_badge" ADD CONSTRAINT "user_badge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "public"."badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hackathon" ADD CONSTRAINT "hackathon_logoAssetId_fkey" FOREIGN KEY ("logoAssetId") REFERENCES "public"."asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hackathon" ADD CONSTRAINT "hackathon_bannerAssetId_fkey" FOREIGN KEY ("bannerAssetId") REFERENCES "public"."asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hackathon" ADD CONSTRAINT "hackathon_coverAssetId_fkey" FOREIGN KEY ("coverAssetId") REFERENCES "public"."asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hackathon" ADD CONSTRAINT "hackathon_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hackathon" ADD CONSTRAINT "hackathon_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hackathon_suggestion" ADD CONSTRAINT "hackathon_suggestion_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "public"."hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hackathon_suggestion" ADD CONSTRAINT "hackathon_suggestion_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hackathon_suggestion" ADD CONSTRAINT "hackathon_suggestion_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hackathon_suggestion" ADD CONSTRAINT "hackathon_suggestion_logoAssetId_fkey" FOREIGN KEY ("logoAssetId") REFERENCES "public"."asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hackathon_suggestion" ADD CONSTRAINT "hackathon_suggestion_bannerAssetId_fkey" FOREIGN KEY ("bannerAssetId") REFERENCES "public"."asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hackathon_suggestion" ADD CONSTRAINT "hackathon_suggestion_coverAssetId_fkey" FOREIGN KEY ("coverAssetId") REFERENCES "public"."asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hackathon_member" ADD CONSTRAINT "hackathon_member_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "public"."hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hackathon_member" ADD CONSTRAINT "hackathon_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hackathon_suggestion_category" ADD CONSTRAINT "hackathon_suggestion_category_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "public"."hackathon_suggestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hackathon_suggestion_category" ADD CONSTRAINT "hackathon_suggestion_category_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hackathon_suggestion_technology" ADD CONSTRAINT "hackathon_suggestion_technology_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "public"."hackathon_suggestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hackathon_suggestion_technology" ADD CONSTRAINT "hackathon_suggestion_technology_technologyId_fkey" FOREIGN KEY ("technologyId") REFERENCES "public"."technology"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project" ADD CONSTRAINT "project_logoAssetId_fkey" FOREIGN KEY ("logoAssetId") REFERENCES "public"."asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project" ADD CONSTRAINT "project_coverAssetId_fkey" FOREIGN KEY ("coverAssetId") REFERENCES "public"."asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project" ADD CONSTRAINT "project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project" ADD CONSTRAINT "project_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_badge" ADD CONSTRAINT "project_badge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "public"."badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
