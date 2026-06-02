import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const date = req.nextUrl.searchParams.get('date')
    const classId = req.nextUrl.searchParams.get('classId')

    const studentId = req.nextUrl.searchParams.get('studentId')
    const where: Record<string, string> = {}
    if (date) where.date = date
    if (classId) where.classId = classId
    if (studentId) where.studentId = studentId

    const attendance = await db.attendance.findMany({
      where,
      include: { student: true, class: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(attendance)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { records } = body as { records: Array<{ studentId: string; classId: string; date: string; status: string; remarks: string }> }

    // Upsert attendance records
    for (const record of records) {
      await db.attendance.upsert({
        where: {
          studentId_classId_date: {
            studentId: record.studentId,
            classId: record.classId,
            date: record.date,
          },
        },
        update: { status: record.status, remarks: record.remarks },
        create: record,
      })
    }

    return NextResponse.json({ success: true, count: records.length })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 })
  }
}
