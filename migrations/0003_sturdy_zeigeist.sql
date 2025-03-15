ALTER TABLE "adminApprovals" ALTER COLUMN "userId" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "adminApprovals" ALTER COLUMN "userId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "adminApprovals" ALTER COLUMN "approvedBy" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "adminApprovals" ALTER COLUMN "approvedBy" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tournaments" ALTER COLUMN "creator_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();