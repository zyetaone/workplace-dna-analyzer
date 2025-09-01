CREATE TABLE `activity_completion_triggers` (
	`id` text PRIMARY KEY NOT NULL,
	`activity_type` text NOT NULL,
	`default_threshold` integer DEFAULT 80 NOT NULL,
	`min_threshold` integer DEFAULT 50 NOT NULL,
	`max_threshold` integer DEFAULT 95 NOT NULL,
	`auto_progression_enabled` integer DEFAULT true NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `activity_progression_events` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`from_activity_id` text NOT NULL,
	`to_activity_id` text NOT NULL,
	`completion_rate` integer NOT NULL,
	`threshold_used` integer NOT NULL,
	`trigger_type` text NOT NULL,
	`admin_triggered` integer DEFAULT false NOT NULL,
	`metadata` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`from_activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `session_activities` ADD `completion_threshold` integer DEFAULT 80 NOT NULL;--> statement-breakpoint
ALTER TABLE `session_activities` ADD `auto_progression_enabled` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `session_activities` ADD `admin_override` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `session_activities` ADD `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL;