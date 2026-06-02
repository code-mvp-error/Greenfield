import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const student = await db.student.findUnique({
      where: { id },
      include: { class: true },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Get grades with exam info
    const grades = await db.grade.findMany({
      where: { studentId: id },
      include: {
        exam: {
          include: { subject: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Get attendance records
    const attendance = await db.attendance.findMany({
      where: { studentId: id },
      orderBy: { date: 'asc' },
    })

    // Calculate grade progression over time
    const gradeProgression = grades.map((g) => ({
      examId: g.examId,
      examName: g.exam.name || 'Unknown',
      examType: g.exam.type || '',
      subject: g.exam.subject?.name || 'Unknown',
      date: g.exam.date || '',
      marksObtained: g.marksObtained,
      totalMarks: g.exam.totalMarks,
      grade: g.grade,
      percentage: g.exam.totalMarks > 0 ? Math.round((g.marksObtained / g.exam.totalMarks) * 100) : 0,
    }))

    // Attendance trend by month
    const attendanceByMonth: Record<string, { present: number; absent: number; late: number; total: number }> = {}
    attendance.forEach((a) => {
      const monthKey = a.date.slice(0, 7) // YYYY-MM
      if (!attendanceByMonth[monthKey]) {
        attendanceByMonth[monthKey] = { present: 0, absent: 0, late: 0, total: 0 }
      }
      attendanceByMonth[monthKey].total++
      if (a.status === 'Present') attendanceByMonth[monthKey].present++
      else if (a.status === 'Absent') attendanceByMonth[monthKey].absent++
      else if (a.status === 'Late') attendanceByMonth[monthKey].late++
    })

    const attendanceTrend = Object.entries(attendanceByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        rate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
        ...data,
      }))

    // Academic performance summary
    const allMarks = grades.map((g) => g.marksObtained)
    const allPercentages = gradeProgression.map((g) => g.percentage)

    const performanceSummary = {
      averageScore: allMarks.length > 0 ? Math.round(allMarks.reduce((s, m) => s + m, 0) / allMarks.length) : 0,
      averagePercentage: allPercentages.length > 0 ? Math.round(allPercentages.reduce((s, p) => s + p, 0) / allPercentages.length) : 0,
      highestScore: allMarks.length > 0 ? Math.max(...allMarks) : 0,
      lowestScore: allMarks.length > 0 ? Math.min(...allMarks) : 0,
      totalExams: grades.length,
      gradeDistribution: {
        A: grades.filter((g) => g.grade === 'A' || g.grade === 'A+').length,
        B: grades.filter((g) => g.grade === 'B' || g.grade === 'B+').length,
        C: grades.filter((g) => g.grade === 'C' || g.grade === 'C+').length,
        D: grades.filter((g) => g.grade === 'D').length,
        F: grades.filter((g) => g.grade === 'F').length,
      },
    }

    // Attendance summary
    const attendanceSummary = {
      totalDays: attendance.length,
      present: attendance.filter((a) => a.status === 'Present').length,
      absent: attendance.filter((a) => a.status === 'Absent').length,
      late: attendance.filter((a) => a.status === 'Late').length,
      rate: attendance.length > 0 ? Math.round((attendance.filter((a) => a.status === 'Present').length / attendance.length) * 100) : 0,
    }

    return NextResponse.json({
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        class: student.class,
      },
      gradeProgression,
      attendanceTrend,
      performanceSummary,
      attendanceSummary,
      examResults: gradeProgression,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch student history' }, { status: 500 })
  }
}
