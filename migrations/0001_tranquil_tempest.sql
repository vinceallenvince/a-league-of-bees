CREATE TYPE "public"."tournament_status" AS ENUM('pending', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"duration_days" integer NOT NULL,
	"start_date" timestamp NOT NULL,
	"requires_verification" boolean DEFAULT false NOT NULL,
	"status" "tournament_status" DEFAULT 'pending' NOT NULL,
	"timezone" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "otpAttempts" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "otpAttempts" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;