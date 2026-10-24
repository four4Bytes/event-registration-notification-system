-- AlterTable
ALTER TABLE "PendingRoleAssignment" ADD COLUMN     "allowExternalEmail" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "allowExternalEmail" BOOLEAN NOT NULL DEFAULT false;
