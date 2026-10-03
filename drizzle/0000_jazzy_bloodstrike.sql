CREATE TABLE `designs` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`prompt` text NOT NULL,
	`shape` text NOT NULL,
	`created` integer NOT NULL,
	`object_key` text
);
--> statement-breakpoint
CREATE INDEX `designs_owner_created` ON `designs` (`owner`,`created`);