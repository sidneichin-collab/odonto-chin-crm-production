import { mysqlTable, mysqlSchema, AnyMySqlColumn, index, foreignKey, int, date, varchar, mysqlEnum, text, timestamp, time, json, decimal, tinyint, bigint } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const reschedulingAlerts = mysqlTable("reschedulingAlerts", {
	id: int().autoincrement().notNull(),
	appointmentId: int("appointment_id").notNull().references(() => appointments.id, { onDelete: "cascade" }),
	patientId: int("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
	patientName: varchar("patient_name", { length: 255 }).notNull(),
	patientPhone: varchar("patient_phone", { length: 50 }).notNull(),
	whatsappLink: varchar("whatsapp_link", { length: 500 }).notNull(),
	originalDate: date("original_date", { mode: 'date' }).notNull(),
	originalTime: time("original_time").notNull(),
	isRead: tinyint("is_read").default(0).notNull(),
	isResolved: tinyint("is_resolved").default(0).notNull(),
	resolvedAt: timestamp("resolved_at", { mode: 'string' }),
	resolvedBy: int("resolved_by").references(() => users.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_is_read").on(table.isRead),
	index("idx_is_resolved").on(table.isResolved),
	index("idx_created_at").on(table.createdAt),
]);

export const appointmentDistributionAlerts = mysqlTable("appointmentDistributionAlerts", {
	id: int().autoincrement().notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	alertDate: date({ mode: 'date' }).notNull(),
	alertType: varchar({ length: 100 }).notNull(),
	severity: mysqlEnum(['critical','warning','info']).default('info').notNull(),
	appointmentCount: int().notNull(),
	threshold: int().notNull(),
	message: text().notNull(),
	suggestedActions: text(),
	affectedDates: text(),
	isResolved: tinyint().default(0).notNull(),
	resolvedAt: timestamp({ mode: 'string' }),
	resolvedBy: int().references(() => users.id, { onDelete: "cascade" } ),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_resolved").on(table.isResolved),
	index("idx_severity").on(table.severity),
]);

export const appointments = mysqlTable("appointments", {
	id: int().autoincrement().notNull(),
	clinicId: int("clinic_id").notNull().references(() => clinics.id, { onDelete: "cascade" }),
	patientId: int("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" } ),
	treatmentId: int("treatment_id").references(() => treatments.id, { onDelete: "set null" } ),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	appointmentDate: date("appointment_date", { mode: 'date' }).notNull(),
	appointmentTime: time("appointment_time").notNull(),
	duration: int(),
	treatmentType: mysqlEnum("treatment_type", ['orthodontics','general_clinic','both']).notNull(),
	status: mysqlEnum(['scheduled','confirmed','not_confirmed','completed','cancelled','rescheduling_pending']).default('scheduled').notNull(),
	reminderSent: tinyint("reminder_sent").default(0).notNull(),
	reminderSentAt: timestamp("reminder_sent_at", { mode: 'string' }),
	reminderAttempts: int("reminder_attempts").default(0).notNull(),
	lastReminderAt: timestamp("last_reminder_at", { mode: 'string' }),
	confirmedAt: timestamp("confirmed_at", { mode: 'string' }),
	createdBy: int("created_by").references(() => users.id, { onDelete: "set null" } ),
	chair: int(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
});

export const auditLogs = mysqlTable("audit_logs", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	userId: int("user_id").references(() => users.id, { onDelete: "cascade" } ),
	action: varchar({ length: 100 }).notNull(),
	resourceType: varchar("resource_type", { length: 100 }),
	resourceId: int("resource_id"),
	ipAddress: varchar("ip_address", { length: 50 }),
	userAgent: text("user_agent"),
	requestMethod: varchar("request_method", { length: 10 }),
	requestUrl: varchar("request_url", { length: 500 }),
	changesMade: json("changes_made"),
	status: mysqlEnum(['success','failure','error']).default('success'),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
},
(table) => [
	index("idx_user").on(table.userId),
	index("idx_action").on(table.action),
	index("idx_resource").on(table.resourceType, table.resourceId),
	index("idx_created_at").on(table.createdAt),
]);

export const chairAssignments = mysqlTable("chairAssignments", {
	id: int().autoincrement().notNull(),
	clinicId: int("clinic_id").notNull().references(() => clinics.id, { onDelete: "cascade" }),
	chairId: varchar("chair_id", { length: 50 }).notNull(),
	chairName: varchar("chair_name", { length: 100 }).notNull(),
	doctorName: varchar("doctor_name", { length: 255 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	date: date({ mode: 'date' }).notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	createdBy: int("created_by").notNull().references(() => users.id, { onDelete: "cascade" } ),
},
(table) => [
	index("unique_chair_date").on(table.chairId, table.date),
]);

export const clinics = mysqlTable("clinics", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	country: varchar({ length: 50 }).notNull(),
	city: varchar({ length: 100 }).notNull(),
	address: text(),
	timezone: varchar({ length: 50 }).default('America/Asuncion').notNull(),
	currency: varchar({ length: 3 }).default('PYG').notNull(),
	phone: varchar({ length: 20 }),
	email: varchar({ length: 320 }),
	status: mysqlEnum(['active','inactive','coming_soon']).default('active').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_country").on(table.country),
	index("idx_status").on(table.status),
	]);

export const communications = mysqlTable("communications", {
	id: int().autoincrement().notNull(),
	clinicId: int("clinic_id").notNull().references(() => clinics.id, { onDelete: "cascade" }),
	patientId: int("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" } ),
	channel: mysqlEnum(['email','sms','whatsapp']).notNull(),
	content: text().notNull(),
	status: mysqlEnum(['sent','failed','pending']).default('pending').notNull(),
	sentAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdBy: int().notNull().references(() => users.id),
});

export const messageTemplates = mysqlTable("message_templates", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 200 }).notNull(),
	category: mysqlEnum(['reminder','confirmation','recall','marketing','follow_up','emergency']).notNull(),
	language: varchar({ length: 10 }).default('es'),
	subject: varchar({ length: 300 }),
	bodyText: text("body_text").notNull(),
	variables: json(),
	isActive: tinyint("is_active").default(1),
	usageCount: int("usage_count").default(0),
	lastUsedAt: timestamp("last_used_at", { mode: 'string' }),
	createdBy: int("created_by").references(() => users.id, { onDelete: "cascade" } ),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("idx_category").on(table.category),
	index("idx_active").on(table.isActive),
]);

export const notifications = mysqlTable("notifications", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	title: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	type: mysqlEnum(['appointment','payment','system']).default('system').notNull(),
	read: tinyint().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const patients = mysqlTable("patients", {
	id: int().autoincrement().notNull(),
	clinicId: int("clinic_id").notNull().references(() => clinics.id, { onDelete: "cascade" }),
	name: varchar({ length: 255 }).notNull(),
	ci: varchar({ length: 20 }),
	phone: varchar({ length: 50 }).notNull(),
	emergencyContact: varchar("emergency_contact", { length: 255 }),
	email: varchar({ length: 255 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	birthDate: date("birth_date", { mode: 'date' }),
	address: text(),
	ubicacion: text(),
	cedulaImageUrl: text("cedula_image_url"),
	treatmentType: mysqlEnum("treatment_type", ['ortodontia','clinica_geral','ambos']).notNull(),
	origin: varchar({ length: 255 }),
	notes: text(),
	riskLevel: mysqlEnum("risk_level", ['baixo','medio','alto']),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
});

export const reminderLogs = mysqlTable("reminderLogs", {
	id: int().autoincrement().notNull(),
	patientId: int().notNull().references(() => patients.id, { onDelete: "cascade" } ),
	type: mysqlEnum(['email','sms','whatsapp']).notNull(),
	content: text().notNull(),
	status: mysqlEnum(['sent','failed','pending']).default('pending').notNull(),
	sentAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdBy: int().notNull().references(() => users.id),
});

export const rescheduleAlerts = mysqlTable("rescheduleAlerts", {
	id: int().autoincrement().notNull(),
	patientId: int().notNull().references(() => patients.id, { onDelete: "cascade" } ),
	patientName: varchar({ length: 255 }).notNull(),
	patientPhone: varchar({ length: 50 }).notNull(),
	message: text().notNull(),
	viewed: tinyint().default(0).notNull(),
	viewedAt: timestamp({ mode: 'string' }),
	resolved: tinyint().default(0).notNull(),
	resolvedAt: timestamp({ mode: 'string' }),
	resolvedBy: int().references(() => users.id),
	timestamp: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const rescheduleRequests = mysqlTable("rescheduleRequests", {
	id: int().autoincrement().notNull(),
	clinicId: int("clinic_id").notNull().references(() => clinics.id, { onDelete: "cascade" }),
	appointmentId: int("appointment_id").notNull().references(() => appointments.id, { onDelete: "cascade" } ),
	patientId: int("patient_id").notNull().references(() => patients.id),
	detectedMessage: text("detected_message").notNull(),
	detectedKeywords: varchar("detected_keywords", { length: 500 }),
	status: mysqlEnum(['pending','resolved','cancelled']).default('pending').notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	resolvedAt: timestamp("resolved_at", { mode: 'string' }),
});

export const tags = mysqlTable("tags", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	color: varchar({ length: 20 }).default('#3B82F6'),
	description: text(),
	tagType: mysqlEnum("tag_type", ['patient','conversation','appointment','general']).default('general'),
	isActive: tinyint("is_active").default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("idx_type").on(table.tagType),
	index("idx_active").on(table.isActive),
	index("name").on(table.name),
]);

export const treatments = mysqlTable("treatments", {
	id: int().autoincrement().notNull(),
	clinicId: int("clinic_id").notNull().references(() => clinics.id, { onDelete: "cascade" }),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	duration: int(),
	price: decimal({ precision: 10, scale: 2 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	openId: varchar({ length: 64 }).notNull(),
	name: text(),
	email: varchar({ length: 320 }),
	loginMethod: varchar({ length: 64 }),
	role: mysqlEnum(['user','admin']).default('user').notNull(),
	clinicId: int("clinic_id").references(() => clinics.id, { onDelete: "cascade" }),
	passwordHash: varchar("password_hash", { length: 255 }),
	accountStatus: mysqlEnum("account_status", ['pending', 'approved', 'rejected', 'suspended']).default('pending').notNull(),
	approvedBy: int("approved_by"),  // Self-reference added via relations
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	rejectedAt: timestamp("rejected_at", { mode: 'string' }),
	suspendedAt: timestamp("suspended_at", { mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	lastSignedIn: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("users_openId_unique").on(table.openId),
]);

export const waitlist = mysqlTable("waitlist", {
	id: int().autoincrement().notNull(),
	clinicId: int("clinic_id").notNull().references(() => clinics.id, { onDelete: "cascade" }),
	patientId: int("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" } ),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	preferredDate: date("preferred_date", { mode: 'string' }),
	preferredTimeSlot: mysqlEnum("preferred_time_slot", ['morning','afternoon','evening','any']).default('any'),
	treatmentType: varchar("treatment_type", { length: 200 }),
	priority: mysqlEnum(['low','medium','high','urgent']).default('medium'),
	status: mysqlEnum(['waiting','contacted','scheduled','cancelled','expired']).default('waiting'),
	notes: text(),
	addedBy: int("added_by").references(() => users.id),
	contactedAt: timestamp("contacted_at", { mode: 'string' }),
	scheduledAt: timestamp("scheduled_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("idx_patient").on(table.patientId),
	index("idx_status").on(table.status),
	index("idx_priority").on(table.priority),
	]);

export const whatsappConversations= mysqlTable("whatsappConversations", {
	id: int().autoincrement().notNull(),
	clinicId: int("clinic_id").notNull().references(() => clinics.id, { onDelete: "cascade" }),
	patientId: int("patient_id").references(() => patients.id, { onDelete: "cascade" } ),
	phone: varchar({ length: 50 }).notNull(),
	lastMessage: text(),
	lastMessageAt: timestamp({ mode: 'string' }),
	status: mysqlEnum(['unread','read','archived']).default('unread').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_status").on(table.status),
	index("idx_phone").on(table.phone),
]);

export const whatsappMessages = mysqlTable("whatsapp_messages", {
	id: int().autoincrement().notNull(),
	clinicId: int("clinic_id").notNull().references(() => clinics.id, { onDelete: "cascade" }),
	conversationId: int("conversation_id").notNull().references(() => whatsappConversations.id, { onDelete: "cascade" } ),
	senderType: mysqlEnum("sender_type", ['patient','secretary','system']).notNull(),
	senderId: int("sender_id"),
	messageText: text("message_text").notNull(),
	messageType: mysqlEnum("message_type", ['text','image','audio','video','document']).default('text'),
	mediaUrl: varchar("media_url", { length: 500 }),
	status: mysqlEnum(['sent','delivered','read','failed']).default('sent'),
	isTemplate: tinyint("is_template").default(0),
	templateId: int("template_id"),
	sentAt: timestamp("sent_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	deliveredAt: timestamp("delivered_at", { mode: 'string' }),
	readAt: timestamp("read_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
},
(table) => [
	index("idx_conversation").on(table.conversationId),
	index("idx_sent_at").on(table.sentAt),
	index("idx_status").on(table.status),
]);

// ==================== REMINDER SYSTEM TABLES ====================

export const reminderQueue = mysqlTable("reminder_queue", {
	id: int().autoincrement().notNull(),
	appointmentId: int("appointment_id").notNull().references(() => appointments.id, { onDelete: "cascade" }),
	patientId: int("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
	reminderType: mysqlEnum("reminder_type", [
		'2_days_before_10h', '2_days_before_15h', '2_days_before_19h',
		'1_day_before_7h', '1_day_before_8h', '1_day_before_10h',
		'1_day_before_12h', '1_day_before_14h', '1_day_before_16h',
		'1_day_before_18h', 'same_day_6h30', 'same_day_3h_before',
		'post_confirmation_next_day', 'same_day_confirmed_7h'
	]).notNull(),
	scheduledAt: timestamp("scheduled_at", { mode: 'string' }).notNull(),
	sentAt: timestamp("sent_at", { mode: 'string' }),
	status: mysqlEnum(['pending', 'sent', 'failed', 'cancelled']).default('pending').notNull(),
	whatsappNumber: varchar("whatsapp_number", { length: 50 }),
	messageId: varchar("message_id", { length: 255 }),
	deliveryStatus: mysqlEnum("delivery_status", ['sent', 'delivered', 'read', 'failed']),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_scheduled_at").on(table.scheduledAt),
	index("idx_status").on(table.status),
	index("idx_appointment").on(table.appointmentId),
]);

export const reminderResponses = mysqlTable("reminder_responses", {
	id: int().autoincrement().notNull(),
	appointmentId: int("appointment_id").notNull().references(() => appointments.id, { onDelete: "cascade" }),
	patientId: int("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
	messageText: text("message_text").notNull(),
	detectedIntent: mysqlEnum("detected_intent", ['confirmed', 'cancelled', 'reschedule', 'unknown']),
	detectedKeywords: varchar("detected_keywords", { length: 500 }),
	receivedAt: timestamp("received_at", { mode: 'string' }).notNull(),
	processed: tinyint().default(0).notNull(),
	processedAt: timestamp("processed_at", { mode: 'string' }),
},
(table) => [
	index("idx_intent").on(table.detectedIntent),
	index("idx_processed").on(table.processed),
	index("idx_appointment").on(table.appointmentId),
]);

export const whatsappNumbers = mysqlTable("whatsapp_numbers", {
	id: int().autoincrement().notNull(),
	numberName: varchar("number_name", { length: 100 }).notNull(),
	phoneNumber: varchar("phone_number", { length: 50 }).notNull(),
	country: varchar({ length: 50 }).notNull(),
	channelType: mysqlEnum("channel_type", ['integration', 'reminders']).notNull(),
	instanceName: varchar("instance_name", { length: 100 }),
	dailyLimit: int("daily_limit").default(1000).notNull(),
	dailyMessageCount: int("daily_message_count").default(0).notNull(),
	status: mysqlEnum(['active', 'blocked', 'warning', 'inactive']).default('active').notNull(),
	lastUsedAt: timestamp("last_used_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_country").on(table.country),
	index("idx_channel_type").on(table.channelType),
	index("idx_status").on(table.status),
]);

// ============================================
// SISTEMA DE CANAIS DE COMUNICAÇÃO
// ============================================

export const communicationChannels = mysqlTable("communication_channels", {
	id: int().autoincrement().notNull(),
	clinicId: int("clinic_id").notNull().references(() => clinics.id, { onDelete: "cascade" }),
	channelName: varchar("channel_name", { length: 100 }).notNull(),
	channelType: mysqlEnum("channel_type", ['whatsapp', 'messenger', 'n8n', 'chatwoot', 'email']).notNull(),
	purpose: mysqlEnum(['integration', 'reminders', 'both']).notNull(),
	phoneNumber: varchar("phone_number", { length: 50 }),
	instanceId: varchar("instance_id", { length: 255 }),
	apiKey: text("api_key"),
	apiUrl: varchar("api_url", { length: 500 }),
	qrCode: text("qr_code"),
	isConnected: tinyint("is_connected").default(0).notNull(),
	connectionStatus: mysqlEnum("connection_status", ['connected', 'disconnected', 'error', 'pending']).default('pending').notNull(),
	lastConnectionCheck: timestamp("last_connection_check", { mode: 'string' }),
	dailyLimit: int("daily_limit").default(1000).notNull(),
	dailyMessageCount: int("daily_message_count").default(0).notNull(),
	messageInterval: int("message_interval").default(3).notNull(), // seconds
	healthScore: int("health_score").default(100).notNull(), // 0-100
	status: mysqlEnum(['active', 'blocked', 'warning', 'inactive', 'paused']).default('active').notNull(),
	autoRotationEnabled: tinyint("auto_rotation_enabled").default(1).notNull(),
	pauseThreshold: int("pause_threshold").default(20).notNull(), // health score threshold
	metadata: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_clinic").on(table.clinicId),
	index("idx_type").on(table.channelType),
	index("idx_purpose").on(table.purpose),
	index("idx_status").on(table.status),
	index("idx_health").on(table.healthScore),
]);

export const channelMessagesLog = mysqlTable("channel_messages_log", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	channelId: int("channel_id").notNull().references(() => communicationChannels.id, { onDelete: "cascade" }),
	appointmentId: int("appointment_id").references(() => appointments.id, { onDelete: "set null" }),
	patientId: int("patient_id").references(() => patients.id, { onDelete: "set null" }),
	messageType: mysqlEnum("message_type", ['reminder', 'confirmation', 'marketing', 'followup', 'rescheduling', 'other']).notNull(),
	messageContent: text("message_content").notNull(),
	recipientPhone: varchar("recipient_phone", { length: 50 }).notNull(),
	messageId: varchar("message_id", { length: 255 }),
	status: mysqlEnum(['pending', 'sent', 'delivered', 'read', 'failed']).default('pending').notNull(),
	deliveryTimestamp: timestamp("delivery_timestamp", { mode: 'string' }),
	readTimestamp: timestamp("read_timestamp", { mode: 'string' }),
	errorMessage: text("error_message"),
	responseReceived: tinyint("response_received").default(0).notNull(),
	responseText: text("response_text"),
	responseTimestamp: timestamp("response_timestamp", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_channel").on(table.channelId),
	index("idx_status").on(table.status),
	index("idx_type").on(table.messageType),
	index("idx_created").on(table.createdAt),
	index("idx_appointment").on(table.appointmentId),
]);

export const channelHealthHistory = mysqlTable("channel_health_history", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	channelId: int("channel_id").notNull().references(() => communicationChannels.id, { onDelete: "cascade" }),
	healthScore: int("health_score").notNull(), // 0-100
	messagesSent: int("messages_sent").default(0).notNull(),
	messagesDelivered: int("messages_delivered").default(0).notNull(),
	messagesRead: int("messages_read").default(0).notNull(),
	messagesFailed: int("messages_failed").default(0).notNull(),
	responsesReceived: int("responses_received").default(0).notNull(),
	deliveryRate: decimal("delivery_rate", { precision: 5, scale: 2 }).default('0.00').notNull(), // percentage
	readRate: decimal("read_rate", { precision: 5, scale: 2 }).default('0.00').notNull(), // percentage
	responseRate: decimal("response_rate", { precision: 5, scale: 2 }).default('0.00').notNull(), // percentage
	avgResponseTime: int("avg_response_time").default(0).notNull(), // minutes
	recordedAt: timestamp("recorded_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_channel").on(table.channelId),
	index("idx_recorded").on(table.recordedAt),
	index("idx_health").on(table.healthScore),
]);

export const channelAntiblockConfig = mysqlTable("channel_antiblock_config", {
	id: int().autoincrement().notNull(),
	channelId: int("channel_id").notNull().references(() => communicationChannels.id, { onDelete: "cascade" }),
	enabled: tinyint().default(1).notNull(),
	dailyLimit: int("daily_limit").default(1000).notNull(),
	hourlyLimit: int("hourly_limit").default(100).notNull(),
	minIntervalSeconds: int("min_interval_seconds").default(3).notNull(),
	maxIntervalSeconds: int("max_interval_seconds").default(10).notNull(),
	burstLimit: int("burst_limit").default(10).notNull(), // max messages in burst
	burstWindowSeconds: int("burst_window_seconds").default(60).notNull(),
	cooldownMinutes: int("cooldown_minutes").default(30).notNull(),
	autoRotateOnLimit: tinyint("auto_rotate_on_limit").default(1).notNull(),
	autoPauseOnBlock: tinyint("auto_pause_on_block").default(1).notNull(),
	pauseThresholdHealth: int("pause_threshold_health").default(20).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_channel").on(table.channelId),
]);

export const channelAlerts = mysqlTable("channel_alerts", {
	id: int().autoincrement().notNull(),
	channelId: int("channel_id").notNull().references(() => communicationChannels.id, { onDelete: "cascade" }),
	alertType: mysqlEnum("alert_type", ['health_low', 'blocked', 'limit_reached', 'connection_lost', 'high_failure_rate']).notNull(),
	severity: mysqlEnum(['critical', 'warning', 'info']).default('info').notNull(),
	title: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	metadata: json(),
	isResolved: tinyint("is_resolved").default(0).notNull(),
	resolvedAt: timestamp("resolved_at", { mode: 'string' }),
	resolvedBy: int("resolved_by").references(() => users.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_channel").on(table.channelId),
	index("idx_type").on(table.alertType),
	index("idx_severity").on(table.severity),
	index("idx_resolved").on(table.isResolved),
	index("idx_created").on(table.createdAt),
]);


// Sistema de Convites para Clínicas
export const clinicInvites = mysqlTable("clinic_invites", {
	id: int().autoincrement().notNull(),
	clinicId: int("clinic_id").notNull().references(() => clinics.id, { onDelete: "cascade" }),
	inviteCode: varchar("invite_code", { length: 64 }).notNull(),
	email: varchar({ length: 320 }),
	phone: varchar({ length: 20 }),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	usedAt: timestamp("used_at", { mode: 'string' }),
	usedBy: int("used_by").references(() => users.id, { onDelete: "set null" }),
	status: mysqlEnum(['pending', 'used', 'expired', 'revoked']).default('pending').notNull(),
	createdBy: int("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	revokedAt: timestamp("revoked_at", { mode: 'string' }),
	revokedBy: int("revoked_by").references(() => users.id, { onDelete: "set null" }),
},
(table) => [
	index("idx_invite_code").on(table.inviteCode),
	index("idx_clinic").on(table.clinicId),
	index("idx_status").on(table.status),
]);


export const apiErrorLogs = mysqlTable("api_error_logs", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	endpoint: varchar({ length: 255 }).notNull(),
	method: varchar({ length: 10 }).notNull(),
	errorMessage: text("error_message").notNull(),
	stackTrace: text("stack_trace"),
	userId: int("user_id").references(() => users.id, { onDelete: "set null" }),
	severity: mysqlEnum(['critical', 'error', 'warning', 'info']).default('error').notNull(),
	statusCode: int("status_code"),
	requestBody: text("request_body"),
	responseBody: text("response_body"),
	userAgent: varchar("user_agent", { length: 500 }),
	ipAddress: varchar("ip_address", { length: 45 }),
	notified: tinyint().default(0).notNull(),
	notifiedAt: timestamp("notified_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_severity").on(table.severity),
	index("idx_endpoint").on(table.endpoint),
	index("idx_created_at").on(table.createdAt),
	index("idx_user_id").on(table.userId),
]);
