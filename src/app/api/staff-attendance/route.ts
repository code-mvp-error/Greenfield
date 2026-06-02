import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const date = req.nextUrl.searchParams.get('date')
    const where: Record<string, string> = {}
    if (date) where.date = date

    const attendance = await db.staffAttendance.findMany({
      where,
      include: { teacher: true, staff: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(attendance)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch staff attendance' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { records } = body as { records: Array<{ teacherId?: string; staffId?: string; date: string; status: string; remarks: string }> }

    for (const record of records) {
      await db.staffAttendance.create({ data: record })
    }

    return NextResponse.json({ success: true, count: records.length })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to save staff attendance' }, { status: 500 })
  }
}
