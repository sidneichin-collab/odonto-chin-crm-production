import { relations } from "drizzle-orm/relations";
import { users, appointmentDistributionAlerts, patients, appointments, treatments, auditLogs, chairAssignments, communications, messageTemplates, notifications, reminderLogs, rescheduleAlerts, rescheduleRequests, waitlist, whatsappConversations, whatsappMessages } from "./schema";

export const appointmentDistributionAlertsRelations = relations(appointmentDistributionAlerts, ({one}) => ({
	user: one(users, {
		fields: [appointmentDistributionAlerts.resolvedBy],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	appointmentDistributionAlerts: many(appointmentDistributionAlerts),
	appointments: many(appointments),
	auditLogs: many(auditLogs),
	chairAssignments: many(chairAssignments),
	communications: many(communications),
	messageTemplates: many(messageTemplates),
	notifications: many(notifications),
	reminderLogs: many(reminderLogs),
	rescheduleAlerts: many(rescheduleAlerts),
	waitlists: many(waitlist),
}));

export const appointmentsRelations = relations(appointments, ({one, many}) => ({
	patient: one(patients, {
		fields: [appointments.patientId],
		references: [patients.id]
	}),
	treatment: one(treatments, {
		fields: [appointments.treatmentId],
		references: [treatments.id]
	}),
	user: one(users, {
		fields: [appointments.createdBy],
		references: [users.id]
	}),
	rescheduleRequests: many(rescheduleRequests),
}));

export const patientsRelations = relations(patients, ({many}) => ({
	appointments: many(appointments),
	communications: many(communications),
	reminderLogs: many(reminderLogs),
	rescheduleAlerts: many(rescheduleAlerts),
	rescheduleRequests: many(rescheduleRequests),
	waitlists: many(waitlist),
	whatsappConversations: many(whatsappConversations),
}));

export const treatmentsRelations = relations(treatments, ({many}) => ({
	appointments: many(appointments),
}));

export const auditLogsRelations = relations(auditLogs, ({one}) => ({
	user: one(users, {
		fields: [auditLogs.userId],
		references: [users.id]
	}),
}));

export const chairAssignmentsRelations = relations(chairAssignments, ({one}) => ({
	user: one(users, {
		fields: [chairAssignments.createdBy],
		references: [users.id]
	}),
}));

export const communicationsRelations = relations(communications, ({one}) => ({
	patient: one(patients, {
		fields: [communications.patientId],
		references: [patients.id]
	}),
	user: one(users, {
		fields: [communications.createdBy],
		references: [users.id]
	}),
}));

export const messageTemplatesRelations = relations(messageTemplates, ({one}) => ({
	user: one(users, {
		fields: [messageTemplates.createdBy],
		references: [users.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
}));

export const reminderLogsRelations = relations(reminderLogs, ({one}) => ({
	patient: one(patients, {
		fields: [reminderLogs.patientId],
		references: [patients.id]
	}),
	user: one(users, {
		fields: [reminderLogs.createdBy],
		references: [users.id]
	}),
}));

export const rescheduleAlertsRelations = relations(rescheduleAlerts, ({one}) => ({
	patient: one(patients, {
		fields: [rescheduleAlerts.patientId],
		references: [patients.id]
	}),
	user: one(users, {
		fields: [rescheduleAlerts.resolvedBy],
		references: [users.id]
	}),
}));

export const rescheduleRequestsRelations = relations(rescheduleRequests, ({one}) => ({
	appointment: one(appointments, {
		fields: [rescheduleRequests.appointmentId],
		references: [appointments.id]
	}),
	patient: one(patients, {
		fields: [rescheduleRequests.patientId],
		references: [patients.id]
	}),
}));

export const waitlistRelations = relations(waitlist, ({one}) => ({
	patient: one(patients, {
		fields: [waitlist.patientId],
		references: [patients.id]
	}),
	user: one(users, {
		fields: [waitlist.addedBy],
		references: [users.id]
	}),
}));

export const whatsappConversationsRelations = relations(whatsappConversations, ({one, many}) => ({
	patient: one(patients, {
		fields: [whatsappConversations.patientId],
		references: [patients.id]
	}),
	whatsappMessages: many(whatsappMessages),
}));

export const whatsappMessagesRelations = relations(whatsappMessages, ({one}) => ({
	whatsappConversation: one(whatsappConversations, {
		fields: [whatsappMessages.conversationId],
		references: [whatsappConversations.id]
	}),
}));