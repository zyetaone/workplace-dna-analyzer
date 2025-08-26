ALTER TABLE `sessions` ADD `slug` text;--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_slug_unique` ON `sessions` (`slug`);