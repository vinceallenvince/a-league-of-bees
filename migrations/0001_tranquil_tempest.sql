
CREATE TYPE "tournament_status" AS ENUM('pending', 'in_progress', 'completed', 'cancelled');

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" text NOT NULL,
  "firstName" text,
  "lastName" text,
  "username" text,
  "bio" text,
  "avatar" text,
  "isAdmin" boolean NOT NULL DEFAULT false,
  "lastLogin" timestamp,
  "otpSecret" text,
  "otpExpiry" timestamp,
  "otpAttempts" integer NOT NULL DEFAULT 0,
  "otpLastRequest" timestamp
);

CREATE TABLE IF NOT EXISTS "tournaments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "creator_id" uuid NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "duration_days" integer NOT NULL,
  "start_date" timestamp NOT NULL,
  "requires_verification" boolean DEFAULT false NOT NULL,
  "status" tournament_status DEFAULT 'pending' NOT NULL,
  "timezone" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "tournaments_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" ("email");
