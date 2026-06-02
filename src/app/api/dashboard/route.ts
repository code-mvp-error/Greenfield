import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      feePayments,
      allFeePayments,
      students,
      allAttendance,
    ] = await Promise.all([
      db.student.count(),
      db.teacher.count(),
      db.class.count(),
      db.feePayment.findMany({ where: { status: 'Paid' } }),
      db.feePayment.findMany(),
      db.student.findMany({ select: { gender: true } }),
      db.attendance.findMany(),
    ])

    const totalRevenue = feePayments.reduce((sum, p) => sum + p.amount, 0)

    // Gender distribution
    const maleCount = students.filter((s) => s.gender === 'Male').length
    const femaleCount = students.filter((s) => s.gender === 'Female').length
    const otherCount = students.length - maleCount - femaleCount

    // Weekly attendance - calculate real rates for the last 5 school days (skip weekends)
    const today = new Date()
    const weekDays: Array<{ day: string; rate: number }> = []
    let daysChecked = 0
    let lookback = 0
    while (weekDays.length < 5 && lookback < 14) {
      const d = new Date(today)
      d.setDate(d.getDate() - lookback)
      // Skip weekends
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        const dateStr = d.toISOString().split('T')[0]
        const dayRecords = allAttendance.filter((r) => r.date === dateStr)
        const present = dayRecords.filter((r) => r.status === 'Present').length
        const total = dayRecords.length
        const rate = total > 0 ? Math.round((present / total) * 100) : 0
        if (total > 0) {
          weekDays.unshift({ day: d.toLocaleDateString('en', { weekday: 'short' }), rate })
        }
        daysChecked++
      }
      lookback++
    }

    // Monthly fee data from real payments
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const feeByMonth: Record<string, { collected: number; pending: number }> = {}
    allFeePayments.forEach((p) => {
      if (p.paymentDate) {
        const month = new Date(p.paymentDate).getMonth()
        const key = monthNames[month]
        if (!feeByMonth[key]) feeByMonth[key] = { collected: 0, pending: 0 }
        if (p.status === 'Paid') feeByMonth[key].collected += p.amount
        else feeByMonth[key].pending += p.amount
      }
    })
    const feeData = Object.entries(feeByMonth).map(([month, data]) => ({
      month,
      collected: Math.round(data.collected),
      pending: Math.round(data.pending),
    }))

    // If no fee data, provide empty placeholder
    if (feeData.length === 0) {
      const currentMonth = monthNames[today.getMonth()]
      feeData.push({ month: currentMonth, collected: 0, pending: 0 })
    }

    // Today's attendance summary - if today is a weekend, show last school day
    let attendanceDate = today.toISOString().split('T')[0]
    if (today.getDay() === 0 || today.getDay() === 6) {
      // Find the most recent school day with attendance records
      for (let lb = 1; lb < 7; lb++) {
        const d = new Date(today)
        d.setDate(d.getDate() - lb)
        if (d.getDay() !== 0 && d.getDay() !== 6) {
          const dateStr = d.toISOString().split('T')[0]
          const records = allAttendance.filter((r) => r.date === dateStr)
          if (records.length > 0) {
            attendanceDate = dateStr
            break
          }
        }
      }
    }
    const todayRecords = allAttendance.filter((r) => r.date === attendanceDate)
    const presentToday = todayRecords.filter((r) => r.status === 'Present').length
    const absentToday = todayRecords.filter((r) => r.status === 'Absent').length
    const lateToday = todayRecords.filter((r) => r.status === 'Late').length

    // Fee collection today
    const todayStr = today.toISOString().split('T')[0]
    const todayPayments = allFeePayments.filter((p) => p.paymentDate === todayStr && p.status === 'Paid')
    const feeCollectedToday = todayPayments.reduce((sum, p) => sum + p.amount, 0)

    // Overall attendance rate
    const totalPresent = allAttendance.filter((r) => r.status === 'Present').length
    const attendanceRate = allAttendance.length > 0
      ? Math.round((totalPresent / allAttendance.length) * 100)
      : 0

    // Recent activities combining announcements, new enrollments, and recent payments
    const [recentAnnouncements, recentStudents, recentPayments] = await Promise.all([
      db.announcement.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
      }),
      db.student.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: { id: true, firstName: true, lastName: true, createdAt: true },
      }),
      db.feePayment.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        where: { status: 'Paid' },
        include: { student: { select: { firstName: true, lastName: true } } },
      }),
    ])

    const recentActivities: Array<{ id: string; text: string; time: string; type: string; createdAt: number }> = []

    recentAnnouncements.forEach((a) => {
      recentActivities.push({
        id: `ann-${a.id}`,
        text: `📢 ${a.title}`,
        time: formatTimeAgo(a.createdAt),
        type: 'announcement',
        createdAt: new Date(a.createdAt).getTime(),
      })
    })

    recentStudents.forEach((s) => {
      recentActivities.push({
        id: `stu-${s.id}`,
        text: `${s.firstName} ${s.lastName} enrolled`,
        time: formatTimeAgo(s.createdAt),
        type: 'enrollment',
        createdAt: new Date(s.createdAt).getTime(),
      })
    })

    recentPayments.forEach((p) => {
      recentActivities.push({
        id: `pay-${p.id}`,
        text: `Fee payment from ${p.student.firstName} ${p.student.lastName}`,
        time: formatTimeAgo(p.createdAt),
        type: 'payment',
        createdAt: new Date(p.createdAt).getTime(),
      })
    })

    // Sort by recency (most recent first)
    recentActivities.sort((a, b) => b.createdAt - a.createdAt)
    recentActivities.splice(6) // Keep max 6 activities
    // Remove internal createdAt before sending
    const activitiesForClient = recentActivities.map(({ createdAt: _ct, ...rest }) => rest)

    return NextResponse.json({
      totalStudents,
      totalTeachers,
      totalClasses,
      totalRevenue,
      attendanceRate,
      todayOverview: {
        present: presentToday,
        absent: absentToday,
        late: lateToday,
        feeCollected: Math.round(feeCollectedToday),
      },
      genderData: [
        { name: 'Male', value: maleCount || 0, color: '#059669' },
        { name: 'Female', value: femaleCount || 0, color: '#f59e0b' },
        { name: 'Other', value: otherCount || 0, color: '#8b5cf6' },
      ].filter((d) => d.value > 0),
      recentActivities: activitiesForClient,
      attendanceData: weekDays,
      feeData,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}
