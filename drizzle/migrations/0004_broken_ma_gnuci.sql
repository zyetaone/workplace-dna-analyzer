CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`email` text,
	`role` text DEFAULT 'presenter',
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`last_login_at` text,
	`metadata` text DEFAULT '{}'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`user_agent` text,
	`ip_address` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`last_activity_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `sessions` ADD `description` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `activities` text DEFAULT '[]';--> statement-breakpoint
ALTER TABLE `sessions` ADD `current_activity_id` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `status` text DEFAULT 'created' NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `settings` text DEFAULT '{}';--> statement-breakpoint
ALTER TABLE `sessions` ADD `created_by` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `presenter_id` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `started_at` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `paused_at` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `resumed_at` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `scheduled_start` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `scheduled_end` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `access_code` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `allowed_emails` text DEFAULT '[]';--> statement-breakpoint
ALTER TABLE `sessions` ADD `blocked_emails` text DEFAULT '[]';--> statement-breakpoint
ALTER TABLE `sessions` ADD `metadata` text DEFAULT '{}';--> statement-breakpoint
ALTER TABLE `sessions` ADD `participant_count` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `sessions` ADD `completed_count` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `sessions` ADD `average_completion_time` integer;--> statement-breakpoint
ALTER TABLE `sessions` ADD `last_activity_at` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `archived_at` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `archived_by` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `archive_reason` text;