import { z } from 'zod'

export const StudentFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').or(z.literal('')),
  phone: z.string().optional().default(''),
  dateOfBirth: z.string().optional().default(''),
  gender: z.string().min(1, 'Gender is required'),
  address: z.string().optional().default(''),
  guardianName: z.string().optional().default(''),
  guardianPhone: z.string().optional().default(''),
  enrollmentDate: z.string().optional().default(''),
  status: z.string().optional().default('Active'),
  classId: z.string().optional().default(''),
})

export const TeacherFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().default(''),
  dateOfBirth: z.string().optional().default(''),
  gender: z.string().optional().default('Male'),
  address: z.string().optional().default(''),
  qualification: z.string().min(1, 'Qualification is required'),
  specialization: z.string().min(1, 'Specialization is required'),
  hireDate: z.string().optional().default(''),
  status: z.string().optional().default('Active'),
})

export const StaffFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().default(''),
  role: z.string().min(1, 'Role is required'),
  department: z.string().min(1, 'Department is required'),
  hireDate: z.string().optional().default(''),
  status: z.string().optional().default('Active'),
})

export const ClassFormSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  section: z.string().min(1, 'Section is required'),
  grade: z.string().min(1, 'Grade is required'),
  academicYear: z.string().optional().default('2025-2026'),
  classTeacherId: z.string().nullable().optional(),
})

export const SubjectFormSchema = z.object({
  name: z.string().min(1, 'Subject name is required'),
  code: z.string().min(1, 'Subject code is required'),
  description: z.string().optional().default(''),
})

export const FeeStructureFormSchema = z.object({
  classId: z.string().min(1, 'Class is required'),
  feeType: z.string().min(1, 'Fee type is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  academicYear: z.string().optional().default('2025-2026'),
  description: z.string().optional().default(''),
})

export const FeePaymentFormSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  feeType: z.string().min(1, 'Fee type is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  paymentDate: z.string().optional().default(''),
  paymentMethod: z.string().optional().default('Cash'),
  status: z.string().optional().default('Paid'),
  receiptNumber: z.string().optional().default(''),
  academicYear: z.string().optional().default('2025-2026'),
  remarks: z.string().optional().default(''),
})

export const AnnouncementFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  targetAudience: z.string().min(1, 'Target audience is required'),
  priority: z.string().optional().default('Normal'),
  authorName: z.string().optional().default(''),
  isActive: z.boolean().optional().default(true),
})

export const MessageFormSchema = z.object({
  senderName: z.string().min(1, 'Sender name is required'),
  senderRole: z.string().optional().default('Admin'),
  receiverName: z.string().min(1, 'Recipient name is required'),
  receiverRole: z.string().optional().default(''),
  subject: z.string().min(1, 'Subject is required'),
  content: z.string().min(1, 'Message content is required'),
})

export const EventFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  eventType: z.string().min(1, 'Event type is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional().nullable(),
  color: z.string().optional().default('#059669'),
})

export type FormErrors = Record<string, string>

export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; errors: FormErrors; data?: T } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, errors: {}, data: result.data }
  }
  const errors: FormErrors = {}
  result.error.issues.forEach((issue) => {
    const key = issue.path[0]?.toString()
    if (key && !errors[key]) {
      errors[key] = issue.message
    }
  })
  return { success: false, errors }
}
