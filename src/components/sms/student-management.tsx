'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Plus, Pencil, Trash2, Eye, Users, GraduationCap, Calendar, UserCheck, UserPlus, Download, FileX2, X, CheckCircle2, TrendingUp, BarChart3, Funnel, Mail, Phone, MapPin, User, RotateCcw, Loader2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Pagination } from '@/components/sms/pagination'
import { exportToCSV } from '@/lib/export'
import { useSMSStore } from '@/lib/store'
import { StudentFormSchema, validateForm } from '@/lib/validations'
import type { FormErrors } from '@/lib/validations'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer } from 'recharts'
import { useTranslation } from '@/lib/i18n'

interface Student {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  address: string
  phone: string
  email: string
  guardianName: string
  guardianPhone: string
  enrollmentDate: string
  status: string
  classId: string | null
  class?: { id: string; name: string; section: string }
}

interface Class {
  id: string
  name: string
  section: string
  grade: string
}

interface AttendanceRecord {
  id: string
  date: string
  status: string
  remarks: string
  class?: { id: string; name: string; section: string }
}

interface GradeRecord {
  id: string
  marksObtained: number
  grade: string
  remarks: string
  exam?: { id: string; name: string; type: string; totalMarks: number; subject?: { id: string; name: string; code: string } }
}

const emptyStudent: Omit<Student, 'id' | 'class'> = {
  firstName: '', lastName: '', dateOfBirth: '', gender: 'Male',
  address: '', phone: '', email: '', guardianName: '', guardianPhone: '',
  enrollmentDate: new Date().toISOString().split('T')[0], status: 'Active', classId: '',
}

const ITEMS_PER_PAGE = 10

export function StudentManagement() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterClass, setFilterClass] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<Student | null>(null)
  const [form, setForm] = useState(emptyStudent)
  const [isEdit, setIsEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<FormErrors>({})
  const [currentPage, setCurrentPage] = useState(1)

  // Batch operations state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false)
  const [batchStatusOpen, setBatchStatusOpen] = useState(false)
  const [batchStatus, setBatchStatus] = useState('Active')
  const [batchLoading, setBatchLoading] = useState(false)

  // Check for openAddDialog from store (quick action)
  const { openAddDialog, setOpenAddDialog } = useSMSStore()
  useEffect(() => {
    if (openAddDialog === 'students') {
      openAdd()
      setOpenAddDialog('')
    }
  }, [openAddDialog])

  // Student profile data
  const [studentAttendance, setStudentAttendance] = useState<AttendanceRecord[]>([])
  const [studentGrades, setStudentGrades] = useState<GradeRecord[]>([])
  const [profileLoading, setProfileLoading] = useState(false)
  const [academicHistory, setAcademicHistory] = useState<{
    gradeProgression: Array<{ examId: string; examName: string; examType: string; subject: string; date: string; marksObtained: number; totalMarks: number; grade: string; percentage: number }>
    attendanceTrend: Array<{ month: string; rate: number; present: number; absent: number; late: number; total: number }>
    performanceSummary: { averageScore: number; averagePercentage: number; highestScore: number; lowestScore: number; totalExams: number; gradeDistribution: Record<string, number> }
    attendanceSummary: { totalDays: number; present: number; absent: number; late: number; rate: number }
  } | null>(null)
  const [profileTab, setProfileTab] = useState('profile')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [sRes, cRes] = await Promise.all([fetch('/api/students'), fetch('/api/classes')])
      if (sRes.ok) setStudents(await sRes.json())
      if (cRes.ok) setClasses(await cRes.json())
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  const fetchStudentProfileData = useCallback(async (studentId: string) => {
    setProfileLoading(true)
    setProfileTab('profile')
    try {
      const [aRes, gRes, hRes] = await Promise.all([
        fetch(`/api/attendance?studentId=${studentId}`),
        fetch(`/api/grades?studentId=${studentId}`),
        fetch(`/api/students/${studentId}/history`),
      ])
      if (aRes.ok) setStudentAttendance(await aRes.json())
      if (gRes.ok) setStudentGrades(await gRes.json())
      if (hRes.ok) setAcademicHistory(await hRes.json())
    } catch { /* ignore */ }
    finally { setProfileLoading(false) }
  }, [])

  const filtered = students.filter((s) => {
    const name = `${s.firstName} ${s.lastName}`.toLowerCase()
    const matchSearch = !search || name.includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())
    const matchClass = filterClass === 'all' || s.classId === filterClass
    const matchStatus = filterStatus === 'all' || s.status === filterStatus
    return matchSearch && matchClass && matchStatus
  })

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterClass, filterStatus])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginatedStudents = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  // Summary stats
  const totalStudents = students.length
  const activeStudents = students.filter((s) => s.status === 'Active').length
  const maleCount = students.filter((s) => s.gender === 'Male').length
  const femaleCount = students.filter((s) => s.gender === 'Female').length
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const newThisMonth = students.filter((s) => s.enrollmentDate && s.enrollmentDate.startsWith(currentMonth)).length

  // Batch operations helpers
  const allOnPageSelected = paginatedStudents.length > 0 && paginatedStudents.every((s) => selectedIds.has(s.id))
  const someOnPageSelected = paginatedStudents.some((s) => selectedIds.has(s.id)) && !allOnPageSelected

  function toggleSelectAll() {
    if (allOnPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        paginatedStudents.forEach((s) => next.delete(s.id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        paginatedStudents.forEach((s) => next.add(s.id))
        return next
      })
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  async function handleBatchDelete() {
    setBatchLoading(true)
    try {
      const ids = Array.from(selectedIds)
      const results = await Promise.allSettled(
        ids.map((id) => fetch(`/api/students?id=${id}`, { method: 'DELETE' }))
      )
      const succeeded = results.filter((r) => r.status === 'fulfilled').length
      const failed = results.filter((r) => r.status === 'rejected').length
      toast({
        title: t('students.batchDeleteComplete'),
        description: `${succeeded} student${succeeded !== 1 ? 's' : ''} deleted${failed > 0 ? `. ${failed} failed.` : '.'}`,
        variant: failed > 0 ? 'destructive' : 'default',
      })
      setSelectedIds(new Set())
      setBatchDeleteOpen(false)
      fetchData()
    } catch {
      toast({ title: t('common.error'), description: t('students.batchDeleteFailed'), variant: 'destructive' })
    } finally { setBatchLoading(false) }
  }

  async function handleBatchStatusChange() {
    setBatchLoading(true)
    try {
      const ids = Array.from(selectedIds)
      const results = await Promise.allSettled(
        ids.map((id) => fetch(`/api/students?id=${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: batchStatus }),
        }))
      )
      const succeeded = results.filter((r) => r.status === 'fulfilled').length
      toast({
        title: t('students.statusUpdated'),
        description: `${succeeded} student${succeeded !== 1 ? 's' : ''} updated to ${batchStatus}`,
      })
      setSelectedIds(new Set())
      setBatchStatusOpen(false)
      fetchData()
    } catch {
      toast({ title: t('common.error'), description: t('students.batchStatusFailed'), variant: 'destructive' })
    } finally { setBatchLoading(false) }
  }

  function openAdd() {
    setForm(emptyStudent)
    setIsEdit(false)
    setValidationErrors({})
    setDialogOpen(true)
  }

  function openEdit(s: Student) {
    setForm({
      firstName: s.firstName, lastName: s.lastName, dateOfBirth: s.dateOfBirth,
      gender: s.gender, address: s.address, phone: s.phone, email: s.email,
      guardianName: s.guardianName, guardianPhone: s.guardianPhone,
      enrollmentDate: s.enrollmentDate, status: s.status, classId: s.classId || '',
    })
    setSelected(s)
    setIsEdit(true)
    setDialogOpen(true)
  }

  function openView(s: Student) {
    setSelected(s)
    setViewOpen(true)
    fetchStudentProfileData(s.id)
  }

  function openDelete(s: Student) {
    setSelected(s)
    setDeleteOpen(true)
  }

  async function handleSave() {
    const result = validateForm(StudentFormSchema, form)
    if (!result.success) {
      setValidationErrors(result.errors)
      const errorCount = Object.keys(result.errors).length
      toast({ title: t('common.validationError'), description: `${errorCount} ${t('common.fieldsNeedAttention')}`, variant: 'destructive' })
      return
    }
    setValidationErrors({})
    setSaving(true)
    try {
      const body = { ...form, classId: form.classId || null }
      const res = isEdit
        ? await fetch(`/api/students?id=${selected?.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch('/api/students', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        toast({ title: t('common.success'), description: isEdit ? t('students.studentUpdated') : t('students.studentCreated') })
        setDialogOpen(false)
        fetchData()
      } else {
        toast({ title: t('common.error'), description: t('students.failedToSaveStudent'), variant: 'destructive' })
      }
    } catch {
      toast({ title: t('common.error'), description: t('common.networkError'), variant: 'destructive' })
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/students?id=${selected?.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: t('common.success'), description: t('students.studentDeleted') })
        setDeleteOpen(false)
        fetchData()
      }
    } catch { /* ignore */ }
  }

  const statusColor: Record<string, string> = {
    Active: 'bg-emerald-100 text-emerald-700 before:bg-emerald-500',
    Transferred: 'bg-amber-100 text-amber-700 before:bg-amber-500',
    Graduated: 'bg-blue-100 text-blue-700 before:bg-blue-500',
    Dropped: 'bg-red-100 text-red-700 before:bg-red-500',
  }

  // Helper to get translated status
  const translatedStatus = (status: string) => {
    switch (status) {
      case 'Active': return t('students.active')
      case 'Transferred': return t('students.transferred')
      case 'Graduated': return t('students.graduated')
      case 'Dropped': return t('students.dropped')
      default: return status
    }
  }

  // Helper to get translated gender
  const translatedGender = (gender: string) => {
    switch (gender) {
      case 'Male': return t('common.male')
      case 'Female': return t('common.female')
      case 'Other': return t('common.other')
      default: return gender
    }
  }

  // Attendance summary calculations
  const attendancePresent = studentAttendance.filter((a) => a.status === 'Present').length
  const attendanceAbsent = studentAttendance.filter((a) => a.status === 'Absent').length
  const attendanceLate = studentAttendance.filter((a) => a.status === 'Late').length
  const attendanceTotal = studentAttendance.length
  const attendanceRate = attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 100) : 0

  // Grade summary calculations
  const gradeAverage = studentGrades.length > 0
    ? Math.round(studentGrades.reduce((sum, g) => sum + g.marksObtained, 0) / studentGrades.length)
    : 0
  const gradeHighest = studentGrades.length > 0 ? Math.max(...studentGrades.map((g) => g.marksObtained)) : 0
  const gradeLowest = studentGrades.length > 0 ? Math.min(...studentGrades.map((g) => g.marksObtained)) : 0

  // Avatar color based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500',
      'bg-cyan-500', 'bg-orange-500', 'bg-teal-500', 'bg-pink-500',
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return colors[Math.abs(hash) % colors.length]
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{t('students.title')}</h2>
            <p className="text-muted-foreground text-sm">{t('students.subtitle')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToCSV(filtered.map((s) => ({ Name: `${s.firstName} ${s.lastName}`, Class: s.class ? `${s.class.name} - ${s.class.section}` : t('students.unassigned'), Gender: s.gender, Email: s.email || '', Phone: s.phone || '', Status: s.status })), 'students')} disabled={filtered.length === 0}>
            <Download className="w-4 h-4 mr-2" /> {t('common.export')}
          </Button>
          <Button onClick={openAdd} className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-md shadow-emerald-500/20">
            <Plus className="w-4 h-4 mr-2" /> {t('students.addStudent')}
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="group border border-border/50 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 shadow-card border-l-4 border-l-emerald-500 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 shadow-sm group-hover:scale-110 transition-transform duration-200">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t('students.totalStudents')}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold">{totalStudents}</p>
                  <span className="text-emerald-600 text-xs font-semibold">↑</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="group border border-border/50 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 shadow-card border-l-4 border-l-teal-500 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 shadow-sm group-hover:scale-110 transition-transform duration-200">
                <UserCheck className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t('students.activeStudents')}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold">{activeStudents}</p>
                  <span className="text-teal-600 text-xs font-semibold">↑</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="group border border-border/50 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 shadow-card border-l-4 border-l-amber-500 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 shadow-sm group-hover:scale-110 transition-transform duration-200">
                <Users className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t('students.maleFemale')}</p>
                <p className="text-xl font-bold">{maleCount} / {femaleCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="group border border-border/50 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 shadow-card border-l-4 border-l-violet-500 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 shadow-sm group-hover:scale-110 transition-transform duration-200">
                <UserPlus className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t('students.newThisMonth')}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold">{newThisMonth}</p>
                  <span className="text-violet-600 text-xs font-semibold">↑</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batch Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-lg shadow-card">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            {selectedIds.size} {t('students.studentsSelected')}
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBatchStatusOpen(true)}
              className="text-emerald-700 border-emerald-300 hover:bg-emerald-100"
            >
              {t('students.changeStatus')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBatchDeleteOpen(true)}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-1" /> {t('common.delete')}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={clearSelection}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card className="border border-border/50 shadow-card bg-gradient-to-r from-background to-muted/30">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder={t('students.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="w-full sm:w-[180px] focus:ring-2 focus:ring-emerald-500/20"><Funnel className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" /><SelectValue placeholder={t('students.allClasses')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('students.allClasses')}</SelectItem>
                  {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} - {c.section}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[150px] focus:ring-2 focus:ring-emerald-500/20"><Funnel className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" /><SelectValue placeholder={t('students.allStatus')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('students.allStatus')}</SelectItem>
                  <SelectItem value="Active">{t('students.active')}</SelectItem>
                  <SelectItem value="Transferred">{t('students.transferred')}</SelectItem>
                  <SelectItem value="Graduated">{t('students.graduated')}</SelectItem>
                  <SelectItem value="Dropped">{t('students.dropped')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(search || filterClass !== 'all' || filterStatus !== 'all') && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setFilterClass('all'); setFilterStatus('all') }} className="text-emerald-600 hover:text-emerald-700 gap-1">
                <RotateCcw className="w-3.5 h-3.5" /> {t('common.reset')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border border-border/50 shadow-card rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b-2 border-border sticky top-0 z-10">
                  <TableHead className="py-3 px-4 w-12 sticky top-0">
                    <Checkbox
                      checked={allOnPageSelected}
                      {...(someOnPageSelected && { 'data-state': 'indeterminate' })}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all students on this page"
                    />
                  </TableHead>
                  <TableHead className="py-3 px-4 font-bold uppercase text-xs tracking-wider">{t('common.name')}</TableHead>
                  <TableHead className="py-3 px-4 font-bold uppercase text-xs tracking-wider">{t('students.class')}</TableHead>
                  <TableHead className="py-3 px-4 font-bold uppercase text-xs tracking-wider">{t('common.gender')}</TableHead>
                  <TableHead className="py-3 px-4 font-bold uppercase text-xs tracking-wider">{t('common.phone')}</TableHead>
                  <TableHead className="py-3 px-4 font-bold uppercase text-xs tracking-wider">{t('common.status')}</TableHead>
                  <TableHead className="py-3 px-4 text-right font-bold uppercase text-xs tracking-wider">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12">
                      <div className="flex flex-col items-center gap-3 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 flex items-center justify-center animate-pulse">
                          <FileX2 className="w-8 h-8 text-emerald-400" />
                        </div>
                        {search || filterClass !== 'all' || filterStatus !== 'all' ? (
                          <>
                            <p className="font-medium text-foreground">{t('students.noStudentsFound')}</p>
                            <p className="text-muted-foreground text-sm">{t('students.tryAdjusting')}</p>
                            <Button variant="outline" size="sm" onClick={() => { setSearch(''); setFilterClass('all'); setFilterStatus('all') }} className="gap-1"><RotateCcw className="w-3.5 h-3.5" /> {t('common.clearFilters')}</Button>
                          </>
                        ) : (
                          <>
                            <p className="font-medium text-foreground">{t('students.noStudentsYet')}</p>
                            <p className="text-muted-foreground text-sm">{t('students.getStarted')}</p>
                            <Button size="sm" onClick={openAdd} className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-md shadow-emerald-500/20"><Plus className="w-4 h-4 mr-1" /> {t('students.addStudent')}</Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedStudents.map((s, idx) => (
                    <TableRow key={s.id} className={`hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20 transition-colors duration-200 ${idx % 2 !== 0 ? 'bg-muted/15 dark:bg-muted/8' : ''} ${selectedIds.has(s.id) ? 'bg-emerald-50/70 dark:bg-emerald-950/25' : ''} border-l-2 border-l-transparent hover:border-l-emerald-400`}>
                      <TableCell className="py-3 px-4">
                        <Checkbox
                          checked={selectedIds.has(s.id)}
                          onCheckedChange={() => toggleSelect(s.id)}
                          aria-label={`Select ${s.firstName} ${s.lastName}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full ${getAvatarColor(s.firstName + s.lastName)} flex items-center justify-center text-white text-xs font-bold`}>
                            {s.firstName[0]}{s.lastName[0]}
                          </div>
                          {s.firstName} {s.lastName}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">{s.class ? `${s.class.name} - ${s.class.section}` : t('students.unassigned')}</TableCell>
                      <TableCell className="py-3 px-4">{translatedGender(s.gender)}</TableCell>
                      <TableCell className="py-3 px-4">{s.phone || '-'}</TableCell>
                      <TableCell className="py-3 px-4"><Badge className={`rounded-full px-3 py-1 text-xs font-semibold shadow-sm transition-colors before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:mr-1.5 before:inline-block ${statusColor[s.status] || ''}`}>{translatedStatus(s.status)}</Badge></TableCell>
                      <TableCell className="text-right py-3 px-4">
                        <div className="flex justify-end gap-1">
                          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => openView(s)}><Eye className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent>{t('students.viewProfile')}</TooltipContent></Tooltip>
                          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent>{t('common.edit')}</TooltipContent></Tooltip>
                          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="text-destructive" onClick={() => openDelete(s)}><Trash2 className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent>{t('common.delete')}</TooltipContent></Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filtered.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dialog-accent-top">
          <DialogHeader>
            <DialogTitle>{isEdit ? t('students.editStudent') : t('students.addNewStudent')}</DialogTitle>
            <DialogDescription>{isEdit ? t('students.updateStudentInfo') : t('students.enterStudentDetails')}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            {/* Personal Information Section */}
            <div className="sm:col-span-2 flex items-center gap-2 mb-1"><User className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{t('students.personalInformation')}</span><div className="flex-1 h-px bg-border/50" /></div>
            <div className="space-y-2"><Label className="text-sm font-medium flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-muted-foreground" />{t('students.firstName')} <span className="text-red-500 animate-pulse">*</span></Label><Input value={form.firstName} onChange={(e) => { setForm({ ...form, firstName: e.target.value }); if (validationErrors.firstName) setValidationErrors({ ...validationErrors, firstName: '' }) }} className="focus:ring-2 focus:ring-emerald-500/20" />{validationErrors.firstName && <p className="text-xs text-red-500">{validationErrors.firstName}</p>}</div>
            <div className="space-y-2"><Label className="text-sm font-medium flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-muted-foreground" />{t('students.lastName')} <span className="text-red-500 animate-pulse">*</span></Label><Input value={form.lastName} onChange={(e) => { setForm({ ...form, lastName: e.target.value }); if (validationErrors.lastName) setValidationErrors({ ...validationErrors, lastName: '' }) }} className="focus:ring-2 focus:ring-emerald-500/20" />{validationErrors.lastName && <p className="text-xs text-red-500">{validationErrors.lastName}</p>}</div>
            <div className="space-y-2"><Label className="text-sm font-medium flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-muted-foreground" />{t('students.dateOfBirth')}</Label><Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} className="focus:ring-2 focus:ring-emerald-500/20" /></div>
            <div className="space-y-2"><Label className="text-sm font-medium">{t('common.gender')} <span className="text-red-500 animate-pulse">*</span></Label><Select value={form.gender} onValueChange={(v) => { setForm({ ...form, gender: v }); if (validationErrors.gender) setValidationErrors({ ...validationErrors, gender: '' }) }}><SelectTrigger className="focus:ring-2 focus:ring-emerald-500/20"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Male">{t('common.male')}</SelectItem><SelectItem value="Female">{t('common.female')}</SelectItem><SelectItem value="Other">{t('common.other')}</SelectItem></SelectContent></Select>{validationErrors.gender && <p className="text-xs text-red-500">{validationErrors.gender}</p>}</div>
            {/* Contact Information Section */}
            <div className="sm:col-span-2 flex items-center gap-2 mb-1 mt-2"><Mail className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{t('students.contactInformation')}</span><div className="flex-1 h-px bg-border/50" /></div>
            <div className="space-y-2"><Label className="text-sm font-medium flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-muted-foreground" />{t('common.email')}</Label><Input type="email" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); if (validationErrors.email) setValidationErrors({ ...validationErrors, email: '' }) }} className="focus:ring-2 focus:ring-emerald-500/20" />{validationErrors.email && <p className="text-xs text-red-500">{validationErrors.email}</p>}</div>
            <div className="space-y-2"><Label className="text-sm font-medium flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-muted-foreground" />{t('common.phone')}</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="focus:ring-2 focus:ring-emerald-500/20" /></div>
            <div className="space-y-2 sm:col-span-2"><Label className="text-sm font-medium flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-muted-foreground" />{t('common.address')}</Label><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="focus:ring-2 focus:ring-emerald-500/20" /></div>
            {/* Academic Information Section */}
            <div className="sm:col-span-2 flex items-center gap-2 mb-1 mt-2"><GraduationCap className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{t('students.academicInformation')}</span><div className="flex-1 h-px bg-border/50" /></div>
            <div className="space-y-2"><Label className="text-sm font-medium">{t('students.class')}</Label><Select value={form.classId || 'none'} onValueChange={(v) => setForm({ ...form, classId: v === 'none' ? '' : v })}><SelectTrigger className="focus:ring-2 focus:ring-emerald-500/20"><SelectValue placeholder={t('students.selectClass')} /></SelectTrigger><SelectContent><SelectItem value="none">{t('students.noClass')}</SelectItem>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} - {c.section}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label className="text-sm font-medium">{t('common.status')}</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger className="focus:ring-2 focus:ring-emerald-500/20"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Active">{t('students.active')}</SelectItem><SelectItem value="Transferred">{t('students.transferred')}</SelectItem><SelectItem value="Graduated">{t('students.graduated')}</SelectItem><SelectItem value="Dropped">{t('students.dropped')}</SelectItem></SelectContent></Select></div>
            {/* Guardian Information Section */}
            <div className="sm:col-span-2 flex items-center gap-2 mb-1 mt-2"><Users className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{t('students.guardianInformation')}</span><div className="flex-1 h-px bg-border/50" /></div>
            <div className="space-y-2"><Label className="text-sm font-medium flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-muted-foreground" />{t('students.guardianName')}</Label><Input value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} className="focus:ring-2 focus:ring-emerald-500/20" /></div>
            <div className="space-y-2"><Label className="text-sm font-medium flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-muted-foreground" />{t('students.guardianPhone')}</Label><Input value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} className="focus:ring-2 focus:ring-emerald-500/20" /></div>
            <div className="space-y-2"><Label className="text-sm font-medium flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-muted-foreground" />{t('students.enrollmentDate')}</Label><Input type="date" value={form.enrollmentDate} onChange={(e) => setForm({ ...form, enrollmentDate: e.target.value })} className="focus:ring-2 focus:ring-emerald-500/20" /></div>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-md shadow-emerald-500/20 gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? t('common.saving') : t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('students.studentProfile')}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              {/* Avatar and Name Header */}
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full ${getAvatarColor(selected.firstName + selected.lastName)} flex items-center justify-center text-white text-xl font-bold shrink-0`}>
                  {selected.firstName[0]}{selected.lastName[0]}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selected.firstName} {selected.lastName}</h3>
                  <p className="text-muted-foreground text-sm">{selected.class ? `${selected.class.name} - ${selected.class.section}` : t('students.noClassAssigned')}</p>
                  <Badge className={`rounded-full px-2.5 py-0.5 font-medium text-xs mt-1 ${statusColor[selected.status] || ''}`}>{translatedStatus(selected.status)}</Badge>
                </div>
              </div>

              <Tabs value={profileTab} onValueChange={setProfileTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="profile" className="flex-1">{t('common.profile')}</TabsTrigger>
                  <TabsTrigger value="academics" className="flex-1"><GraduationCap className="w-4 h-4 mr-1" />{t('students.academicHistory')}</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-4 mt-4">
              <Separator />

              {/* Personal Info */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('students.personalInformation')}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">{t('students.dateOfBirth')}:</span> <span className="font-medium">{selected.dateOfBirth || '-'}</span></div>
                  <div><span className="text-muted-foreground">{t('common.gender')}:</span> <span className="font-medium">{translatedGender(selected.gender)}</span></div>
                  <div><span className="text-muted-foreground">{t('common.email')}:</span> <span className="font-medium">{selected.email || '-'}</span></div>
                  <div><span className="text-muted-foreground">{t('common.phone')}:</span> <span className="font-medium">{selected.phone || '-'}</span></div>
                  <div className="col-span-2"><span className="text-muted-foreground">{t('common.address')}:</span> <span className="font-medium">{selected.address || '-'}</span></div>
                </div>
              </div>

              <Separator />

              {/* Academic Info */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('students.academicInformation')}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">{t('students.class')}:</span> <span className="font-medium">{selected.class ? `${selected.class.name} - ${selected.class.section}` : t('students.unassigned')}</span></div>
                  <div><span className="text-muted-foreground">{t('students.enrollmentDate')}:</span> <span className="font-medium">{selected.enrollmentDate || '-'}</span></div>
                  <div><span className="text-muted-foreground">{t('common.status')}:</span> <Badge className={`rounded-full px-2.5 py-0.5 font-medium text-xs ${statusColor[selected.status] || ''}`}>{translatedStatus(selected.status)}</Badge></div>
                </div>
              </div>

              <Separator />

              {/* Guardian Info */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('students.guardianInformation')}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">{t('students.guardianName')}:</span> <span className="font-medium">{selected.guardianName || '-'}</span></div>
                  <div><span className="text-muted-foreground">{t('students.guardianPhone')}:</span> <span className="font-medium">{selected.guardianPhone || '-'}</span></div>
                </div>
              </div>

              <Separator />

              {/* Attendance Summary */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('students.attendanceSummary')}</h4>
                {profileLoading ? (
                  <div className="space-y-2">
                    <div className="h-8 bg-muted animate-pulse rounded" />
                    <div className="h-8 bg-muted animate-pulse rounded" />
                  </div>
                ) : attendanceTotal > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-3">
                      <Card className="border border-border/50">
                        <CardContent className="p-3 text-center">
                          <p className="text-xs text-muted-foreground">{t('students.rate')}</p>
                          <p className="text-lg font-bold text-emerald-600">{attendanceRate}%</p>
                        </CardContent>
                      </Card>
                      <Card className="border border-border/50">
                        <CardContent className="p-3 text-center">
                          <p className="text-xs text-muted-foreground">{t('common.present')}</p>
                          <p className="text-lg font-bold text-emerald-600">{attendancePresent}</p>
                        </CardContent>
                      </Card>
                      <Card className="border border-border/50">
                        <CardContent className="p-3 text-center">
                          <p className="text-xs text-muted-foreground">{t('common.absent')}</p>
                          <p className="text-lg font-bold text-red-600">{attendanceAbsent}</p>
                        </CardContent>
                      </Card>
                      <Card className="border border-border/50">
                        <CardContent className="p-3 text-center">
                          <p className="text-xs text-muted-foreground">{t('common.late')}</p>
                          <p className="text-lg font-bold text-amber-600">{attendanceLate}</p>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="max-h-32 overflow-y-auto custom-scrollbar">
                      {studentAttendance.slice(0, 5).map((a) => (
                        <div key={a.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                          <span className="text-muted-foreground">{a.date}</span>
                          <Badge className={`rounded-full px-2 py-0.5 text-xs ${
                            a.status === 'Present' ? 'bg-emerald-100 text-emerald-700' :
                            a.status === 'Absent' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>{a.status === 'Present' ? t('common.present') : a.status === 'Absent' ? t('common.absent') : t('common.late')}</Badge>
                        </div>
                      ))}
                      {studentAttendance.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center py-1">...{studentAttendance.length - 5} {t('students.andMoreRecords')}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('students.noAttendanceRecords')}</p>
                )}
              </div>

              <Separator />

              {/* Grade Summary */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('students.gradeSummary')}</h4>
                {profileLoading ? (
                  <div className="space-y-2">
                    <div className="h-8 bg-muted animate-pulse rounded" />
                    <div className="h-8 bg-muted animate-pulse rounded" />
                  </div>
                ) : studentGrades.length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <Card className="border border-border/50">
                        <CardContent className="p-3 text-center">
                          <p className="text-xs text-muted-foreground">{t('students.average')}</p>
                          <p className="text-lg font-bold text-emerald-600">{gradeAverage}</p>
                        </CardContent>
                      </Card>
                      <Card className="border border-border/50">
                        <CardContent className="p-3 text-center">
                          <p className="text-xs text-muted-foreground">{t('students.highest')}</p>
                          <p className="text-lg font-bold text-emerald-600">{gradeHighest}</p>
                        </CardContent>
                      </Card>
                      <Card className="border border-border/50">
                        <CardContent className="p-3 text-center">
                          <p className="text-xs text-muted-foreground">{t('students.lowest')}</p>
                          <p className="text-lg font-bold text-amber-600">{gradeLowest}</p>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="max-h-32 overflow-y-auto custom-scrollbar">
                      {studentGrades.slice(0, 5).map((g) => (
                        <div key={g.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                          <span className="font-medium">{g.exam?.name || t('students.unknownExam')}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{g.marksObtained}/{g.exam?.totalMarks || 100}</span>
                            <Badge className={`rounded-full px-2 py-0.5 text-xs ${
                              g.grade === 'A' || g.grade === 'A+' ? 'bg-emerald-100 text-emerald-700' :
                              g.grade === 'B' || g.grade === 'B+' ? 'bg-blue-100 text-blue-700' :
                              g.grade === 'C' ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>{g.grade || '-'}</Badge>
                          </div>
                        </div>
                      ))}
                      {studentGrades.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center py-1">...{studentGrades.length - 5} {t('students.andMoreRecords')}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('students.noGradeRecords')}</p>
                )}
              </div>
                </TabsContent>

                {/* Academic History Tab */}
                <TabsContent value="academics" className="space-y-4 mt-4">
                  {profileLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-8 w-full rounded" />
                      <Skeleton className="h-48 w-full rounded" />
                      <Skeleton className="h-32 w-full rounded" />
                    </div>
                  ) : academicHistory ? (
                    <>
                      {/* Performance Summary */}
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('students.academicPerformance')}</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <Card className="border border-border/50">
                            <CardContent className="p-3 text-center">
                              <p className="text-xs text-muted-foreground">{t('students.average')}</p>
                              <p className="text-lg font-bold text-emerald-600">{academicHistory.performanceSummary.averagePercentage}%</p>
                            </CardContent>
                          </Card>
                          <Card className="border border-border/50">
                            <CardContent className="p-3 text-center">
                              <p className="text-xs text-muted-foreground">{t('students.highest')}</p>
                              <p className="text-lg font-bold text-emerald-600">{academicHistory.performanceSummary.highestScore}</p>
                            </CardContent>
                          </Card>
                          <Card className="border border-border/50">
                            <CardContent className="p-3 text-center">
                              <p className="text-xs text-muted-foreground">{t('students.lowest')}</p>
                              <p className="text-lg font-bold text-amber-600">{academicHistory.performanceSummary.lowestScore}</p>
                            </CardContent>
                          </Card>
                          <Card className="border border-border/50">
                            <CardContent className="p-3 text-center">
                              <p className="text-xs text-muted-foreground">{t('students.totalExams')}</p>
                              <p className="text-lg font-bold">{academicHistory.performanceSummary.totalExams}</p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      <Separator />

                      {/* Grade Progression Chart */}
                      {academicHistory.gradeProgression.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" /> {t('students.gradeProgression')}
                          </h4>
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={academicHistory.gradeProgression}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="examName" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" interval={0} angle={-20} textAnchor="end" height={50} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                                <RTooltip
                                  contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                                  formatter={(value: number) => [`${value}%`, t('students.score')]}
                                  labelFormatter={(label: string) => label}
                                />
                                <Line type="monotone" dataKey="percentage" stroke="#059669" strokeWidth={2} dot={{ fill: '#059669', r: 3 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      <Separator />

                      {/* Attendance Trend */}
                      {academicHistory.attendanceTrend.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" /> {t('students.attendanceTrend')}
                          </h4>
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={academicHistory.attendanceTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                                <RTooltip
                                  contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                                  formatter={(value: number) => [`${value}%`, t('students.attendanceRate')]}
                                />
                                <Line type="monotone" dataKey="rate" stroke="#d97706" strokeWidth={2} dot={{ fill: '#d97706', r: 3 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      <Separator />

                      {/* Exam Results List */}
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('students.examResults')}</h4>
                        {academicHistory.gradeProgression.length > 0 ? (
                          <div className="max-h-48 overflow-y-auto">
                            {academicHistory.gradeProgression.map((g) => (
                              <div key={g.examId} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                                <div>
                                  <span className="font-medium">{g.examName}</span>
                                  <span className="text-muted-foreground text-xs ml-2">{g.subject}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">{g.marksObtained}/{g.totalMarks}</span>
                                  <Badge className={`rounded-full px-2 py-0.5 text-xs ${
                                    g.grade === 'A' || g.grade === 'A+' ? 'bg-emerald-100 text-emerald-700' :
                                    g.grade === 'B' || g.grade === 'B+' ? 'bg-blue-100 text-blue-700' :
                                    g.grade === 'C' ? 'bg-amber-100 text-amber-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>{g.grade}</Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">{t('students.noExamResults')}</p>
                        )}
                      </div>

                      <Separator />

                      {/* Grade Distribution */}
                      {academicHistory.performanceSummary.totalExams > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('students.gradeDistribution')}</h4>
                          <div className="flex items-end gap-2 h-16">
                            {Object.entries(academicHistory.performanceSummary.gradeDistribution).map(([grade, count]) => (
                              <div key={grade} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-xs font-medium">{count}</span>
                                <div
                                  className="w-full rounded-t"
                                  style={{
                                    height: `${Math.max((count / academicHistory.performanceSummary.totalExams) * 100, 4)}%`,
                                    backgroundColor:
                                      grade === 'A' ? '#059669' :
                                      grade === 'B' ? '#2563eb' :
                                      grade === 'C' ? '#d97706' :
                                      grade === 'D' ? '#f59e0b' : '#dc2626'
                                  }}
                                />
                                <span className="text-xs text-muted-foreground">{grade}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">{t('students.noAcademicHistory')}</p>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Single Delete Confirm */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="dialog-accent-top">
          <DialogHeader>
            <DialogTitle>{t('students.deleteStudent')}</DialogTitle>
            <DialogDescription>{t('students.deleteConfirmMessage')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete}>{t('common.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Delete Confirmation */}
      <AlertDialog open={batchDeleteOpen} onOpenChange={setBatchDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('students.batchDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('students.batchDeleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={batchLoading}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBatchDelete} disabled={batchLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {batchLoading ? t('students.deleting') : t('students.deleteAll')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Status Change Dialog */}
      <Dialog open={batchStatusOpen} onOpenChange={setBatchStatusOpen}>
        <DialogContent className="dialog-accent-top">
          <DialogHeader>
            <DialogTitle>{t('students.changeStatusFor')}</DialogTitle>
            <DialogDescription>{t('students.selectNewStatus')}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>{t('students.newStatus')}</Label>
            <Select value={batchStatus} onValueChange={setBatchStatus}>
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">{t('students.active')}</SelectItem>
                <SelectItem value="Transferred">{t('students.transferred')}</SelectItem>
                <SelectItem value="Graduated">{t('students.graduated')}</SelectItem>
                <SelectItem value="Dropped">{t('students.dropped')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchStatusOpen(false)} disabled={batchLoading}>{t('common.cancel')}</Button>
            <Button onClick={handleBatchStatusChange} disabled={batchLoading} className="bg-emerald-600 hover:bg-emerald-700">
              {batchLoading ? t('students.updating') : t('students.updateStatus')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
