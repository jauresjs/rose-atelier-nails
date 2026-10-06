CREATE TABLE `poll_profiles` (
	`owner` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`slug` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `poll_profile_slug` ON `poll_profiles` (`slug`);
