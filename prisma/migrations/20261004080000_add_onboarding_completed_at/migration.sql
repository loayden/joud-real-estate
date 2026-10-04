-- Add onboarding completion timestamp to users
ALTER TABLE "users" ADD COLUMN "onboarding_completed_at" TIMESTAMPTZ;
