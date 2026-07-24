-- CreateEnum
CREATE TYPE "public"."RegistrationPlatform" AS ENUM ('KIZUNIA', 'UNSTOP', 'DEVPOST', 'DEVFOLIO', 'DORAHACKS', 'HACK2SKILL', 'HACKEREARTH', 'TAIKAI', 'LUMA', 'GOOGLE_FORM', 'TYPEFORM', 'CUSTOM', 'OFFLINE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."RegistrationType" AS ENUM ('INDIVIDUAL', 'TEAM', 'BOTH');

-- CreateEnum
CREATE TYPE "public"."RegistrationFeeType" AS ENUM ('FREE', 'PAID', 'CONDITIONAL');

-- CreateEnum
CREATE TYPE "public"."OrganizerType" AS ENUM ('COLLEGE', 'COMPANY', 'COMMUNITY', 'GOVERNMENT', 'NON_PROFIT', 'STARTUP', 'INDIVIDUAL', 'OPEN_SOURCE');

-- CreateEnum
CREATE TYPE "public"."DifficultyLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'OPEN');

-- CreateEnum
CREATE TYPE "public"."CertificateType" AS ENUM ('NONE', 'PARTICIPATION', 'WINNER');

-- CreateEnum
CREATE TYPE "public"."EligibilityType" AS ENUM ('SCHOOL', 'UNDERGRADUATE', 'POSTGRADUATE', 'PHD', 'FRESHER', 'PROFESSIONAL', 'ENGINEERING', 'MANAGEMENT', 'DESIGN', 'SCIENCE', 'COMMERCE', 'ARTS', 'MEDICAL', 'LAW', 'OPEN', 'OTHER');

-- AlterTable
ALTER TABLE "public"."hackathon" ADD COLUMN     "certificateType" "public"."CertificateType",
ADD COLUMN     "difficulty" "public"."DifficultyLevel",
ADD COLUMN     "organizerType" "public"."OrganizerType",
ADD COLUMN     "registrationFee" TEXT,
ADD COLUMN     "registrationFeeType" "public"."RegistrationFeeType" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "registrationPlatform" "public"."RegistrationPlatform",
ADD COLUMN     "registrationType" "public"."RegistrationType";

-- CreateTable
CREATE TABLE "public"."hackathon_eligibility" (
    "hackathonId" TEXT NOT NULL,
    "type" "public"."EligibilityType" NOT NULL,

    CONSTRAINT "hackathon_eligibility_pkey" PRIMARY KEY ("hackathonId","type")
);

-- CreateIndex
CREATE INDEX "hackathon_eligibility_type_idx" ON "public"."hackathon_eligibility"("type");

-- AddForeignKey
ALTER TABLE "public"."hackathon_eligibility" ADD CONSTRAINT "hackathon_eligibility_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "public"."hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
