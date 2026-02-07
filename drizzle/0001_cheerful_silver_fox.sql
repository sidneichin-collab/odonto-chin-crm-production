CREATE TABLE `appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`patientId` int NOT NULL,
	`type` enum('Ortodontia','Clinico General') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`appointmentDate` timestamp NOT NULL,
	`duration` int DEFAULT 30,
	`dentistName` varchar(100),
	`status` enum('Pendiente','Confirmado','En Tratamiento','Completado','Cancelado','No Asistió') NOT NULL DEFAULT 'Pendiente',
	`reminderSent` boolean NOT NULL DEFAULT false,
	`reminderSentAt` timestamp,
	`confirmed` boolean NOT NULL DEFAULT false,
	`confirmedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(100),
	`entityId` int,
	`oldValue` text,
	`newValue` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automationLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`automationType` varchar(100) NOT NULL,
	`workflowName` varchar(255),
	`status` enum('Success','Failed','Pending') NOT NULL,
	`executionData` text,
	`errorMessage` text,
	`executedAt` timestamp NOT NULL DEFAULT (now()),
	`duration` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `automationLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`dateOfBirth` date,
	`gender` enum('M','F','Otro'),
	`email` varchar(320),
	`phone` varchar(50) NOT NULL,
	`whatsappNumber` varchar(50),
	`address` text,
	`city` varchar(100),
	`medicalHistory` text,
	`allergies` text,
	`medications` text,
	`emergencyContact` varchar(100),
	`emergencyPhone` varchar(50),
	`isAtRisk` boolean NOT NULL DEFAULT false,
	`riskReason` text,
	`lastContactDate` timestamp,
	`status` enum('Activo','Inactivo','En Tratamiento') NOT NULL DEFAULT 'Activo',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `patients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(50),
	`address` text,
	`city` varchar(100),
	`country` varchar(100),
	`whatsappNumber` varchar(50),
	`whatsappInstanceId` varchar(100),
	`timezone` varchar(50) DEFAULT 'America/La_Paz',
	`language` varchar(10) DEFAULT 'es',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `waitingList` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`patientId` int NOT NULL,
	`serviceType` enum('Ortodontia','Clinico General') NOT NULL,
	`priority` enum('Alta','Media','Baja') NOT NULL DEFAULT 'Media',
	`preferredDate` date,
	`preferredTime` varchar(50),
	`status` enum('En Espera','Contactado','Agendado','Cancelado') NOT NULL DEFAULT 'En Espera',
	`notes` text,
	`lastContactedAt` timestamp,
	`contactAttempts` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `waitingList_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsappMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`patientId` int,
	`appointmentId` int,
	`messageType` enum('Recordatorio','Confirmacion','Cancelacion','Alerta','Manual') NOT NULL,
	`phoneNumber` varchar(50) NOT NULL,
	`messageContent` text NOT NULL,
	`status` enum('Pendiente','Enviado','Entregado','Leido','Error') NOT NULL DEFAULT 'Pendiente',
	`errorMessage` text,
	`evolutionMessageId` varchar(255),
	`sentAt` timestamp,
	`deliveredAt` timestamp,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `whatsappMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('super-admin','admin','user') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `tenantId` int;