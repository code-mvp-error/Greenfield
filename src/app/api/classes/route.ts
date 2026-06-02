import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const classes = await db.class.findMany({
      include: {
        classTeacher: true,
        students: true,
        _count: { select: { students: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(classes)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const cls = await db.class.create({
      data: body,
      include: { classTeacher: true, students: true, _count: { select: { students: true } } },
    })
    return NextResponse.json(cls)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create class' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    const body = await req.json()
    const cls = await db.class.update({
      where: { id },
      data: body,
      include: { classTeacher: true, students: true, _count: { select: { students: true } } },
    })
    return NextResponse.json(cls)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update class' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.class.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 })
  }
}
