import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const exams = await db.exam.findMany({
      include: { class: true, subject: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(exams)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const exam = await db.exam.create({
      data: body,
      include: { class: true, subject: true },
    })
    return NextResponse.json(exam)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create exam' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    const body = await req.json()
    const exam = await db.exam.update({
      where: { id },
      data: body,
      include: { class: true, subject: true },
    })
    return NextResponse.json(exam)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update exam' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.exam.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete exam' }, { status: 500 })
  }
}
