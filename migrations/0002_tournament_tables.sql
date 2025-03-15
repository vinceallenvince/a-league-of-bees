-- Add tables for tournament participants, scores, and notifications

-- Create tournament_participants table
CREATE TABLE IF NOT EXISTS "tournament_participants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tournament_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "status" varchar(255) NOT NULL DEFAULT 'invited',
  "joined_at" timestamp DEFAULT now(),
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "tournament_participants_tournament_id_fk" 
    FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE,
  CONSTRAINT "tournament_participants_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create tournament_scores table
CREATE TABLE IF NOT EXISTS "tournament_scores" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tournament_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "day" integer NOT NULL,
  "score" integer NOT NULL,
  "screenshot_url" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "tournament_scores_tournament_id_fk" 
    FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE,
  CONSTRAINT "tournament_scores_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "tournament_id" uuid NOT NULL,
  "type" varchar(255) NOT NULL,
  "message" text NOT NULL,
  "read" boolean NOT NULL DEFAULT false,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "notifications_user_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "notifications_tournament_id_fk"
    FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS "tournament_participants_tournament_id_idx" ON "tournament_participants" ("tournament_id");
CREATE INDEX IF NOT EXISTS "tournament_participants_user_id_idx" ON "tournament_participants" ("user_id");
CREATE INDEX IF NOT EXISTS "tournament_scores_tournament_id_idx" ON "tournament_scores" ("tournament_id");
CREATE INDEX IF NOT EXISTS "tournament_scores_user_id_idx" ON "tournament_scores" ("user_id");
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications" ("user_id");
CREATE INDEX IF NOT EXISTS "notifications_tournament_id_idx" ON "notifications" ("tournament_id");
CREATE INDEX IF NOT EXISTS "notifications_read_idx" ON "notifications" ("read"); 