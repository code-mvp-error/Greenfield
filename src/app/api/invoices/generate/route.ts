import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { month, classId } = body

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: 'month is required in YYYY-MM format' },
        { status: 400 }
      )
    }

    // Calculate the last day of the month for dueDate
    const [year, mon] = month.split('-').map(Number)
    const dueDate = new Date(year, mon, 0).toISOString().split('T')[0] // last day of month
    const isSeptember = month.endsWith('-09')

    // Get active students, optionally filtered by class
    const studentWhere: Record<string, unknown> = { status: 'Active' }
    if (classId) {
      studentWhere.classId = classId
    }

    const students = await db.student.findMany({
      where: studentWhere,
      include: { class: true },
    })

    if (students.length === 0) {
      return NextResponse.json({ message: 'No active students found', generated: 0 })
    }

    // Get all relevant fee structures grouped by classId
    const classIds = [...new Set(students.map((s) => s.classId).filter(Boolean) as string[])]
    const feeStructures = await db.feeStructure.findMany({
      where: { classId: { in: classIds } },
    })

    // Group fee structures by classId
    const feeStructuresByClass: Record<string, typeof feeStructures> = {}
    for (const fs of feeStructures) {
      if (!feeStructuresByClass[fs.classId]) feeStructuresByClass[fs.classId] = []
      feeStructuresByClass[fs.classId].push(fs)
    }

    // Check existing invoices for this month to avoid duplicates
    const existingInvoices = await db.invoice.findMany({
      where: { month },
      select: { studentId: true },
    })
    const existingStudentIds = new Set(existingInvoices.map((i) => i.studentId))

    let generated = 0
    let skipped = 0
    const errors: string[] = []

    for (const student of students) {
      // Skip if invoice already exists for this student+month
      if (existingStudentIds.has(student.id)) {
        skipped++
        continue
      }

      // Skip if student has no class assigned
      if (!student.classId) {
        skipped++
        continue
      }

      // Get fee structures for the student's class
      const classFeeStructures = feeStructuresByClass[student.classId] || []

      // Build invoice lines based on period rules
      const lines: { feeType: string; description: string; amount: number }[] = []
      for (const fs of classFeeStructures) {
        if (fs.period === 'monthly') {
          // Monthly fees (e.g., Scolarité, Transport, Cantine) are added every month
          lines.push({
            feeType: fs.feeType,
            description: fs.description || `${fs.feeType} - ${month}`,
            amount: fs.amount,
          })
        } else if (fs.period === 'yearly' && isSeptember) {
          // Yearly fees (e.g., Inscription) are added only in September (start of school year)
          lines.push({
            feeType: fs.feeType,
            description: fs.description || `${fs.feeType} - ${year}`,
            amount: fs.amount,
          })
        } else if (fs.period === 'one-time' && isSeptember) {
          // One-time fees are added in September as well
          lines.push({
            feeType: fs.feeType,
            description: fs.description || `${fs.feeType}`,
            amount: fs.amount,
          })
        }
      }

      // Skip if no lines to add (e.g., no monthly fees and not September)
      if (lines.length === 0) {
        skipped++
        continue
      }

      // Calculate totalAmount from lines
      const totalAmount = lines.reduce((sum, line) => sum + line.amount, 0)

      // Determine academic year from the month
      const academicYear = mon >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`

      try {
        await db.invoice.create({
          data: {
            studentId: student.id,
            month,
            academicYear,
            status: 'Pending',
            totalAmount,
            paidAmount: 0,
            dueDate,
            issuedDate: new Date().toISOString().split('T')[0],
            remarks: '',
            lines: {
              create: lines.map((line) => ({
                feeType: line.feeType,
                description: line.description,
                amount: line.amount,
              })),
            },
          },
        })
        generated++
      } catch (err) {
        // Handle unique constraint violation (race condition)
        const message = err instanceof Error ? err.message : 'Unknown error'
        if (message.includes('Unique')) {
          skipped++
        } else {
          errors.push(`Student ${student.firstName} ${student.lastName}: ${message}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      generated,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
      message: `Generated ${generated} invoice(s), skipped ${skipped}`,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to generate invoices' }, { status: 500 })
  }
}
