import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const studentId = req.nextUrl.searchParams.get('studentId')
    const month = req.nextUrl.searchParams.get('month')
    const status = req.nextUrl.searchParams.get('status')
    const classId = req.nextUrl.searchParams.get('classId')

    const where: Record<string, unknown> = {}
    if (studentId) where.studentId = studentId
    if (month) where.month = month
    if (status) where.status = status
    if (classId) where.student = { classId }

    const invoices = await db.invoice.findMany({
      where,
      include: {
        student: true,
        lines: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(invoices)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { studentId, month, academicYear, dueDate, issuedDate, lines, remarks } = body

    if (!studentId || !month || !lines || !Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json(
        { error: 'studentId, month, and lines (non-empty array) are required' },
        { status: 400 }
      )
    }

    // Auto-calculate totalAmount from lines
    const totalAmount = lines.reduce((sum: number, line: { amount: number }) => {
      return sum + parseFloat(String(line.amount || 0))
    }, 0)

    // Check if invoice already exists for this student+month
    const existing = await db.invoice.findUnique({
      where: { studentId_month: { studentId, month } },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Invoice already exists for this student and month', invoice: existing },
        { status: 409 }
      )
    }

    const invoice = await db.invoice.create({
      data: {
        studentId,
        month,
        academicYear: academicYear || '2025-2026',
        status: 'Pending',
        totalAmount,
        paidAmount: 0,
        dueDate: dueDate || '',
        issuedDate: issuedDate || new Date().toISOString().split('T')[0],
        remarks: remarks || '',
        lines: {
          create: lines.map((line: { feeType: string; description: string; amount: number }) => ({
            feeType: line.feeType,
            description: line.description || '',
            amount: parseFloat(String(line.amount || 0)),
          })),
        },
      },
      include: {
        student: true,
        lines: true,
        payments: true,
      },
    })

    return NextResponse.json(invoice)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}
