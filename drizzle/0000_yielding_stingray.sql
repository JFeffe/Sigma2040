CREATE TABLE `relay_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room_id` text NOT NULL,
	`target` text NOT NULL,
	`sender` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `relay_rooms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_relay_messages_target` ON `relay_messages` (`room_id`,`target`,`id`);--> statement-breakpoint
CREATE TABLE `relay_rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`invite_hash` text NOT NULL,
	`host_hash` text NOT NULL,
	`host_seen` integer NOT NULL,
	`created_at` integer NOT NULL
);
