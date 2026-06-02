import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get('action')

    // Get all pending fee payments that are older than 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

    const pendingPayments = await db.feePayment.findMany({
      where: {
        status: 'Pending',
      },
      include: { student: true },
      orderBy: { createdAt: 'asc' },
    })

    // Filter to those where paymentDate is before 30 days ago (or empty paymentDate and createdAt is old)
    const overduePayments = pendingPayments.filter((p) => {
      const dateStr = p.paymentDate || p.createdAt.toISOString().split('T')[0]
      return dateStr < thirtyDaysAgoStr
    })

    // If action is mark-overdue, update all pending fees that are 30+ days old to "Overdue"
    if (action === 'mark-overdue') {
      const ids = overduePayments.map((p) => p.id)
      if (ids.length > 0) {
        for (const id of ids) {
          await db.feePayment.update({
            where: { id },
            data: { status: 'Overdue' },
          })
        }
      }
      return NextResponse.json({
        success: true,
        markedCount: ids.length,
        message: `${ids.length} payment(s) marked as overdue`,
      })
    }

    // If action is mark-reminded, just return success (simulated reminder)
    if (action === 'send-reminder') {
      const id = req.nextUrl.searchParams.get('paymentId')
      if (id) {
        return NextResponse.json({ success: true, message: 'Reminder sent (simulated)' })
      }
      // Send reminders for all overdue
      return NextResponse.json({
        success: true,
        reminderCount: overduePayments.length,
        message: `Reminders sent for ${overduePayments.length} overdue payment(s) (simulated)`,
      })
    }

    // Default: return list of overdue fees with details
    const overdueList = overduePayments.map((p) => {
      const dateStr = p.paymentDate || p.createdAt.toISOString().split('T')[0]
      const dueDate = new Date(dateStr)
      const now = new Date()
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      return {
        id: p.id,
        studentId: p.studentId,
        studentName: `${p.student.firstName} ${p.student.lastName}`,
        feeType: p.feeType,
        amount: p.amount,
        paymentDate: p.paymentDate,
        daysOverdue,
        status: p.status,
      }
    })

    return NextResponse.json({
      overdueCount: overdueList.length,
      totalOverdueAmount: overdueList.reduce((sum, p) => sum + p.amount, 0),
      overduePayments: overdueList,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch overdue alerts' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { paymentIds, status } = body as { paymentIds: string[]; status: string }

    if (!paymentIds || !status) {
      return NextResponse.json({ error: 'paymentIds and status are required' }, { status: 400 })
    }

    for (const id of paymentIds) {
      await db.feePayment.update({
        where: { id },
        data: { status },
      })
    }

    return NextResponse.json({
      success: true,
      updatedCount: paymentIds.length,
      message: `${paymentIds.length} payment(s) marked as ${status}`,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update payments' }, { status: 500 })
  }
}
