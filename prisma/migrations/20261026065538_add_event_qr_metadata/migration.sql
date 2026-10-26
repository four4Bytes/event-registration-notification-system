-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Event"
ADD COLUMN "facebookUrl" TEXT,
ADD COLUMN "status" "EventStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN "publicToken" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill a 128-bit hex token for events created before QR support.
UPDATE "Event" SET "publicToken" = replace(gen_random_uuid()::text, '-', '');

-- Require every event to have a token, then drop the bootstrap default.
ALTER TABLE "Event" ALTER COLUMN "publicToken" SET NOT NULL;
ALTER TABLE "Event" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "Event_publicToken_key" ON "Event"("publicToken");

-- CreateIndex
CREATE INDEX "Event_status_startAt_idx" ON "Event"("status", "startAt");
