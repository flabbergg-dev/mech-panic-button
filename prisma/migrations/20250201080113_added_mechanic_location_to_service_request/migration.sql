/*
  Warnings:

  - The values [OFFERED] on the enum `ServiceStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ServiceStatus_new" AS ENUM ('REQUESTED', 'ACCEPTED', 'PAYMENT_AUTHORIZED', 'IN_ROUTE', 'SERVICING', 'IN_PROGRESS', 'COMPLETED');
ALTER TABLE "ServiceRequest" ALTER COLUMN "status" TYPE "ServiceStatus_new" USING ("status"::text::"ServiceStatus_new");
ALTER TYPE "ServiceStatus" RENAME TO "ServiceStatus_old";
ALTER TYPE "ServiceStatus_new" RENAME TO "ServiceStatus";
DROP TYPE "ServiceStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "mechanicLocation" JSONB;
