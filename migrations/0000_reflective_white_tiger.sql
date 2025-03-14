CREATE TABLE "adminApprovals" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" serial NOT NULL,
	"approvedBy" serial NOT NULL,
	"status" text NOT NULL,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"firstName" text,
	"lastName" text,
	"username" text,
	"bio" text,
	"avatar" text,
	"isAdmin" boolean DEFAULT false NOT NULL,
	"lastLogin" timestamp,
	"otpSecret" text,
	"otpExpiry" timestamp,
	"otpAttempts" serial DEFAULT 0 NOT NULL,
	"otpLastRequest" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "adminApprovals" ADD CONSTRAINT "adminApprovals_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adminApprovals" ADD CONSTRAINT "adminApprovals_approvedBy_users_id_fk" FOREIGN KEY ("approvedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;