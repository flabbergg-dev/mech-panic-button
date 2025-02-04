/*
  Warnings:

  - Added the required column `totalAmount` to the `ServiceRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "ServiceStatus" ADD VALUE 'IN_COMPLETION';

-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "totalAmount" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "arrivalCode" SET DATA TYPE TEXT,
ALTER COLUMN "completionCode" SET DATA TYPE TEXT;
