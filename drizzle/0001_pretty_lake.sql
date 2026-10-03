CREATE TABLE `generation_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`day` text NOT NULL,
	`created` integer NOT NULL,
	`status` text NOT NULL,
	`request_id` text,
	`network` text NOT NULL,
	`guest` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `attempt_owner_day` ON `generation_attempts` (`owner`,`day`);--> statement-breakpoint
CREATE INDEX `attempt_day` ON `generation_attempts` (`day`);--> statement-breakpoint
CREATE INDEX `attempt_network_day` ON `generation_attempts` (`network`,`day`);--> statement-breakpoint
CREATE UNIQUE INDEX `attempt_request` ON `generation_attempts` (`request_id`);--> statement-breakpoint
CREATE TABLE `poll_options` (
	`poll_id` text NOT NULL,
	`position` integer NOT NULL,
	`design_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `poll_option_position` ON `poll_options` (`poll_id`,`position`);--> statement-breakpoint
CREATE UNIQUE INDEX `poll_option_design` ON `poll_options` (`poll_id`,`design_id`);--> statement-breakpoint
CREATE TABLE `poll_votes` (
	`id` text PRIMARY KEY NOT NULL,
	`poll_id` text NOT NULL,
	`position` integer NOT NULL,
	`voter` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `poll_voter` ON `poll_votes` (`poll_id`,`voter`);--> statement-breakpoint
CREATE INDEX `poll_vote_count` ON `poll_votes` (`poll_id`,`position`);--> statement-breakpoint
CREATE TABLE `polls` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`title` text NOT NULL,
	`created` integer NOT NULL,
	`closed` integer,
	`creation_key` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `poll_owner_created` ON `polls` (`owner`,`created`);--> statement-breakpoint
CREATE UNIQUE INDEX `poll_creation_key` ON `polls` (`owner`,`creation_key`);