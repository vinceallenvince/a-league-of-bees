
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
  "otpAttempts" integer NOT NULL,
  "otpLastRequest" timestamp
);

CREATE TABLE IF NOT EXISTS "adminApprovals" (
  "id" serial PRIMARY KEY,
  "userId" uuid REFERENCES "users"("id"),
  "approvedBy" uuid REFERENCES "users"("id"),
  "status" text NOT NULL,
  "createdAt" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "tournaments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "creator_id" uuid NOT NULL REFERENCES "users"("id"),
  "name" text NOT NULL,
  "description" text,
  "duration_days" integer NOT NULL,
  "start_date" timestamp NOT NULL,
  "requires_verification" boolean NOT NULL DEFAULT false,
  "status" tournament_status NOT NULL DEFAULT 'pending',
  "timezone" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" ("email");
