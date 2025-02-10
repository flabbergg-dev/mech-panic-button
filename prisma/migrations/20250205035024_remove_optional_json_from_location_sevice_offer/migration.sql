/*
  Warnings:

  - Made the column `location` on table `ServiceOffer` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ServiceOffer" ALTER COLUMN "location" SET NOT NULL;
