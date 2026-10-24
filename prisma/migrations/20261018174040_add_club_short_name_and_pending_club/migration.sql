-- AlterTable
ALTER TABLE "Club" ADD COLUMN     "shortName" TEXT;

-- AlterTable
ALTER TABLE "PendingRoleAssignment" ADD COLUMN     "clubId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Club_shortName_key" ON "Club"("shortName");

-- AddForeignKey
ALTER TABLE "PendingRoleAssignment" ADD CONSTRAINT "PendingRoleAssignment_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Case-insensitive uniqueness for club identifiers (see AGENTS.md: no duplicate clubs).
CREATE UNIQUE INDEX "Club_name_lower_key" ON "Club" (lower("name"));
CREATE UNIQUE INDEX "Club_short_name_lower_key" ON "Club" (lower("shortName"));
