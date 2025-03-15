
-- Create enum
CREATE TYPE "tournament_status" AS ENUM('pending', 'in_progress', 'completed', 'cancelled');

-- Drop existing tables to ensure clean state
DROP TABLE IF EXISTS "adminApprovals";
DROP TABLE IF EXISTS "tournaments";
DROP TABLE IF EXISTS "users";

-- Create users table first (referenced by others)
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
  "otpLastRequest" timestamp,
  CONSTRAINT "users_email_unique" UNIQUE ("email")
);

-- Create tournaments table
CREATE TABLE IF NOT EXISTS "tournaments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "creator_id" uuid NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "duration_days" integer NOT NULL,
  "start_date" timestamp NOT NULL,
  "requires_verification" boolean NOT NULL DEFAULT false,
  "status" tournament_status NOT NULL DEFAULT 'pending',
  "timezone" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "tournaments_creator_id_users_id_fk" 
    FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create adminApprovals table
CREATE TABLE IF NOT EXISTS "adminApprovals" (
  "id" serial PRIMARY KEY,
  "userId" uuid,
  "approvedBy" uuid,
  "status" text NOT NULL,
  "createdAt" timestamp DEFAULT now(),
  CONSTRAINT "adminApprovals_userId_users_id_fk" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL,
  CONSTRAINT "adminApprovals_approvedBy_users_id_fk" 
    FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL
);
