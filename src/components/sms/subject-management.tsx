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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Pencil, Trash2, BookMarked, Link, FileX2, Loader2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Pagination } from '@/components/sms/pagination'
import { SubjectFormSchema, validateForm } from '@/lib/validations'
import type { FormErrors } from '@/lib/validations'
import { useTranslation } from '@/lib/i18n'

interface Subject {
  id: string
  name: string
  code: string
  description: string
}

interface ClassSubject {
  id: string
  classId: string
  subjectId: string
  teacherId: string | null
  class?: { id: string; name: string; section: string }
  subject?: { id: string; name: string; code: string }
  teacher?: { id: string; firstName: string; lastName: string } | null
}

interface Class {
  id: string; name: string; section: string
}

interface Teacher {
  id: string; firstName: string; lastName: string
}

const emptySubject: Omit<Subject, 'id'> = { name: '', code: '', description: '' }
const emptyAssignment = { classId: '', subjectId: '', teacherId: '' }

const ITEMS_PER_PAGE = 10

export function SubjectManagement() {
  const { toast } = useToast()
  const { t } = useTranslation()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [assignments, setAssignments] = useState<ClassSubject[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selected, setSelected] = useState<Subject | null>(null)
  const [form, setForm] = useState(emptySubject)
  const [isEdit, setIsEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<FormErrors>({})
  const [assignForm, setAssignForm] = useState(emptyAssignment)
  const [assignSaving, setAssignSaving] = useState(false)
  const [subjectsPage, setSubjectsPage] = useState(1)
  const [assignmentsPage, setAssignmentsPage] = useState(1)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const [sRes, csRes, cRes, tRes] = await Promise.all([
        fetch('/api/subjects'), fetch('/api/class-subjects'), fetch('/api/classes'), fetch('/api/teachers'),
      ])
      if (sRes.ok) setSubjects(await sRes.json())
      if (csRes.ok) setAssignments(await csRes.json())
      if (cRes.ok) setClasses(await cRes.json())
      if (tRes.ok) setTeachers(await tRes.json())
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  function openAdd() { setForm(emptySubject); setIsEdit(false); setValidationErrors({}); setDialogOpen(true) }

  function openEdit(s: Subject) {
    setForm({ name: s.name, code: s.code, description: s.description })
    setSelected(s); setIsEdit(true); setDialogOpen(true)
  }

  function openDelete(s: Subject) { setSelected(s); setDeleteOpen(true) }

  async function handleSave() {
    const result = validateForm(SubjectFormSchema, form)
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
        ? await fetch(`/api/subjects?id=${selected?.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        : await fetch('/api/subjects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) {
        toast({ title: t('common.success'), description: isEdit ? t('common.updatedSuccessfully') : t('common.createdSuccessfully') })
        setDialogOpen(false); fetchData()
      } else {
        toast({ title: t('common.error'), description: t('common.failedToSave'), variant: 'destructive' })
      }
    } catch {
      toast({ title: t('common.error'), description: t('common.networkError'), variant: 'destructive' })
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/subjects?id=${selected?.id}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: t('common.success'), description: t('common.deletedSuccessfully') }); setDeleteOpen(false); fetchData() }
    } catch { /* ignore */ }
  }

  async function handleAssign() {
    if (!assignForm.classId || !assignForm.subjectId) {
      toast({ title: t('common.error'), description: t('subjects.classAndSubjectRequired'), variant: 'destructive' })
      return
    }
    setAssignSaving(true)
    try {
      const res = await fetch('/api/class-subjects', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...assignForm, teacherId: assignForm.teacherId || null }),
      })
      if (res.ok) {
        toast({ title: t('common.success'), description: t('subjects.subjectAssigned') })
        setAssignDialogOpen(false); setAssignForm(emptyAssignment); fetchData()
      } else {
        toast({ title: t('common.error'), description: t('subjects.failedToAssign'), variant: 'destructive' })
      }
    } catch {
      toast({ title: t('common.error'), description: t('common.networkError'), variant: 'destructive' })
    } finally { setAssignSaving(false) }
  }

  const subjectsTotalPages = Math.ceil(subjects.length / ITEMS_PER_PAGE)
  const paginatedSubjects = subjects.slice((subjectsPage - 1) * ITEMS_PER_PAGE, subjectsPage * ITEMS_PER_PAGE)

  const assignmentsTotalPages = Math.ceil(assignments.length / ITEMS_PER_PAGE)
  const paginatedAssignments = assignments.slice((assignmentsPage - 1) * ITEMS_PER_PAGE, assignmentsPage * ITEMS_PER_PAGE)

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-48 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <BookMarked className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{t('subjects.title')}</h2>
            <p className="text-muted-foreground text-sm">{t('subjects.subtitle')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAssignDialogOpen(true)} variant="outline" className="gap-2"><Link className="w-4 h-4" /> {t('subjects.assignTeacher')}</Button>
          <Button onClick={openAdd} className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-md shadow-emerald-500/20"><Plus className="w-4 h-4 mr-2" /> {t('subjects.addSubject')}</Button>
        </div>
      </div>

      <Tabs defaultValue="subjects">
        <TabsList>
          <TabsTrigger value="subjects">{t('subjects.title')}</TabsTrigger>
          <TabsTrigger value="assignments">{t('subjects.teacherAssignments')}</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects">
          <Card className="border border-border/50 shadow-card rounded-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b-2 border-border sticky top-0 z-10">
                      <TableHead className="py-3 px-4 font-bold uppercase text-xs tracking-wider">{t('common.name')}</TableHead>
                      <TableHead className="py-3 px-4 font-bold uppercase text-xs tracking-wider">{t('subjects.code')}</TableHead>
                      <TableHead className="py-3 px-4 font-bold uppercase text-xs tracking-wider">{t('common.description')}</TableHead>
                      <TableHead className="py-3 px-4 text-right font-bold uppercase text-xs tracking-wider">{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSubjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-12">
                          <div className="flex flex-col items-center gap-3 text-center">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                              <FileX2 className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground text-sm">{t('subjects.noSubjectsYet')}</p>
                            <Button size="sm" onClick={openAdd} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-1" /> {t('subjects.addSubject')}</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : paginatedSubjects.map((s, idx) => (
                      <TableRow key={s.id} className={`hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20 transition-colors duration-200 ${idx % 2 !== 0 ? 'bg-muted/15 dark:bg-muted/8' : ''} border-l-2 border-l-transparent hover:border-l-emerald-400`}>
                        <TableCell className="font-medium py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center"><BookMarked className="w-4 h-4 text-emerald-600" /></div>
                            {s.name}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4"><Badge variant="outline" className="rounded-full px-2.5 py-0.5 font-medium text-xs">{s.code}</Badge></TableCell>
                        <TableCell className="max-w-xs truncate py-3 px-4">{s.description || '-'}</TableCell>
                        <TableCell className="text-right py-3 px-4">
                          <div className="flex justify-end gap-1">
                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent>{t('common.edit')}</TooltipContent></Tooltip>
                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="text-destructive" onClick={() => openDelete(s)}><Trash2 className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent>{t('common.delete')}</TooltipContent></Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Pagination
                currentPage={subjectsPage}
                totalPages={subjectsTotalPages}
                onPageChange={setSubjectsPage}
                totalItems={subjects.length}
                itemsPerPage={ITEMS_PER_PAGE}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments">
          <Card className="border border-border/50 shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">{t('subjects.subjectTeacherAssignments')}</CardTitle>
              <CardDescription>{t('subjects.assignDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b-2 border-border sticky top-0 z-10">
                      <TableHead className="py-3 px-4 font-bold uppercase text-xs tracking-wider">{t('subjects.classes')}</TableHead>
                      <TableHead className="py-3 px-4 font-bold uppercase text-xs tracking-wider">{t('subjects.title')}</TableHead>
                      <TableHead className="py-3 px-4 font-bold uppercase text-xs tracking-wider">{t('subjects.teacher')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAssignments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="py-12">
                          <div className="flex flex-col items-center gap-3 text-center">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                              <FileX2 className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground text-sm">{t('subjects.noTeacherAssignments')}</p>
                            <Button size="sm" onClick={() => setAssignDialogOpen(true)} variant="outline" className="gap-1"><Link className="w-4 h-4" /> {t('subjects.assignTeacher')}</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : paginatedAssignments.map((a, idx) => (
                      <TableRow key={a.id} className={`hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20 transition-colors duration-200 ${idx % 2 !== 0 ? 'bg-muted/15 dark:bg-muted/8' : ''} border-l-2 border-l-transparent hover:border-l-emerald-400`}>
                        <TableCell className="py-3 px-4">{a.class ? `${a.class.name} - ${a.class.section}` : '-'}</TableCell>
                        <TableCell className="py-3 px-4">{a.subject ? `${a.subject.name} (${a.subject.code})` : '-'}</TableCell>
                        <TableCell className="py-3 px-4">{a.teacher ? `${a.teacher.firstName} ${a.teacher.lastName}` : <Badge variant="outline" className="rounded-full px-2.5 py-0.5 font-medium text-xs">{t('subjects.unassigned')}</Badge>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Pagination
                currentPage={assignmentsPage}
                totalPages={assignmentsTotalPages}
                onPageChange={setAssignmentsPage}
                totalItems={assignments.length}
                itemsPerPage={ITEMS_PER_PAGE}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Subject Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="dialog-accent-top">
          <DialogHeader>
            <DialogTitle>{isEdit ? t('subjects.editSubject') : t('subjects.addNewSubject')}</DialogTitle>
            <DialogDescription>{isEdit ? t('subjects.updateSubjectInfo') : t('subjects.enterDetails')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>{t('common.name')} *</Label><Input value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); if (validationErrors.name) setValidationErrors({ ...validationErrors, name: '' }) }} placeholder="e.g., Mathematics" />{validationErrors.name && <p className="text-xs text-red-500">{validationErrors.name}</p>}</div>
            <div className="space-y-2"><Label>{t('subjects.code')} *</Label><Input value={form.code} onChange={(e) => { setForm({ ...form, code: e.target.value }); if (validationErrors.code) setValidationErrors({ ...validationErrors, code: '' }) }} placeholder="e.g., MATH101" />{validationErrors.code && <p className="text-xs text-red-500">{validationErrors.code}</p>}</div>
            <div className="space-y-2"><Label>{t('common.description')}</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">{saving ? t('common.saving') : t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Teacher Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="dialog-accent-top">
          <DialogHeader>
            <DialogTitle>{t('subjects.assignTeacherToSubject')}</DialogTitle>
            <DialogDescription>{t('subjects.assignDescription2')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('subjects.classes')} *</Label>
              <Select value={assignForm.classId} onValueChange={(v) => setAssignForm({ ...assignForm, classId: v })}>
                <SelectTrigger><SelectValue placeholder={t('subjects.selectClass')} /></SelectTrigger>
                <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} - {c.section}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('subjects.title')} *</Label>
              <Select value={assignForm.subjectId} onValueChange={(v) => setAssignForm({ ...assignForm, subjectId: v })}>
                <SelectTrigger><SelectValue placeholder={t('subjects.selectSubject')} /></SelectTrigger>
                <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('subjects.teacher')}</Label>
              <Select value={assignForm.teacherId || 'none'} onValueChange={(v) => setAssignForm({ ...assignForm, teacherId: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder={t('subjects.selectTeacher')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('subjects.noTeacher')}</SelectItem>
                  {teachers.map((tc) => <SelectItem key={tc.id} value={tc.id}>{tc.firstName} {tc.lastName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleAssign} disabled={assignSaving} className="bg-emerald-600 hover:bg-emerald-700">{assignSaving ? t('common.saving') : t('subjects.assignAction')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="dialog-accent-top">
          <DialogHeader><DialogTitle>{t('subjects.deleteSubject')}</DialogTitle><DialogDescription>{t('common.areYouSureDelete')} {selected?.name}? {t('common.thisActionCannotBeUndone')}</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete}>{t('common.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
