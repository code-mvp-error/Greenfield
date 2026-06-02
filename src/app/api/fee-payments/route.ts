import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const feePayments = await db.feePayment.findMany({
      include: { student: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(feePayments)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch fee payments' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const feePayment = await db.feePayment.create({
      data: body,
      include: { student: true },
    })
    return NextResponse.json(feePayment)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create fee payment' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    const body = await req.json()
    const feePayment = await db.feePayment.update({
      where: { id },
      data: body,
      include: { student: true },
    })
    return NextResponse.json(feePayment)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update fee payment' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.feePayment.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete fee payment' }, { status: 500 })
  }
}
