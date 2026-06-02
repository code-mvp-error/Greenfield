import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const feeStructures = await db.feeStructure.findMany({
      include: { class: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(feeStructures)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch fee structures' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const feeStructure = await db.feeStructure.create({
      data: body,
      include: { class: true },
    })
    return NextResponse.json(feeStructure)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create fee structure' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    const body = await req.json()
    const feeStructure = await db.feeStructure.update({
      where: { id },
      data: body,
      include: { class: true },
    })
    return NextResponse.json(feeStructure)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update fee structure' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.feeStructure.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete fee structure' }, { status: 500 })
  }
}
