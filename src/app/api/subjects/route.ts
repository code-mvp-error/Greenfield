import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const subjects = await db.subject.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(subjects)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const subject = await db.subject.create({ data: body })
    return NextResponse.json(subject)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    const body = await req.json()
    const subject = await db.subject.update({ where: { id }, data: body })
    return NextResponse.json(subject)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update subject' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.subject.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 })
  }
}
