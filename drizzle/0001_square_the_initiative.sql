PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_participants` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`cookie_id` text NOT NULL,
	`name` text,
	`generation` text,
	`responses` text DEFAULT '{}',
	`preference_scores` text,
	`completed` integer DEFAULT false NOT NULL,
	`joined_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_participants`("id", "session_id", "cookie_id", "name", "generation", "responses", "preference_scores", "completed", "joined_at", "completed_at") SELECT "id", "session_id", "cookie_id", "name", "generation", "responses", "preference_scores", "completed", "joined_at", "completed_at" FROM `participants`;--> statement-breakpoint
DROP TABLE `participants`;--> statement-breakpoint
ALTER TABLE `__new_participants` RENAME TO `participants`;--> statement-breakpoint
PRAGMA foreign_keys=ON;