-- AlterEnum
ALTER TYPE "public"."HackathonVisibility" ADD VALUE 'PRIVATE';

-- AlterTable
ALTER TABLE "public"."hackathon" ALTER COLUMN "registrationFeeType" DROP NOT NULL,
ALTER COLUMN "registrationFeeType" DROP DEFAULT;
