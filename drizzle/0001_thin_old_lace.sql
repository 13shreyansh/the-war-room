CREATE TABLE `critiques` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`personaId` int NOT NULL,
	`title` varchar(512) NOT NULL,
	`attack` text NOT NULL,
	`citation` text,
	`citationUrl` varchar(1024),
	`suggestedFix` text NOT NULL,
	`severity` enum('high','medium','low') NOT NULL,
	`confidenceScore` int NOT NULL,
	`confidenceReason` text,
	`unhingedAttack` text,
	`documentSection` varchar(256),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `critiques_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `personas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`role` varchar(256) NOT NULL,
	`perspective` text NOT NULL,
	`researchContext` text,
	`avatarStyle` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `personas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `researchLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`message` text NOT NULL,
	`logType` enum('search','analyze','inject','complete','error') NOT NULL DEFAULT 'search',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `researchLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`documentTitle` varchar(512) NOT NULL,
	`documentContent` text NOT NULL,
	`contextData` json,
	`robustnessScore` int,
	`status` enum('uploading','researching','generating','complete','error') NOT NULL DEFAULT 'uploading',
	`unhingedMode` enum('off','on') NOT NULL DEFAULT 'off',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
