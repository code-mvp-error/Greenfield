import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const staff = await db.staff.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(staff)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const staff = await db.staff.create({ data: body })
    return NextResponse.json(staff)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create staff' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    const body = await req.json()
    const staff = await db.staff.update({ where: { id }, data: body })
    return NextResponse.json(staff)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update staff' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.staff.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 })
  }
}
