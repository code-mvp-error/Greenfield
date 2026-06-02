'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle2, XCircle, Clock, Save, ClipboardCheck, Users, TrendingUp, BarChart3, UserX, Hash, Download, CalendarDays, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { exportToCSV } from '@/lib/export'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useTranslation } from '@/lib/i18n'

interface Student { id: string; firstName: string; lastName: string; classId: string | null }
interface ClassItem { id: string; name: string; section: string }
interface Staff { id: string; firstName: string; lastName: string; role: string }
interface Teacher { id: string; firstName: string; lastName: string; specialization: string }
interface AttendanceRecord { studentId: string; classId: string; date: string; status: string; remarks: string }
interface StaffAttendanceRecord { teacherId?: string; staffId?: string; date: string; status: string; remarks: string }

interface AttendanceStatsRecord {
  id: string
  studentId: string
  student: { firstName: string; lastName: string }
  classId: string
  date: string
  status: string
  remarks: string
}

export function AttendanceTracking() {
  const { toast } = useToast()
  const { t } = useTranslation()
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)

  // Student attendance
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: string; remarks: string }>>({})
  const [saving, setSaving] = useState(false)

  // Staff attendance
  const [staffDate, setStaffDate] = useState(new Date().toISOString().split('T')[0])
  const [staffAttendanceMap, setStaffAttendanceMap] = useState<Record<string, { status: string; remarks: string }>>({})
  const [staffSaving, setStaffSaving] = useState(false)

  // Report - now with date range
  const [reportStartDate, setReportStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString().split('T')[0]
  })
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0])
  const [reportClass, setReportClass] = useState('')
  const [reportData, setReportData] = useState<Array<{ studentId: string; studentName: string; status: string; date: string }>>([])
  const [reportLoading, setReportLoading] = useState(false)
  const [reportGenerated, setReportGenerated] = useState(false)

  // Attendance statistics
  const [allAttendanceRecords, setAllAttendanceRecords] = useState<AttendanceStatsRecord[]>([])
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const [sRes, cRes, tRes, stRes] = await Promise.all([
        fetch('/api/students'), fetch('/api/classes'), fetch('/api/teachers'), fetch('/api/staff'),
      ])
      if (sRes.ok) setStudents(await sRes.json())
      if (cRes.ok) { const c = await cRes.json(); setClasses(c); if (c.length > 0) setSelectedClass(c[0].id) }
      if (tRes.ok) setTeachers(await tRes.json())
      if (stRes.ok) setStaffList(await stRes.json())
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  // Fetch all attendance records for stats
  useEffect(() => {
    async function fetchAttendanceStats() {
      try {
        setStatsLoading(true)
        const res = await fetch('/api/attendance')
        if (res.ok) {
          const data = await res.json()
          setAllAttendanceRecords(data)
        }
      } catch { /* ignore */ } finally { setStatsLoading(false) }
    }
    fetchAttendanceStats()
  }, [])

  // Calculate attendance statistics from loaded data
  const attendanceStats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0]

    // Today's records
    const todayRecords = allAttendanceRecords.filter((r) => r.date === todayStr)
    const todayPresent = todayRecords.filter((r) => r.status === 'Present').length
    const todayTotal = todayRecords.length
    const todayRate = todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 100) : 0

    // This week's records (last 7 days)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoStr = weekAgo.toISOString().split('T')[0]
    const weekRecords = allAttendanceRecords.filter((r) => r.date >= weekAgoStr)
    const weekPresent = weekRecords.filter((r) => r.status === 'Present').length
    const weekRate = weekRecords.length > 0 ? Math.round((weekPresent / weekRecords.length) * 100) : 0

    // Most absent student
    const absentCounts: Record<string, { name: string; count: number }> = {}
    allAttendanceRecords.forEach((r) => {
      if (r.status === 'Absent') {
        const name = `${r.student.firstName} ${r.student.lastName}`
        if (!absentCounts[r.studentId]) {
          absentCounts[r.studentId] = { name, count: 0 }
        }
        absentCounts[r.studentId].count++
      }
    })
    const mostAbsent = Object.values(absentCounts).sort((a, b) => b.count - a.count)[0]

    return {
      todayRate,
      weekRate,
      mostAbsent: mostAbsent ? `${mostAbsent.name} (${mostAbsent.count})` : 'N/A',
      totalRecords: allAttendanceRecords.length,
    }
  }, [allAttendanceRecords])

  // Report date range summary stats
  const reportSummary = useMemo(() => {
    if (reportData.length === 0) return { totalPresent: 0, totalAbsent: 0, totalLate: 0, attendanceRate: 0 }
    const totalPresent = reportData.filter((r) => r.status === 'Present').length
    const totalAbsent = reportData.filter((r) => r.status === 'Absent').length
    const totalLate = reportData.filter((r) => r.status === 'Late').length
    const attendanceRate = Math.round((totalPresent / reportData.length) * 100)
    return { totalPresent, totalAbsent, totalLate, attendanceRate }
  }, [reportData])

  // Chart data: attendance rate per day in the selected range
  const chartData = useMemo(() => {
    if (reportData.length === 0) return []
    const grouped: Record<string, { present: number; absent: number; late: number; total: number }> = {}
    reportData.forEach((r) => {
      if (!grouped[r.date]) grouped[r.date] = { present: 0, absent: 0, late: 0, total: 0 }
      grouped[r.date].total++
      if (r.status === 'Present') grouped[r.date].present++
      else if (r.status === 'Absent') grouped[r.date].absent++
      else if (r.status === 'Late') grouped[r.date].late++
    })
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date: date.slice(5), // Show MM-DD
        [t('attendance.present')]: Math.round((data.present / data.total) * 100),
        [t('attendance.absent')]: Math.round((data.absent / data.total) * 100),
        [t('attendance.late')]: Math.round((data.late / data.total) * 100),
      }))
  }, [reportData, t])

  const classStudents = students.filter((s) => s.classId === selectedClass)

  useEffect(() => {
    // Initialize attendance map when class changes
    const map: Record<string, { status: string; remarks: string }> = {}
    classStudents.forEach((s) => { map[s.id] = { status: 'Present', remarks: '' } })
    setAttendanceMap(map)
  }, [selectedClass, students])

  useEffect(() => {
    const map: Record<string, { status: string; remarks: string }> = {}
    ;[...teachers, ...staffList].forEach((p) => { map[p.id] = { status: 'Present', remarks: '' } })
    setStaffAttendanceMap(map)
  }, [teachers, staffList])

  function markAllPresent() {
    const map: Record<string, { status: string; remarks: string }> = {}
    classStudents.forEach((s) => { map[s.id] = { status: 'Present', remarks: '' } })
    setAttendanceMap(map)
  }

  function markAllAbsent() {
    const map: Record<string, { status: string; remarks: string }> = {}
    classStudents.forEach((s) => { map[s.id] = { status: 'Absent', remarks: '' } })
    setAttendanceMap(map)
  }

  function setStudentStatus(studentId: string, status: string) {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }))
  }

  async function saveStudentAttendance() {
    if (!selectedClass || !selectedDate) {
      toast({ title: t('common.error'), description: t('attendance.selectClass'), variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const records: AttendanceRecord[] = classStudents.map((s) => ({
        studentId: s.id, classId: selectedClass, date: selectedDate,
        status: attendanceMap[s.id]?.status || 'Present',
        remarks: attendanceMap[s.id]?.remarks || '',
      }))
      const res = await fetch('/api/attendance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      })
      if (res.ok) {
        toast({ title: t('common.success'), description: t('attendance.attendanceSaved') })
        // Refresh stats after saving
        const statsRes = await fetch('/api/attendance')
        if (statsRes.ok) {
          const data = await statsRes.json()
          setAllAttendanceRecords(data)
        }
      } else {
        toast({ title: t('common.error'), description: t('attendance.failedToSave'), variant: 'destructive' })
      }
    } catch {
      toast({ title: t('common.error'), description: t('common.networkError'), variant: 'destructive' })
    } finally { setSaving(false) }
  }

  async function saveStaffAttendance() {
    if (!staffDate) {
      toast({ title: t('common.error'), description: t('attendance.selectDate'), variant: 'destructive' })
      return
    }
    setStaffSaving(true)
    try {
      const records: StaffAttendanceRecord[] = [
        ...teachers.map((t2) => ({ teacherId: t2.id, date: staffDate, status: staffAttendanceMap[t2.id]?.status || 'Present', remarks: staffAttendanceMap[t2.id]?.remarks || '' })),
        ...staffList.map((s) => ({ staffId: s.id, date: staffDate, status: staffAttendanceMap[s.id]?.status || 'Present', remarks: staffAttendanceMap[s.id]?.remarks || '' })),
      ]
      const res = await fetch('/api/staff-attendance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      })
      if (res.ok) {
        toast({ title: t('common.success'), description: t('attendance.attendanceSaved') })
      } else {
        toast({ title: t('common.error'), description: t('attendance.failedToSave'), variant: 'destructive' })
      }
    } catch {
      toast({ title: t('common.error'), description: t('common.networkError'), variant: 'destructive' })
    } finally { setStaffSaving(false) }
  }

  async function fetchReport() {
    if (!reportClass) {
      toast({ title: t('attendance.selectClass'), description: t('attendance.selectClass'), variant: 'destructive' })
      return
    }
    if (!reportStartDate || !reportEndDate) {
      toast({ title: t('attendance.selectDate'), description: t('attendance.selectDate'), variant: 'destructive' })
      return
    }
    if (reportStartDate > reportEndDate) {
      toast({ title: t('common.error'), description: t('attendance.selectDate'), variant: 'destructive' })
      return
    }
    setReportLoading(true)
    setReportGenerated(true)
    try {
      const res = await fetch(`/api/attendance?date=${reportStartDate}&classId=${reportClass}`)
      if (res.ok) {
        const data = await res.json()
        // Fetch attendance for the entire date range
        const allDates: AttendanceStatsRecord[] = []
        // We need to fetch for the class across the range
        // The API filters by date, so we'll fetch all for the class and then filter client-side
        const resAll = await fetch(`/api/attendance?classId=${reportClass}`)
        if (resAll.ok) {
          const allData: AttendanceStatsRecord[] = await resAll.json()
          const filtered = allData.filter((r) => r.date >= reportStartDate && r.date <= reportEndDate)
          const mapped = filtered.map((r) => ({
            studentId: r.studentId,
            studentName: `${r.student.firstName} ${r.student.lastName}`,
            status: r.status,
            date: r.date,
          }))
          setReportData(mapped)
          if (mapped.length === 0) {
            toast({ title: t('attendance.noAttendanceRecorded'), description: t('attendance.noAttendanceRecorded'), variant: 'destructive' })
          } else {
            const present = mapped.filter((r) => r.status === 'Present').length
            toast({ title: t('common.success'), description: `${mapped.length} records. ${present} ${t('attendance.present').toLowerCase()}, ${mapped.length - present} ${t('attendance.absent').toLowerCase()}/${t('attendance.late').toLowerCase()}` })
          }
        }
      }
    } catch {
      toast({ title: t('common.error'), description: t('attendance.failedToSave'), variant: 'destructive' })
    } finally {
      setReportLoading(false)
    }
  }

  const statusIcon: Record<string, React.ReactNode> = {
    Present: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
    Absent: <XCircle className="w-4 h-4 text-red-500" />,
    Late: <Clock className="w-4 h-4 text-amber-500" />,
  }

  const statusBg: Record<string, string> = {
    Present: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Absent: 'bg-red-50 text-red-700 border-red-200',
    Late: 'bg-amber-50 text-amber-700 border-amber-200',
  }

  // Helper to translate status for display
  const translateStatus = (status: string) => {
    if (status === 'Present') return t('attendance.present')
    if (status === 'Absent') return t('attendance.absent')
    if (status === 'Late') return t('attendance.late')
    if (status === 'On Leave') return t('attendance.onLeave')
    return status
  }

  // Stats cards for the attendance overview
  const statsCards = [
    { title: t('dashboard.attendanceRate'), value: `${attendanceStats.todayRate}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100' },
    { title: t('dashboard.attendanceRate'), value: `${attendanceStats.weekRate}%`, icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50', iconBg: 'bg-amber-100' },
    { title: t('attendance.absent'), value: attendanceStats.mostAbsent, icon: UserX, color: 'text-red-500', bg: 'bg-red-50', iconBg: 'bg-red-100' },
    { title: t('common.total'), value: attendanceStats.totalRecords.toString(), icon: Hash, color: 'text-violet-600', bg: 'bg-violet-50', iconBg: 'bg-violet-100' },
  ]

  if (loading) return <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <ClipboardCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{t('attendance.title')}</h2>
            <p className="text-muted-foreground text-sm">{t('attendance.subtitle')}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => exportToCSV(allAttendanceRecords.map((r) => ({ Student: `${r.student.firstName} ${r.student.lastName}`, Date: r.date, Status: r.status, Remarks: r.remarks || '' })), 'attendance-report')} disabled={allAttendanceRecords.length === 0}>
          <Download className="w-4 h-4 mr-2" /> {t('common.export')}
        </Button>
      </div>

      <Tabs defaultValue="student">
        <TabsList>
          <TabsTrigger value="student"><ClipboardCheck className="w-4 h-4 mr-2" />{t('attendance.studentAttendance')}</TabsTrigger>
          <TabsTrigger value="staff"><Users className="w-4 h-4 mr-2" />{t('attendance.staffAttendance')}</TabsTrigger>
          <TabsTrigger value="report">{t('attendance.markAttendance')}</TabsTrigger>
        </TabsList>

        {/* Student Attendance */}
        <TabsContent value="student" className="space-y-4">
          {/* Attendance Overview Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statsLoading ? (
              [...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse border border-border/50 shadow-card">
                  <CardContent className="p-4">
                    <div className="h-14 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))
            ) : (
              statsCards.map((card) => {
                const Icon = card.icon
                return (
                  <Card key={card.title + card.value} className="group hover:shadow-md transition-all duration-200 border border-border/50 shadow-card rounded-xl">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 p-2.5 rounded-xl ${card.iconBg} group-hover:scale-110 transition-transform duration-200`}>
                          <Icon className={`w-6 h-6 ${card.color}`} />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{card.title}</p>
                          <p className="text-lg font-bold truncate max-w-[140px]" title={String(card.value)}>{card.value}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>

          <Card className="border border-border/50 shadow-card">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="space-y-2 flex-1">
                  <Label>{t('common.date')}</Label>
                  <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                </div>
                <div className="space-y-2 flex-1">
                  <Label>{t('attendance.selectClass')}</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger><SelectValue placeholder={t('attendance.selectClass')} /></SelectTrigger>
                    <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} - {c.section}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={markAllPresent} className="text-emerald-600">{t('attendance.present')}</Button>
                  <Button variant="outline" size="sm" onClick={markAllAbsent} className="text-red-500">{t('attendance.absent')}</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50 shadow-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b-2 border-border sticky top-0 z-10">
                    <TableHead className="py-3 px-4 font-bold uppercase text-xs tracking-wider">{t('common.name')}</TableHead>
                    <TableHead className="py-3 px-4 text-center font-bold uppercase text-xs tracking-wider">{t('attendance.present')}</TableHead>
                    <TableHead className="py-3 px-4 text-center font-bold uppercase text-xs tracking-wider">{t('attendance.absent')}</TableHead>
                    <TableHead className="py-3 px-4 text-center font-bold uppercase text-xs tracking-wider">{t('attendance.late')}</TableHead>
                    <TableHead className="py-3 px-4 font-bold uppercase text-xs tracking-wider">{t('common.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classStudents.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t('attendance.noStudentsInClass')}</TableCell></TableRow>
                  ) : classStudents.map((s, idx) => {
                    const status = attendanceMap[s.id]?.status || 'Present'
                    return (
                      <TableRow key={s.id} className={`hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors duration-150 ${idx % 2 === 0 ? '' : 'bg-muted/20 dark:bg-muted/10'}`}>
                        <TableCell className="font-medium py-3 px-4">{s.firstName} {s.lastName}</TableCell>
                        <TableCell className="text-center">
                          <Button variant={status === 'Present' ? 'default' : 'outline'} size="sm"
                            className={status === 'Present' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                            onClick={() => setStudentStatus(s.id, 'Present')}>
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant={status === 'Absent' ? 'default' : 'outline'} size="sm"
                            className={status === 'Absent' ? 'bg-red-500 hover:bg-red-600' : ''}
                            onClick={() => setStudentStatus(s.id, 'Absent')}>
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant={status === 'Late' ? 'default' : 'outline'} size="sm"
                            className={status === 'Late' ? 'bg-amber-500 hover:bg-amber-600' : ''}
                            onClick={() => setStudentStatus(s.id, 'Late')}>
                            <Clock className="w-4 h-4" />
                          </Button>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <Badge className={`rounded-full px-2.5 py-0.5 font-medium text-xs ${statusBg[status]}`}>{translateStatus(status)}</Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={saveStudentAttendance} disabled={saving} className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-md shadow-emerald-500/20 gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? t('common.saving') : t('attendance.saveAttendance')}
            </Button>
          </div>
        </TabsContent>

        {/* Staff Attendance */}
        <TabsContent value="staff" className="space-y-4">
          <Card className="border border-border/50 shadow-card">
            <CardContent className="p-4">
              <div className="flex gap-3 items-end">
                <div className="space-y-2">
                  <Label>{t('common.date')}</Label>
                  <Input type="date" value={staffDate} onChange={(e) => setStaffDate(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50 shadow-card">
            <CardHeader><CardTitle className="text-lg">{t('sidebar.teachers')}</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-muted/50 border-b-2 border-border"><TableHead className="py-3 px-4">{t('common.name')}</TableHead><TableHead className="py-3 px-4">{t('teachers.specialization')}</TableHead><TableHead className="py-3 px-4 text-center">{t('attendance.present')}</TableHead><TableHead className="py-3 px-4 text-center">{t('attendance.absent')}</TableHead><TableHead className="py-3 px-4 text-center">{t('attendance.onLeave')}</TableHead><TableHead className="py-3 px-4">{t('common.status')}</TableHead></TableRow></TableHeader>
                <TableBody>
                  {teachers.map((te, idx) => {
                    const status = staffAttendanceMap[te.id]?.status || 'Present'
                    return (
                      <TableRow key={te.id} className={`hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors duration-150 ${idx % 2 === 0 ? '' : 'bg-muted/20 dark:bg-muted/10'}`}>
                        <TableCell className="font-medium py-3 px-4">{te.firstName} {te.lastName}</TableCell>
                        <TableCell className="py-3 px-4">{te.specialization}</TableCell>
                        <TableCell className="text-center"><Button variant={status === 'Present' ? 'default' : 'outline'} size="sm" className={status === 'Present' ? 'bg-emerald-600 hover:bg-emerald-700' : ''} onClick={() => setStaffAttendanceMap((p) => ({ ...p, [te.id]: { status: 'Present', remarks: '' } }))}><CheckCircle2 className="w-4 h-4" /></Button></TableCell>
                        <TableCell className="text-center"><Button variant={status === 'Absent' ? 'default' : 'outline'} size="sm" className={status === 'Absent' ? 'bg-red-500 hover:bg-red-600' : ''} onClick={() => setStaffAttendanceMap((p) => ({ ...p, [te.id]: { status: 'Absent', remarks: '' } }))}><XCircle className="w-4 h-4" /></Button></TableCell>
                        <TableCell className="text-center"><Button variant={status === 'On Leave' ? 'default' : 'outline'} size="sm" className={status === 'On Leave' ? 'bg-amber-500 hover:bg-amber-600' : ''} onClick={() => setStaffAttendanceMap((p) => ({ ...p, [te.id]: { status: 'On Leave', remarks: '' } }))}><Clock className="w-4 h-4" /></Button></TableCell>
                        <TableCell className="py-3 px-4"><Badge className={`rounded-full px-2.5 py-0.5 font-medium text-xs ${statusBg[status] || 'bg-amber-50 text-amber-700 border-amber-200'}`}>{translateStatus(status)}</Badge></TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border border-border/50 shadow-card">
            <CardHeader><CardTitle className="text-lg">{t('sidebar.staff')}</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-muted/50 border-b-2 border-border"><TableHead className="py-3 px-4">{t('common.name')}</TableHead><TableHead className="py-3 px-4">{t('staff.role')}</TableHead><TableHead className="py-3 px-4 text-center">{t('attendance.present')}</TableHead><TableHead className="py-3 px-4 text-center">{t('attendance.absent')}</TableHead><TableHead className="py-3 px-4 text-center">{t('attendance.onLeave')}</TableHead><TableHead className="py-3 px-4">{t('common.status')}</TableHead></TableRow></TableHeader>
                <TableBody>
                  {staffList.map((s, idx) => {
                    const status = staffAttendanceMap[s.id]?.status || 'Present'
                    return (
                      <TableRow key={s.id} className={`hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors duration-150 ${idx % 2 === 0 ? '' : 'bg-muted/20 dark:bg-muted/10'}`}>
                        <TableCell className="font-medium py-3 px-4">{s.firstName} {s.lastName}</TableCell>
                        <TableCell className="py-3 px-4">{s.role}</TableCell>
                        <TableCell className="text-center"><Button variant={status === 'Present' ? 'default' : 'outline'} size="sm" className={status === 'Present' ? 'bg-emerald-600 hover:bg-emerald-700' : ''} onClick={() => setStaffAttendanceMap((p) => ({ ...p, [s.id]: { status: 'Present', remarks: '' } }))}><CheckCircle2 className="w-4 h-4" /></Button></TableCell>
                        <TableCell className="text-center"><Button variant={status === 'Absent' ? 'default' : 'outline'} size="sm" className={status === 'Absent' ? 'bg-red-500 hover:bg-red-600' : ''} onClick={() => setStaffAttendanceMap((p) => ({ ...p, [s.id]: { status: 'Absent', remarks: '' } }))}><XCircle className="w-4 h-4" /></Button></TableCell>
                        <TableCell className="text-center"><Button variant={status === 'On Leave' ? 'default' : 'outline'} size="sm" className={status === 'On Leave' ? 'bg-amber-500 hover:bg-amber-600' : ''} onClick={() => setStaffAttendanceMap((p) => ({ ...p, [s.id]: { status: 'On Leave', remarks: '' } }))}><Clock className="w-4 h-4" /></Button></TableCell>
                        <TableCell className="py-3 px-4"><Badge className={`rounded-full px-2.5 py-0.5 font-medium text-xs ${statusBg[status] || 'bg-amber-50 text-amber-700 border-amber-200'}`}>{translateStatus(status)}</Badge></TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={saveStaffAttendance} disabled={staffSaving} className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-md shadow-emerald-500/20 gap-2">
              {staffSaving && <Loader2 className="w-4 h-4 animate-spin" />}{staffSaving ? t('common.saving') : t('attendance.saveAttendance')}
            </Button>
          </div>
        </TabsContent>

        {/* Attendance Report - Enhanced with Date Range */}
        <TabsContent value="report" className="space-y-4">
          <Card className="border border-border/50 shadow-card">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {t('attendance.selectDate')}</Label>
                  <Input type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} className="w-full sm:w-auto" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {t('attendance.selectDate')}</Label>
                  <Input type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} className="w-full sm:w-auto" />
                </div>
                <div className="space-y-2">
                  <Label>{t('attendance.selectClass')} *</Label>
                  <Select value={reportClass} onValueChange={setReportClass}>
                    <SelectTrigger className="w-full sm:w-auto"><SelectValue placeholder={t('attendance.selectClass')} /></SelectTrigger>
                    <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} - {c.section}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button onClick={fetchReport} disabled={reportLoading} className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-md shadow-emerald-500/20 whitespace-nowrap">{reportLoading ? t('common.loading') : t('attendance.markAttendance')}</Button>
              </div>
            </CardContent>
          </Card>

          {/* Date Range Summary Stats */}
          {reportGenerated && reportData.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border border-border/50 shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('attendance.totalPresent')}</p>
                      <p className="text-lg font-bold text-emerald-600">{reportSummary.totalPresent}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-border/50 shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-50">
                      <XCircle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('attendance.totalAbsent')}</p>
                      <p className="text-lg font-bold text-red-500">{reportSummary.totalAbsent}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-border/50 shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-50">
                      <Clock className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('attendance.totalLate')}</p>
                      <p className="text-lg font-bold text-amber-500">{reportSummary.totalLate}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-border/50 shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('attendance.attendanceRate')}</p>
                      <p className="text-lg font-bold text-emerald-600">{reportSummary.attendanceRate}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Attendance Rate Chart */}
          {reportGenerated && chartData.length > 0 && (
            <Card className="border border-border/50 shadow-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  {t('dashboard.attendanceRate')}
                </CardTitle>
                <CardDescription>{t('dashboard.attendanceDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                      <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" unit="%" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--popover)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value: number) => [`${value}%`]}
                      />
                      <Legend />
                      <Bar dataKey={t('attendance.present')} fill="#059669" radius={[2, 2, 0, 0]} />
                      <Bar dataKey={t('attendance.late')} fill="#d97706" radius={[2, 2, 0, 0]} />
                      <Bar dataKey={t('attendance.absent')} fill="#dc2626" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {reportGenerated && reportData.length === 0 && !reportLoading && (
            <Card className="border border-border/50 shadow-card">
              <CardContent className="py-12">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                    <ClipboardCheck className="w-6 h-6 text-amber-500" />
                  </div>
                  <p className="text-muted-foreground text-sm">{t('attendance.noAttendanceRecorded')}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {reportData.length > 0 && (
            <Card className="border border-border/50 shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">{t('attendance.markAttendance')}</CardTitle>
                <CardDescription>
                  {reportStartDate} to {reportEndDate} — {reportData.length} total records
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow className="bg-muted/50 border-b-2 border-border"><TableHead className="py-3 px-4">{t('common.date')}</TableHead><TableHead className="py-3 px-4">{t('attendance.studentAttendance')}</TableHead><TableHead className="py-3 px-4">{t('common.status')}</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {reportData.map((r, idx) => (
                      <TableRow key={`${r.studentId}-${r.date}-${idx}`} className={`hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors duration-150 ${idx % 2 === 0 ? '' : 'bg-muted/20 dark:bg-muted/10'}`}>
                        <TableCell className="py-3 px-4 text-muted-foreground text-sm">{r.date}</TableCell>
                        <TableCell className="font-medium py-3 px-4">{r.studentName}</TableCell>
                        <TableCell className="py-3 px-4"><Badge className={`rounded-full px-2.5 py-0.5 font-medium text-xs ${statusBg[r.status] || ''}`}>{translateStatus(r.status)}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
