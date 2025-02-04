/*
  Warnings:

  - You are about to drop the column `chatUserId` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the column `messageId` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the column `availabilityStatus` on the `Mechanic` table. All the data in the column will be lost.
  - The `servicesOffered` column on the `Mechanic` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `serviceType` column on the `ServiceRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `completionCode` column on the `ServiceRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `serviceArea` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[customerId,mechanicId]` on the table `Chat` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `customerId` to the `Chat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mechanicId` to the `Chat` table without a default value. This is not possible if the table is not empty.
  - Made the column `clientId` on table `ServiceRequest` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ServiceStatus" ADD VALUE 'OFFERED';
ALTER TYPE "ServiceStatus" ADD VALUE 'SERVICING';
ALTER TYPE "ServiceStatus" ADD VALUE 'PAYMENT_AUTHORIZED';

-- DropForeignKey
ALTER TABLE "ServiceRequest" DROP CONSTRAINT "ServiceRequest_clientId_fkey";

-- AlterTable
ALTER TABLE "Chat" DROP COLUMN "chatUserId",
DROP COLUMN "messageId",
ADD COLUMN     "customerId" TEXT NOT NULL,
ADD COLUMN     "mechanicId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Mechanic" DROP COLUMN "availabilityStatus",
ADD COLUMN     "location" JSONB,
ADD COLUMN     "serviceArea" JSONB,
DROP COLUMN "servicesOffered",
ADD COLUMN     "servicesOffered" "ServiceType"[],
ALTER COLUMN "isAvailable" SET DEFAULT false;

-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "arrivalCode" INTEGER,
ADD COLUMN     "completionTime" TIMESTAMP(3),
ADD COLUMN     "startTime" TIMESTAMP(3),
ALTER COLUMN "clientId" SET NOT NULL,
DROP COLUMN "serviceType",
ADD COLUMN     "serviceType" "ServiceType" NOT NULL DEFAULT 'DIAGNOSTIC',
DROP COLUMN "completionCode",
ADD COLUMN     "completionCode" INTEGER;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "serviceArea";

-- CreateTable
CREATE TABLE "ServiceOffer" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mechanicId" TEXT NOT NULL,
    "serviceRequestId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3),
    "location" JSONB,

    CONSTRAINT "ServiceOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Chat_customerId_mechanicId_key" ON "Chat"("customerId", "mechanicId");

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOffer" ADD CONSTRAINT "ServiceOffer_mechanicId_fkey" FOREIGN KEY ("mechanicId") REFERENCES "Mechanic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOffer" ADD CONSTRAINT "ServiceOffer_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
