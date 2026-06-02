import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const events = await db.schoolEvent.findMany({
      orderBy: { startDate: 'asc' },
    })
    return NextResponse.json(events)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const event = await db.schoolEvent.create({ data: body })
    return NextResponse.json(event)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    const body = await req.json()
    const event = await db.schoolEvent.update({ where: { id }, data: body })
    return NextResponse.json(event)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.schoolEvent.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}
