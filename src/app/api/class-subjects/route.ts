import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const classSubjects = await db.classSubject.findMany({
      include: {
        class: true,
        subject: true,
        teacher: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(classSubjects)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch class subjects' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const classSubject = await db.classSubject.create({
      data: body,
      include: { class: true, subject: true, teacher: true },
    })
    return NextResponse.json(classSubject)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create class subject' }, { status: 500 })
  }
}
