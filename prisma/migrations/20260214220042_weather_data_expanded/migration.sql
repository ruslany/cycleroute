/*
  Warnings:

  - You are about to drop the column `description` on the `WeatherData` table. All the data in the column will be lost.
  - You are about to drop the column `icon` on the `WeatherData` table. All the data in the column will be lost.
  - You are about to drop the column `windDeg` on the `WeatherData` table. All the data in the column will be lost.
  - You are about to drop the column `windSpeedMs` on the `WeatherData` table. All the data in the column will be lost.
  - Added the required column `cloudCoverPercent` to the `WeatherData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `distanceFromStartM` to the `WeatherData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estimatedArrivalTime` to the `WeatherData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `feelsLikeC` to the `WeatherData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plannedStartTime` to the `WeatherData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `precipMm` to the `WeatherData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `precipProbability` to the `WeatherData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `travelDirectionDeg` to the `WeatherData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weatherCode` to the `WeatherData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `windDirectionDeg` to the `WeatherData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `windGustsKmh` to the `WeatherData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `windSpeedKmh` to the `WeatherData` table without a default value. This is not possible if the table is not empty.
  - Made the column `tempC` on table `WeatherData` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "WeatherData_routeId_idx";

-- AlterTable
ALTER TABLE "WeatherData" DROP COLUMN "description",
DROP COLUMN "icon",
DROP COLUMN "windDeg",
DROP COLUMN "windSpeedMs",
ADD COLUMN     "cloudCoverPercent" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "distanceFromStartM" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "estimatedArrivalTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "feelsLikeC" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "plannedStartTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "precipMm" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "precipProbability" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "travelDirectionDeg" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "weatherCode" INTEGER NOT NULL,
ADD COLUMN     "windDirectionDeg" INTEGER NOT NULL,
ADD COLUMN     "windGustsKmh" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "windSpeedKmh" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "tempC" SET NOT NULL;

-- CreateIndex
CREATE INDEX "WeatherData_routeId_plannedStartTime_idx" ON "WeatherData"("routeId", "plannedStartTime");
