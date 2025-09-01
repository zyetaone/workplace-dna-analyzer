CREATE TABLE `attendees` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`name` text NOT NULL,
	`generation` text,
	`responses` text DEFAULT '{}',
	`preference_scores` text,
	`completed` integer DEFAULT false NOT NULL,
	`joined_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`ended_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_code_unique` ON `sessions` (`code`);