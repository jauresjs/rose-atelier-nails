CREATE TABLE `inspiration_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`day` text NOT NULL,
	`created` integer NOT NULL,
	`guest` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `inspiration_owner_day` ON `inspiration_attempts` (`owner`,`day`);--> statement-breakpoint
CREATE INDEX `inspiration_day` ON `inspiration_attempts` (`day`);