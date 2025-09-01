CREATE TABLE `activity_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`activity_id` text NOT NULL,
	`session_id` text NOT NULL,
	`metric_type` text NOT NULL,
	`metric_value` integer NOT NULL,
	`calculated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`time_range` text,
	`metadata` text,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `activity_template_analytics` (
	`id` text PRIMARY KEY NOT NULL,
	`template_id` text NOT NULL,
	`session_id` text NOT NULL,
	`usage_count` integer DEFAULT 1 NOT NULL,
	`avg_completion_rate` integer,
	`avg_engagement_score` integer,
	`last_used` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`template_id`) REFERENCES `activity_templates`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `activity_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`target_audience` text NOT NULL,
	`estimated_duration` integer NOT NULL,
	`complexity` text NOT NULL,
	`activities` text NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`version` text DEFAULT '1.0.0' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `activity_templates_slug_unique` ON `activity_templates` (`slug`);--> statement-breakpoint
CREATE TABLE `analytics_events` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`participant_id` text,
	`activity_id` text,
	`event_type` text NOT NULL,
	`event_data` text,
	`timestamp` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`user_agent` text,
	`ip_address` text,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `participant_activity_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`participant_activity_id` text NOT NULL,
	`question_id` text NOT NULL,
	`started_at` text,
	`completed_at` text,
	`time_spent_seconds` integer,
	`attempts` integer DEFAULT 1 NOT NULL,
	`response_quality` integer,
	`engagement_score` integer,
	FOREIGN KEY (`participant_activity_id`) REFERENCES `participant_activities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session_analytics_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`snapshot_type` text NOT NULL,
	`snapshot_data` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
