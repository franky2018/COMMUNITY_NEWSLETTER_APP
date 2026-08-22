-- AlterTable
ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "emailVerificationTokenHash" TEXT,
ADD COLUMN "emailVerificationExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "User_emailVerificationTokenHash_idx" ON "User"("emailVerificationTokenHash");
