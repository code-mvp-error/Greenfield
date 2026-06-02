'use client'

import { useEffect, useState } from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Plus, Pencil, Trash2, BookOpen, Users, UserCheck, BookMarked, FileX2, Briefcase, GraduationCap, Eye, Mail, Phone, MapPin, Award, Calendar, User, Funnel, RotateCcw, Loader2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Pagination } from '@/components/sms/pagination'
import { TeacherFormSchema, validateForm } from '@/lib/validations'
import type { FormErrors } from '@/lib/validations'
import { useTranslation } from '@/lib/i18n'

interface Teacher {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: string
  address: string
  qualification: string
  specialization: string
  hireDate: string
  status: string
}

interface ClassSubject {
  id: string
  classId: string
  subjectId: string
  teacherId: string | null
  class: { id: string; name: string; section: string; grade: string }
  subject: { id: string; name: string; code: string }
  teacher: { id: string; firstName: string; lastName: string; specialization: string } | null
}

const emptyTeacher: Omit<Teacher, 'id'> = {
  firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '',
  gender: 'Male', address: '', qualification: '', specialization: '',
  hireDate: '', status: 'Active',
}

const ITEMS_PER_PAGE = 10

export function TeacherManagement() {
  const { toast } = useToast()
  const { t } = useTranslation()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [selected, setSelected] = useState<Teacher | null>(null)
  const [form, setForm] = useState(emptyTeacher)
  const [isEdit, setIsEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<FormErrors>({})
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => { fetchTeachers(); fetchClassSubjects() }, [])

  async function fetchTeachers() {
    try {
      const res = await fetch('/api/teachers')
      if (res.ok) setTeachers(await res.json())
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  async function fetchClassSubjects() {
    try {
      const res = await fetch('/api/class-subjects')
      if (res.ok) setClassSubjects(await res.json())
    } catch { /* ignore */ }
  }

  const filtered = teachers.filter((teacher) => {
    const name = `${teacher.firstName} ${teacher.lastName}`.toLowerCase()
    const matchSearch = !search || name.includes(search.toLowerCase()) || teacher.email.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || teacher.status === filterStatus
    return matchSearch && matchStatus
  })

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterStatus])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginatedTeachers = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  // Summary stats
  const totalTeachers = teachers.length
  const activeTeachers = teachers.filter((tc) => tc.status === 'Active').length
  const uniqueSpecializations = new Set(teachers.map((tc) => tc.specialization).filter(Boolean)).size

  // Workload data: group classSubjects by teacherId
  const teacherWorkload = teachers.map((tc) => {
    const assignments = classSubjects.filter((cs) => cs.teacherId === tc.id)
    const classes = [...new Set(assignments.map((cs) => cs.classId))]
    const subjects = assignments.map((cs) => ({
      id: cs.id,
      subjectName: cs.subject.name,
      subjectCode: cs.subject.code,
      className: `${cs.class.name} - ${cs.class.section}`,
    }))
    return {
      teacher: tc,
      assignments,
      classes,
      subjects,
      classCount: classes.length,
      subjectCount: assignments.length,
    }
  })

  // Workload stats
  const totalAssignments = classSubjects.filter((cs) => cs.teacherId).length
  const unassignedSubjects = classSubjects.filter((cs) => !cs.teacherId).length
  const avgClassesPerTeacher = teachers.length > 0
    ? (teacherWorkload.reduce((sum, tw) => sum + tw.classCount, 0) / teachers.filter((tc) => tc.status === 'Active').length).toFixed(1)
    : '0'

  function openAdd() { setForm(emptyTeacher); setIsEdit(false); setValidationErrors({}); setDialogOpen(true) }

  function openEdit(tc: Teacher) {
    setForm({ firstName: tc.firstName, lastName: tc.lastName, email: tc.email, phone: tc.phone, dateOfBirth: tc.dateOfBirth, gender: tc.gender, address: tc.address, qualification: tc.qualification, specialization: tc.specialization, hireDate: tc.hireDate, status: tc.status })
    setSelected(tc); setIsEdit(true); setDialogOpen(true)
  }

  function openView(tc: Teacher) { setSelected(tc); setViewOpen(true) }

  function openDelete(tc: Teacher) { setSelected(tc); setDeleteOpen(true) }

  const translateStatus = (status: string) => {
    switch (status) {
      case 'Active': return t('common.active')
      case 'On Leave': return t('common.onLeave')
      case 'Resigned': return t('teachers.resigned')
      default: return status
    }
  }

  const translateGender = (gender: string) => {
    switch (gender) {
      case 'Male': return t('common.male')
      case 'Female': return t('common.female')
      case 'Other': return t('common.other')
      default: return gender
    }
  }

  async function handleSave() {
    const result = validateForm(TeacherFormSchema, form)
    if (!result.success) {
      setValidationErrors(result.errors)
      const errorCount = Object.keys(result.errors).length
      toast({ title: t('common.validationError'), description: `${errorCount} ${t('common.fieldsNeedAttention')}`, variant: 'destructive' })
      return
    }
    setValidationErrors({})
    setSaving(true)
    try {
      const res = isEdit
        ? await fetch(`/api/teachers?id=${selected?.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        : await fetch('/api/teachers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) {
        toast({ title: t('common.success'), description: isEdit ? t('common.updatedSuccessfully') : t('common.createdSuccessfully') })
        setDialogOpen(false); fetchTeachers()
      } else {
        const err = await res.json()
        toast({ title: t('common.error'), description: err.error || t('common.failedToSave'), variant: 'destructive' })
      }
    } catch {
      toast({ title: t('common.error'), description: t('common.networkError'), variant: 'destructive' })
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/teachers?id=${selected?.id}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: t('common.success'), description: t('common.deletedSuccessfully') }); setDeleteOpen(false); fetchTeachers() }
    } catch { /* ignore */ }
  }

  const statusColor: Record<string, string> = {
    Active: 'bg-emerald-100 text-emerald-700 before:bg-emerald-500',
    'On Leave': 'bg-amber-100 text-amber-700 before:bg-amber-500',
    Resigned: 'bg-red-100 text-red-700 before:bg-red-500',
  }

  if (loading) return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{t('teachers.title')}</h2>
            <p className="text-muted-foreground text-sm">{t('teachers.subtitle')}</p>
          </div>
        </div>
        <Button onClick={openAdd} className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-md shadow-emerald-500/20"><Plus className="w-4 h-4 mr-2" /> {t('teachers.addTeacher')}</Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="group border border-border/50 shadow-card hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-emerald-500 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 shadow-sm group-hover:scale-110 transition-transform duration-200">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="p-0.5 text-xs font-medium text-muted-foreground">{t('teachers.totalTeachers')}</p>
                <div className="flex items-center gap-2"><p className="text-xl font-bold">{totalTeachers}</p><span className="text-emerald-600 text-xs font-semibold">↑</span></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="group border border-border/50 shadow-card hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-teal-500 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 shadow-sm group-hover:scale-110 transition-transform duration-200">
                <UserCheck className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="p-0.5 text-xs font-medium text-muted-foreground">{t('teachers.activeTeachers')}</p>
                <div className="flex items-center gap-2"><p className="text-xl font-bold">{activeTeachers}</p><span className="text-teal-600 text-xs font-semibold">↑</span></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="group border border-border/50 shadow-card hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-amber-500 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 shadow-sm group-hover:scale-110 transition-transform duration-200">
                <BookMarked className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="p-0.5 text-xs font-medium text-muted-foreground">{t('teachers.subjectsCovered')}</p>
                <p className="text-xl font-bold">{uniqueSpecializations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="directory">
        <TabsList>
          <TabsTrigger value="directory">{t('teachers.teacherDirectory')}</TabsTrigger>
          <TabsTrigger value="workload"><Briefcase className="w-4 h-4 mr-2" />{t('teachers.workload')}</TabsTrigger>
        </TabsList>

        {/* Teacher Directory Tab */}
        <TabsContent value="directory" className="space-y-4">
          <Card className="border border-border/50 shadow-card bg-gradient-to-r from-background to-muted/30">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder={t('teachers.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-[150px] focus:ring-2 focus:ring-emerald-500/20"><Funnel className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" /><SelectValue placeholder={`${t('common.all')} ${t('common.status')}`} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common.all')} {t('common.status')}</SelectItem>
                    <SelectItem value="Active">{t('common.active')}</SelectItem>
                    <SelectItem value="On Leave">{t('common.onLeave')}</SelectItem>
                    <SelectItem value="Resigned">{t('teachers.resigned')}</SelectItem>
                  </SelectContent>
                </Select>
                {(search || filterStatus !== 'all') && (
                  <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setFilterStatus('all') }} className="text-emerald-600 hover:text-emerald-700 gap-1">
                    <RotateCcw className="w-3.5 h-3.5" /> {t('common.reset')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50 shadow-card rounded-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b-2 border-border sticky top-0 z-10">
                      <TableHead className="py-3 px-4 font-bold uppercase text-xs tracking-wider">{t('common.name')}</TableHead>
                      <TableHead className="py-3 px-4 font-bold uppercase text-xs tracking-wider">{t('common.email')}</TableHead>
                      <TableHead className="py-3 px-4 font-bold uppercase text-xs tracking-wider">{t('teachers.specialization')}</TableHead>
                      <TableHead className="py-3 px-4 font-bold uppercase text-xs tracking-wider">{t('common.phone')}</TableHead>
                      <TableHead className="py-3 px-4 font-bold uppercase text-xs tracking-wider">{t('common.status')}</TableHead>
                      <TableHead className="py-3 px-4 text-right font-bold uppercase text-xs tracking-wider">{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTeachers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-12">
                          <div className="flex flex-col items-center gap-3 text-center">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                              <FileX2 className="w-6 h-6 text-muted-foreground" />
                            </div>
                            {search || filterStatus !== 'all' ? (
                              <>
                                <p className="text-muted-foreground text-sm">{t('teachers.noTeachersFound')}</p>
                                <Button variant="outline" size="sm" onClick={() => { setSearch(''); setFilterStatus('all') }}>{t('common.clearFilters')}</Button>
                              </>
                            ) : (
                              <>
                                <p className="text-muted-foreground text-sm">{t('teachers.noTeachersYet')}</p>
                                <Button size="sm" onClick={openAdd} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-1" /> {t('teachers.addTeacher')}</Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : paginatedTeachers.map((teacher, idx) => (
                      <TableRow key={teacher.id} className={`hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20 transition-colors duration-200 ${idx % 2 !== 0 ? 'bg-muted/15 dark:bg-muted/8' : ''} border-l-2 border-l-transparent hover:border-l-emerald-400`}>
                        <TableCell className="font-medium py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center"><BookOpen className="w-4 h-4 text-emerald-600" /></div>
                            {teacher.firstName} {teacher.lastName}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4">{teacher.email}</TableCell>
                        <TableCell className="py-3 px-4">{teacher.specialization || '-'}</TableCell>
                        <TableCell className="py-3 px-4">{teacher.phone || '-'}</TableCell>
                        <TableCell className="py-3 px-4"><Badge className={`rounded-full px-3 py-1 text-xs font-semibold shadow-sm transition-colors before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:mr-1.5 before:inline-block ${statusColor[teacher.status] || ''}`}>{translateStatus(teacher.status)}</Badge></TableCell>
                        <TableCell className="text-right py-3 px-4">
                          <div className="flex justify-end gap-1">
                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => openView(teacher)}><Eye className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent>{t('common.view')} {t('common.profile')}</TooltipContent></Tooltip>
                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => openEdit(teacher)}><Pencil className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent>{t('common.edit')}</TooltipContent></Tooltip>
                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="text-destructive" onClick={() => openDelete(teacher)}><Trash2 className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent>{t('common.delete')}</TooltipContent></Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
        </TabsContent>

        {/* Workload Tab */}
        <TabsContent value="workload" className="space-y-4">
          {/* Workload Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border border-border/50 shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 shadow-sm">
                    <BookOpen className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('teachers.totalAssignments')}</p>
                    <p className="text-xl font-bold">{totalAssignments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-border/50 shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 shadow-sm">
                    <GraduationCap className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('teachers.unassignedSubjects')}</p>
                    <p className="text-xl font-bold">{unassignedSubjects}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-border/50 shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-violet-50 dark:bg-violet-950/40 shadow-sm">
                    <Briefcase className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('teachers.avgClassesPerTeacher')}</p>
                    <p className="text-xl font-bold">{avgClassesPerTeacher}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Teacher Workload Cards */}
          {teacherWorkload.length === 0 ? (
            <Card className="border border-border/50 shadow-card">
              <CardContent className="py-12">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <FileX2 className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">{t('teachers.noTeachersFound')}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teacherWorkload.map((tw) => (
                <Card key={tw.teacher.id} className="border border-border/50 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{tw.teacher.firstName} {tw.teacher.lastName}</CardTitle>
                          <CardDescription className="text-xs">{tw.teacher.specialization || t('teachers.noSpecialization')}</CardDescription>
                        </div>
                      </div>
                      <Badge className={`rounded-full px-3 py-0.5 font-semibold text-xs border ${statusColor[tw.teacher.status] || ''}`}>{translateStatus(tw.teacher.status)}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Workload indicators */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-muted-foreground">{t('classes.title')}:</span>
                          <span className="font-semibold">{tw.classCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-amber-500" />
                          <span className="text-muted-foreground">{t('teachers.subjectsLabel')}:</span>
                          <span className="font-semibold">{tw.subjectCount}</span>
                        </div>
                      </div>

                      {/* Subject assignments as badges */}
                      {tw.subjects.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {tw.subjects.map((sub) => (
                            <Badge key={sub.id} variant="outline" className="rounded-full px-2 py-0.5 text-xs font-normal border-emerald-200 bg-emerald-50/50 text-emerald-700">
                              {sub.subjectName} ({sub.className})
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">{t('teachers.noSubjectsAssigned')}</p>
                      )}

                      {/* Workload bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{t('teachers.workload')}</span>
                          <span>{tw.subjectCount} {tw.subjectCount !== 1 ? t('teachers.subjectsLabel').toLowerCase() : t('teachers.subjectsLabel').toLowerCase().replace(/s$/, '')}</span>
                        </div>
                        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                            style={{ width: `${Math.min((tw.subjectCount / Math.max(...teacherWorkload.map((twl) => twl.subjectCount), 1)) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Unassigned Subjects Section */}
          {unassignedSubjects > 0 && (
            <Card className="border border-amber-200 bg-amber-50/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-amber-600" />
                  <CardTitle className="text-base">{t('teachers.unassignedSubjects')}</CardTitle>
                </div>
                <CardDescription>{t('teachers.unassignedDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {classSubjects.filter((cs) => !cs.teacherId).map((cs) => (
                    <Badge key={cs.id} variant="outline" className="rounded-full px-3 py-1 text-sm border-amber-300 bg-amber-50 text-amber-700">
                      {cs.subject.name} — {cs.class.name} ({cs.class.section})
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl dialog-accent-top max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? t('teachers.editTeacher') : t('teachers.addNewTeacher')}</DialogTitle>
            <DialogDescription>{isEdit ? t('teachers.updateTeacherInfo') : t('teachers.enterDetails')}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-2"><Label>{t('common.firstName')} *</Label><Input value={form.firstName} onChange={(e) => { setForm({ ...form, firstName: e.target.value }); if (validationErrors.firstName) setValidationErrors({ ...validationErrors, firstName: '' }) }} />{validationErrors.firstName && <p className="text-xs text-red-500">{validationErrors.firstName}</p>}</div>
            <div className="space-y-2"><Label>{t('common.lastName')} *</Label><Input value={form.lastName} onChange={(e) => { setForm({ ...form, lastName: e.target.value }); if (validationErrors.lastName) setValidationErrors({ ...validationErrors, lastName: '' }) }} />{validationErrors.lastName && <p className="text-xs text-red-500">{validationErrors.lastName}</p>}</div>
            <div className="space-y-2"><Label>{t('common.email')} *</Label><Input type="email" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); if (validationErrors.email) setValidationErrors({ ...validationErrors, email: '' }) }} />{validationErrors.email && <p className="text-xs text-red-500">{validationErrors.email}</p>}</div>
            <div className="space-y-2"><Label>{t('common.phone')}</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t('common.dateOfBirth')}</Label><Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t('common.gender')}</Label><Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Male">{t('common.male')}</SelectItem><SelectItem value="Female">{t('common.female')}</SelectItem><SelectItem value="Other">{t('common.other')}</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>{t('teachers.qualification')} *</Label><Input value={form.qualification} onChange={(e) => { setForm({ ...form, qualification: e.target.value }); if (validationErrors.qualification) setValidationErrors({ ...validationErrors, qualification: '' }) }} placeholder="e.g., M.Ed, B.Sc" />{validationErrors.qualification && <p className="text-xs text-red-500">{validationErrors.qualification}</p>}</div>
            <div className="space-y-2"><Label>{t('teachers.specialization')} *</Label><Input value={form.specialization} onChange={(e) => { setForm({ ...form, specialization: e.target.value }); if (validationErrors.specialization) setValidationErrors({ ...validationErrors, specialization: '' }) }} placeholder="e.g., Mathematics, Physics" />{validationErrors.specialization && <p className="text-xs text-red-500">{validationErrors.specialization}</p>}</div>
            <div className="space-y-2"><Label>{t('teachers.hireDate')}</Label><Input type="date" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t('common.status')}</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Active">{t('common.active')}</SelectItem><SelectItem value="On Leave">{t('common.onLeave')}</SelectItem><SelectItem value="Resigned">{t('teachers.resigned')}</SelectItem></SelectContent></Select></div>
            <div className="space-y-2 sm:col-span-2"><Label>{t('common.address')}</Label><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-md shadow-emerald-500/20 gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? t('common.saving') : t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Teacher Profile Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg dialog-accent-top max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('teachers.teacherProfile')}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-6">
              {/* Avatar and Name Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <BookOpen className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selected.firstName} {selected.lastName}</h3>
                  {selected.specialization && (
                    <p className="text-muted-foreground text-sm">{selected.specialization}</p>
                  )}
                  <Badge className={`rounded-full px-3 py-0.5 font-semibold text-xs border mt-1 ${statusColor[selected.status] || ''}`}>{translateStatus(selected.status)}</Badge>
                </div>
              </div>

              <Separator />

              {/* Personal Info */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('teachers.personalInfo')}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t('common.gender')}:</span>
                    <span className="font-medium">{translateGender(selected.gender) || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t('common.dateOfBirth')}:</span>
                    <span className="font-medium">{selected.dateOfBirth || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t('common.email')}:</span>
                    <span className="font-medium truncate">{selected.email || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t('common.phone')}:</span>
                    <span className="font-medium">{selected.phone || '-'}</span>
                  </div>
                  {selected.address && (
                    <div className="col-span-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t('common.address')}:</span>
                      <span className="font-medium">{selected.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Professional Info */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('teachers.professionalInfo')}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t('teachers.qualification')}:</span>
                    <span className="font-medium">{selected.qualification || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t('teachers.specialization')}:</span>
                    <span className="font-medium">{selected.specialization || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t('teachers.hireDate')}:</span>
                    <span className="font-medium">{selected.hireDate || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t('common.status')}:</span>
                    <Badge className={`rounded-full px-3 py-0.5 font-semibold text-xs border ${statusColor[selected.status] || ''}`}>{translateStatus(selected.status)}</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="dialog-accent-top">
          <DialogHeader><DialogTitle>{t('teachers.deleteTeacher')}</DialogTitle><DialogDescription>{t('common.areYouSureDelete')} {selected?.firstName} {selected?.lastName}? {t('common.thisActionCannotBeUndone')}</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete}>{t('common.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
