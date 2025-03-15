
CREATE TABLE IF NOT EXISTS "tournament_participants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tournament_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "joined_at" timestamp DEFAULT now(),
  "status" varchar(255) NOT NULL DEFAULT 'invited',
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- First drop any existing foreign keys
ALTER TABLE "tournament_participants" DROP CONSTRAINT IF EXISTS "tournament_participants_tournament_id_tournaments_id_fk";
ALTER TABLE "tournament_participants" DROP CONSTRAINT IF EXISTS "tournament_participants_user_id_users_id_fk";

-- Then recreate them with CASCADE
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_tournament_id_tournaments_id_fk"
  FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- Add indexes for foreign keys and common queries
CREATE INDEX IF NOT EXISTS "tournament_participants_tournament_id_idx" 
  ON "tournament_participants" ("tournament_id");
CREATE INDEX IF NOT EXISTS "tournament_participants_user_id_idx" 
  ON "tournament_participants" ("user_id");
CREATE INDEX IF NOT EXISTS "tournament_participants_status_idx" 
  ON "tournament_participants" ("status");
