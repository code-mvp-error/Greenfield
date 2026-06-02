import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const teachers = await db.teacher.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(teachers)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const teacher = await db.teacher.create({ data: body })
    return NextResponse.json(teacher)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create teacher' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    const body = await req.json()
    const teacher = await db.teacher.update({ where: { id }, data: body })
    return NextResponse.json(teacher)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update teacher' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.teacher.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete teacher' }, { status: 500 })
  }
}
