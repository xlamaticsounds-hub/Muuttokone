/*
  Warnings:

  - You are about to drop the column `currency` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `elevatorFrom` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `elevatorTo` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedValue` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `floorsFrom` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `floorsTo` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `heavyItems` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `packingNeeded` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the `Customer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Project` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Task` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Customer" DROP CONSTRAINT "Customer_contactId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_leadId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_projectId_fkey";

-- AlterTable
ALTER TABLE "Lead" DROP COLUMN "currency",
DROP COLUMN "elevatorFrom",
DROP COLUMN "elevatorTo",
DROP COLUMN "estimatedValue",
DROP COLUMN "floorsFrom",
DROP COLUMN "floorsTo",
DROP COLUMN "heavyItems",
DROP COLUMN "packingNeeded",
DROP COLUMN "priority",
ADD COLUMN     "boxCount" INTEGER,
ADD COLUMN     "floor" INTEGER,
ADD COLUMN     "hasElevator" BOOLEAN,
ADD COLUMN     "squareMeters" DOUBLE PRECISION;

-- DropTable
DROP TABLE "Customer";

-- DropTable
DROP TABLE "Project";

-- DropTable
DROP TABLE "Task";

-- DropTable
DROP TABLE "User";

-- DropEnum
DROP TYPE "Priority";

-- DropEnum
DROP TYPE "ProjectStatus";
