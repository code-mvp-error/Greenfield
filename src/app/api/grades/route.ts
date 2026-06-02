import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const examId = req.nextUrl.searchParams.get('examId')
    const studentId = req.nextUrl.searchParams.get('studentId')
    const where: Record<string, string> = {}
    if (examId) where.examId = examId
    if (studentId) where.studentId = studentId

    const grades = await db.grade.findMany({
      where,
      include: { student: true, exam: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(grades)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { records } = body as { records: Array<{ studentId: string; examId: string; marksObtained: number; grade: string; remarks: string }> }

    for (const record of records) {
      await db.grade.upsert({
        where: {
          studentId_examId: {
            studentId: record.studentId,
            examId: record.examId,
          },
        },
        update: { marksObtained: record.marksObtained, grade: record.grade, remarks: record.remarks },
        create: record,
      })
    }

    return NextResponse.json({ success: true, count: records.length })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to save grades' }, { status: 500 })
  }
}
