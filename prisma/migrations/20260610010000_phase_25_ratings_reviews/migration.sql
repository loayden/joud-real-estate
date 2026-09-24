-- Phase 25: ratings, reviews, reports, alerts, price history, and tour metadata.

CREATE TYPE "review_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED');
CREATE TYPE "report_reason" AS ENUM ('FAKE_LISTING', 'DUPLICATE', 'WRONG_PRICE', 'WRONG_LOCATION', 'INAPPROPRIATE', 'SOLD_NOT_UPDATED', 'OTHER');
CREATE TYPE "report_status" AS ENUM ('OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED');

ALTER TABLE "users"
  ADD COLUMN "seller_score" DOUBLE PRECISION,
  ADD COLUMN "seller_rating_count" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "properties"
  ADD COLUMN "avg_rating" DOUBLE PRECISION,
  ADD COLUMN "rating_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "virtual_tour_url" VARCHAR(500),
  ADD COLUMN "tour_360_image_urls" JSONB;

CREATE TABLE "property_ratings" (
  "id" TEXT NOT NULL,
  "property_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "overall_score" SMALLINT NOT NULL,
  "accuracy_score" SMALLINT,
  "value_score" SMALLINT,
  "location_score" SMALLINT,
  "comm_score" SMALLINT,
  "review_title" VARCHAR(200),
  "review_body" TEXT,
  "owner_response" TEXT,
  "is_approved" BOOLEAN NOT NULL DEFAULT false,
  "helpful_count" INTEGER NOT NULL DEFAULT 0,
  "status" "review_status" NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "property_ratings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "review_helpful_votes" (
  "id" TEXT NOT NULL,
  "rating_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "is_helpful" BOOLEAN NOT NULL,
  CONSTRAINT "review_helpful_votes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "price_alerts" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "property_id" TEXT NOT NULL,
  "target_price" DECIMAL(14,2),
  "last_price_seen" DECIMAL(14,2) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "last_alert_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "price_alerts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "property_reports" (
  "id" TEXT NOT NULL,
  "property_id" TEXT NOT NULL,
  "reporter_id" TEXT NOT NULL,
  "reason" "report_reason" NOT NULL,
  "details" TEXT,
  "status" "report_status" NOT NULL DEFAULT 'OPEN',
  "resolved_by" TEXT,
  "resolved_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "property_reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "property_price_history" (
  "id" TEXT NOT NULL,
  "property_id" TEXT NOT NULL,
  "price" DECIMAL(14,2) NOT NULL,
  "changed_by" TEXT,
  "note" VARCHAR(200),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "property_price_history_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "property_ratings_property_id_user_id_key" ON "property_ratings"("property_id", "user_id");
CREATE INDEX "property_ratings_property_id_idx" ON "property_ratings"("property_id");
CREATE INDEX "property_ratings_user_id_idx" ON "property_ratings"("user_id");
CREATE INDEX "property_ratings_status_idx" ON "property_ratings"("status");

CREATE UNIQUE INDEX "review_helpful_votes_rating_id_user_id_key" ON "review_helpful_votes"("rating_id", "user_id");
CREATE INDEX "review_helpful_votes_user_id_idx" ON "review_helpful_votes"("user_id");

CREATE UNIQUE INDEX "price_alerts_user_id_property_id_key" ON "price_alerts"("user_id", "property_id");
CREATE INDEX "price_alerts_property_id_idx" ON "price_alerts"("property_id");
CREATE INDEX "price_alerts_is_active_idx" ON "price_alerts"("is_active");

CREATE INDEX "property_reports_property_id_idx" ON "property_reports"("property_id");
CREATE INDEX "property_reports_reporter_id_idx" ON "property_reports"("reporter_id");
CREATE INDEX "property_reports_status_idx" ON "property_reports"("status");

CREATE INDEX "property_price_history_property_id_idx" ON "property_price_history"("property_id");
CREATE INDEX "property_price_history_created_at_idx" ON "property_price_history"("created_at");

ALTER TABLE "property_ratings"
  ADD CONSTRAINT "property_ratings_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "property_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "review_helpful_votes"
  ADD CONSTRAINT "review_helpful_votes_rating_id_fkey" FOREIGN KEY ("rating_id") REFERENCES "property_ratings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "review_helpful_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "price_alerts"
  ADD CONSTRAINT "price_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "price_alerts_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "property_reports"
  ADD CONSTRAINT "property_reports_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "property_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "property_price_history"
  ADD CONSTRAINT "property_price_history_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
