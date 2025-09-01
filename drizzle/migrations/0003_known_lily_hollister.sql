DROP TABLE `user_sessions`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`ended_at` text
);
--> statement-breakpoint
INSERT INTO `__new_sessions`("id", "code", "name", "is_active", "created_at", "ended_at") SELECT "id", "code", "name", "is_active", "created_at", "ended_at" FROM `sessions`;--> statement-breakpoint
DROP TABLE `sessions`;--> statement-breakpoint
ALTER TABLE `__new_sessions` RENAME TO `sessions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_code_unique` ON `sessions` (`code`);