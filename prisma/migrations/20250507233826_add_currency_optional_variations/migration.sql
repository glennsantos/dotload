/*
  Warnings:

  - You are about to drop the column `subscriptionBilling` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "subscriptionBilling",
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'PHP';
