import { z } from "zod";

/**
 * Common reusable schemas
 */
export const uuidSchema = z.string().uuid();

export const nullableUuidSchema = z.string().uuid().nullable().optional();

export const emailSchema = z.string().email();

export const roleSchema = z.enum([
  "EMPLOYEE",
  "TEAM_LEAD",
  "MANAGER",
  "HR",
  "IT_SUPPORT",
  "ADMIN",
]);

export const ticketStatusSchema = z.enum([
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "PENDING",
  "WAITING_FOR_EMPLOYEE",
  "RESOLVED",
  "CLOSED",
]);

export const prioritySchema = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

export const ticketCategorySchema = z.enum([
  "HARDWARE",
  "SOFTWARE",
  "NETWORK",
  "VPN",
  "EMAIL",
  "ACCESS_REQUEST",
  "OTHER",
]);

export const requestStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
]);

export const urgencyLevelSchema = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
]);

export const verificationStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
]);

export const attachmentSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileUrl: z.string().url(),
  contentType: z.string().max(100).optional(),
});

/**
 * Auth
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(128),
});

/**
 * Tickets
 */
export const createTicketSchema = z.object({
  title: z.string().min(3).max(200),
  category: ticketCategorySchema,
  priority: prioritySchema,
  description: z.string().min(10).max(10000),
  employeeId: uuidSchema,
  departmentId: z.string().uuid().optional().nullable(),
  contactEmail: emailSchema,
  attachments: z.array(attachmentSchema).optional(),
});

export const updateTicketSchema = z.object({
  status: ticketStatusSchema.optional(),
  assignedToId: nullableUuidSchema,
  priority: prioritySchema.optional(),
});

export const createTicketCommentSchema = z.object({
  message: z.string().min(1).max(5000),
  attachments: z.array(attachmentSchema).optional(),
});

/**
 * Document Requests
 */
export const documentTypeSchema = z.enum([
  "Employment Letter",
  "Salary Certificate",
  "Experience Letter",
  "Offer Letter Copy",
  "Relieving Letter",
]);

export const createDocumentRequestSchema = z.object({
  employeeId: uuidSchema,
  documentType: documentTypeSchema,
  purpose: z.string().min(3).max(500),
  urgencyLevel: urgencyLevelSchema,
});

export const updateDocumentRequestSchema = z.object({
  status: requestStatusSchema.optional(),
  hrNotes: z.string().max(2000).optional().nullable(),
  documentUrl: z.string().url().optional().nullable(),
});

/**
 * Employment Verification
 */
export const createEmploymentVerificationSchema = z.object({
  employeeId: uuidSchema,
  employeeName: z.string().min(2).max(200),
  companyName: z.string().min(2).max(200),
  requestEmail: emailSchema,
  verificationPurpose: z.string().min(3).max(1000),
});

export const updateEmploymentVerificationSchema = z.object({
  status: verificationStatusSchema.optional(),
  hrNotes: z.string().max(2000).optional().nullable(),
});

/**
 * Background Verification
 */
export const createBackgroundVerificationSchema = z.object({
  employeeId: uuidSchema,
  verificationCompany: z.string().min(2).max(200),
  verificationStatus: z.string().min(2).max(100),
  verificationNotes: z.string().max(5000).optional().nullable(),
  documentUrl: z.string().url().optional().nullable(),
});

export const updateBackgroundVerificationSchema = z.object({
  verificationCompany: z.string().min(2).max(200).optional(),
  verificationStatus: z.string().min(2).max(100).optional(),
  verificationNotes: z.string().max(5000).optional().nullable(),
  documentUrl: z.string().url().optional().nullable(),
});

/**
 * Uploads
 */
export const uploadModuleSchema = z.enum([
  "tickets",
  "documents",
  "employment-verification",
  "background-verification",
  "learning",
  "avatars",
]);

export const createPresignUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(100),
  module: uploadModuleSchema,
});

/**
 * Admin - Users
 */
export const createUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: emailSchema,
  password: z.string().min(8).max(128).optional(),
  employeeId: z.string().min(2).max(50).optional().nullable(),
  role: roleSchema,
  departmentId: z.string().uuid().optional().nullable(),
  keycloakId: z.string().min(2).max(255).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
});

export const updateUserDataSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  email: emailSchema.optional(),
  password: z.string().min(8).max(128).optional(),
  employeeId: z.string().min(2).max(50).optional().nullable(),
  role: roleSchema.optional(),
  departmentId: z.string().uuid().optional().nullable(),
  keycloakId: z.string().min(2).max(255).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const updateUserSchema = z.object({
  userId: uuidSchema,
  data: updateUserDataSchema,
});

export const deleteUserSchema = z.object({
  userId: uuidSchema,
});

/**
 * Utility
 */
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type CreateTicketCommentInput = z.infer<typeof createTicketCommentSchema>;

export type CreateDocumentRequestInput = z.infer<typeof createDocumentRequestSchema>;
export type UpdateDocumentRequestInput = z.infer<typeof updateDocumentRequestSchema>;

export type CreateEmploymentVerificationInput = z.infer<
  typeof createEmploymentVerificationSchema
>;
export type UpdateEmploymentVerificationInput = z.infer<
  typeof updateEmploymentVerificationSchema
>;

export type CreateBackgroundVerificationInput = z.infer<
  typeof createBackgroundVerificationSchema
>;
export type UpdateBackgroundVerificationInput = z.infer<
  typeof updateBackgroundVerificationSchema
>;

export type CreatePresignUploadInput = z.infer<typeof createPresignUploadSchema>;

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type DeleteUserInput = z.infer<typeof deleteUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;