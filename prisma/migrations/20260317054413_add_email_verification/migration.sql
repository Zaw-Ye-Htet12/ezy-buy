-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verification_token" TEXT,
ADD COLUMN     "is_email_verified" BOOLEAN NOT NULL DEFAULT false;
