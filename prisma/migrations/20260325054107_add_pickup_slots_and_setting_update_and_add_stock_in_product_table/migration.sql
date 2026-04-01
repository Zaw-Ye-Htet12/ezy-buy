/*
  Warnings:

  - You are about to drop the column `image_url` on the `products` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `store_settings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "collect_slots" ADD COLUMN     "slot_id" UUID,
ALTER COLUMN "slot_time" DROP NOT NULL;

-- AlterTable
ALTER TABLE "products" DROP COLUMN "image_url",
ADD COLUMN     "image_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "store_settings" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "delivery_fee_per_km" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "min_delivery_fee" SET DATA TYPE DECIMAL(10,2);

-- CreateTable
CREATE TABLE "pickup_slots" (
    "id" UUID NOT NULL,
    "store_setting_id" UUID NOT NULL,
    "slot_time" TIMESTAMP(3) NOT NULL,
    "max_orders" INTEGER NOT NULL DEFAULT 10,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pickup_slots_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "collect_slots" ADD CONSTRAINT "collect_slots_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "pickup_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_slots" ADD CONSTRAINT "pickup_slots_store_setting_id_fkey" FOREIGN KEY ("store_setting_id") REFERENCES "store_settings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
