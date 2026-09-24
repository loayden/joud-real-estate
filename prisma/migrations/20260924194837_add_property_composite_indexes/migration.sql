-- Add composite indexes for hot listing queries
CREATE INDEX "properties_status_listingType_cityId_idx" ON "properties"("status", "listing_type", "city_id");
CREATE INDEX "properties_status_isFeatured_publishedAt_idx" ON "properties"("status", "is_featured", "published_at");
CREATE INDEX "properties_userId_status_idx" ON "properties"("user_id", "status");
