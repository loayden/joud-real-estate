-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "apartment_number" VARCHAR(20),
ADD COLUMN     "building_number" VARCHAR(20),
ADD COLUMN     "floor_number" SMALLINT,
ADD COLUMN     "street" VARCHAR(200),
ALTER COLUMN "currency" SET DEFAULT 'EGP';

-- AlterTable
ALTER TABLE "property_images" ADD COLUMN     "media_type" VARCHAR(10) NOT NULL DEFAULT 'image';
