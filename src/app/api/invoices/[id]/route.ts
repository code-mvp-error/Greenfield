import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        student: true,
        lines: true,
        payments: true,
      },
    })
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }
    return NextResponse.json(invoice)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const data: Record<string, unknown> = {}
    if (body.status !== undefined) data.status = body.status
    if (body.remarks !== undefined) data.remarks = body.remarks
    if (body.dueDate !== undefined) data.dueDate = body.dueDate
    if (body.issuedDate !== undefined) data.issuedDate = body.issuedDate
    if (body.totalAmount !== undefined) data.totalAmount = parseFloat(String(body.totalAmount))
    if (body.paidAmount !== undefined) data.paidAmount = parseFloat(String(body.paidAmount))
    if (body.academicYear !== undefined) data.academicYear = body.academicYear

    const invoice = await db.invoice.update({
      where: { id },
      data,
      include: {
        student: true,
        lines: true,
        payments: true,
      },
    })
    return NextResponse.json(invoice)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Delete associated lines first (though cascading should handle this)
    await db.invoiceLine.deleteMany({ where: { invoiceId: id } })
    // Delete associated payments
    await db.feePayment.deleteMany({ where: { invoiceId: id } })
    // Delete the invoice
    await db.invoice.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
  }
}
