import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const announcements = await db.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(announcements)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const announcement = await db.announcement.create({ data: body })
    return NextResponse.json(announcement)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    const body = await req.json()
    const announcement = await db.announcement.update({ where: { id }, data: body })
    return NextResponse.json(announcement)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.announcement.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 })
  }
}
