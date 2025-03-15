
CREATE TABLE IF NOT EXISTS "tournament_scores" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tournament_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "day" integer NOT NULL,
  "score" integer NOT NULL,
  "screenshot_url" text,
  "submitted_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "tournament_scores_tournament_id_tournaments_id_fk"
    FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE,
  CONSTRAINT "tournament_scores_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS "tournament_scores_tournament_id_idx" 
  ON "tournament_scores" ("tournament_id");
CREATE INDEX IF NOT EXISTS "tournament_scores_user_id_idx" 
  ON "tournament_scores" ("user_id");
CREATE INDEX IF NOT EXISTS "tournament_scores_day_idx" 
  ON "tournament_scores" ("day");
