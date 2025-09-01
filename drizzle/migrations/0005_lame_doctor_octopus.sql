ALTER TABLE `user` RENAME TO `activities`;--> statement-breakpoint
ALTER TABLE `session` RENAME TO `ai_documents`;--> statement-breakpoint
CREATE TABLE `ai_knowledge` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text,
	`subcategory` text,
	`title` text,
	`content` text,
	`summary` text,
	`embedding` text,
	`embedding_model` text DEFAULT 'text-embedding-3-small',
	`source` text,
	`source_url` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `participant_activities` (
	`id` text PRIMARY KEY NOT NULL,
	`participant_id` text NOT NULL,
	`activity_id` text NOT NULL,
	`session_activity_id` text NOT NULL,
	`responses` text DEFAULT '{}',
	`scores` text,
	`started_at` text DEFAULT CURRENT_TIMESTAMP,
	`completed_at` text,
	`is_completed` integer DEFAULT false NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`metadata` text,
	FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_activity_id`) REFERENCES `session_activities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session_activities` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`activity_id` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`config_override` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
DROP INDEX `user_username_unique`;--> statement-breakpoint
DROP INDEX `user_email_unique`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_activities` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`config` text DEFAULT '{}',
	`version` text DEFAULT '1.0.0' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_activities`("id", "slug", "name", "type", "config", "version", "is_active", "created_at", "updated_at") SELECT "id", "slug", "name", "type", "config", "version", "is_active", "created_at", "updated_at" FROM `activities`;--> statement-breakpoint
DROP TABLE `activities`;--> statement-breakpoint
ALTER TABLE `__new_activities` RENAME TO `activities`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `activities_slug_unique` ON `activities` (`slug`);--> statement-breakpoint
CREATE TABLE `__new_ai_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text,
	`filename` text,
	`mime_type` text,
	`file_size` integer,
	`content` text,
	`content_type` text,
	`embedding` text,
	`embedding_model` text DEFAULT 'text-embedding-3-small',
	`metadata` text,
	`uploaded_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_ai_documents`("id", "session_id", "filename", "mime_type", "file_size", "content", "content_type", "embedding", "embedding_model", "metadata", "uploaded_at") SELECT "id", "session_id", "filename", "mime_type", "file_size", "content", "content_type", "embedding", "embedding_model", "metadata", "uploaded_at" FROM `ai_documents`;--> statement-breakpoint
DROP TABLE `ai_documents`;--> statement-breakpoint
ALTER TABLE `__new_ai_documents` RENAME TO `ai_documents`;--> statement-breakpoint
ALTER TABLE `sessions` DROP COLUMN `description`;--> statement-breakpoint
ALTER TABLE `sessions` DROP COLUMN `activities`;--> statement-breakpoint
ALTER TABLE `sessions` DROP COLUMN `current_activity_id`;--> statement-breakpoint
ALTER TABLE `sessions` DROP COLUMN `status`;--> statement-breakpoint
ALTER TABLE `sessions` DROP COLUMN `settings`;--> statement-breakpoint
ALTER TABLE `sessions` DROP COLUMN `created_by`;--> statement-breakpoint
ALTER TABLE `sessions` DROP COLUMN `presenter_id`;--> statement-breakpoint
ALTER TABLE `sessions` DROP COLUMN `started_at`;--> statement-breakpoint
ALTER TABLE `sessions` DROP COLUMN `paused_at`;--> statement-breakpoint
ALTER TABLE `sessions` DROP COLUMN `resumed_at`;--> statement-breakpoint
ALTER TABLE `sessions` DROP COLUMN `scheduled_start`;--> statement-breakpoint
ALTER TABLE `sessions` DROP COLUMN `scheduled_end`;--> statement-breakpoint
ALTER TABLE `sessions` DROP COLUMN `access_code`;--> statement-breakpoint
ALTER TABLE `sessions` DROP COLUMN `allowed_emails`;--> statement-breakpoint
ALTER TABLE `sessions` DROP COLUMN `blocked_emails`;--> statement-breakpoint
ALTER TABLE `sessions` DROP COLUMN `metadata`;--> statement-breakpoint
ALTER TABLE `sessions` DROP COLUMN `participant_count`;--> statement-breakpoint
ALTER TABLE `sessions` DROP COLUMN `completed_count`;--> statement-breakpoint
ALTER TABLE `sessions` DROP COLUMN `average_completion_time`;--> statement-breakpoint
ALTER TABLE `sessions` DROP COLUMN `last_activity_at`;--> statement-breakpoint
ALTER TABLE `sessions` DROP COLUMN `archived_at`;--> statement-breakpoint
ALTER TABLE `sessions` DROP COLUMN `archived_by`;--> statement-breakpoint
ALTER TABLE `sessions` DROP COLUMN `archive_reason`;