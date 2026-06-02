'use client'

import { useEffect, useState } from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Plus, Pencil, Trash2, School, Users, FileX2, Loader2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Pagination } from '@/components/sms/pagination'
import { ClassFormSchema, validateForm } from '@/lib/validations'
import type { FormErrors } from '@/lib/validations'
import { useTranslation } from '@/lib/i18n'

interface ClassItem {
  id: string
  name: string
  grade: string
  section: string
  academicYear: string
  classTeacherId: string | null
  classTeacher?: { id: string; firstName: string; lastName: string } | null
  students?: Array<{ id: string; firstName: string; lastName: string }>
  _count?: { students: number }
}

interface Teacher {
  id: string
  firstName: string
  lastName: string
}

const emptyClass: Omit<ClassItem, 'id' | 'classTeacher' | 'students' | '_count'> = {
  name: '', grade: '', section: '', academicYear: '2025-2026', classTeacherId: null,
}

const ITEMS_PER_PAGE = 10

export function ClassManagement() {
  const { toast } = useToast()
  const { t } = useTranslation()
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [viewStudentsOpen, setViewStudentsOpen] = useState(false)
  const [selected, setSelected] = useState<ClassItem | null>(null)
  const [form, setForm] = useState(emptyClass)
  const [isEdit, setIsEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<FormErrors>({})
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const [cRes, tRes] = await Promise.all([fetch('/api/classes'), fetch('/api/teachers')])
      if (cRes.ok) setClasses(await cRes.json())
      if (tRes.ok) setTeachers(await tRes.json())
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  const totalPages = Math.ceil(classes.length / ITEMS_PER_PAGE)
  const paginatedClasses = classes.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  function openAdd() { setForm(emptyClass); setIsEdit(false); setValidationErrors({}); setDialogOpen(true) }

  function openEdit(c: ClassItem) {
    setForm({ name: c.name, grade: c.grade, section: c.section, academicYear: c.academicYear, classTeacherId: c.classTeacherId })
    setSelected(c); setIsEdit(true); setDialogOpen(true)
  }

  function openDelete(c: ClassItem) { setSelected(c); setDeleteOpen(true) }

  function openStudents(c: ClassItem) { setSelected(c); setViewStudentsOpen(true) }

  async function handleSave() {
    const result = validateForm(ClassFormSchema, form)
    if (!result.success) {
      setValidationErrors(result.errors)
      const errorCount = Object.keys(result.errors).length
      toast({ title: t('common.validationError'), description: `${errorCount} ${t('common.fieldsNeedAttention')}`, variant: 'destructive' })
      return
    }
    setValidationErrors({})
    setSaving(true)
    try {
      const body = { ...form, classTeacherId: form.classTeacherId || null }
      const res = isEdit
        ? await fetch(`/api/classes?id=${selected?.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch('/api/classes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
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
      const res = await fetch(`/api/classes?id=${selected?.id}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: t('common.success'), description: t('common.deletedSuccessfully') }); setDeleteOpen(false); fetchData() }
    } catch { /* ignore */ }
  }

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
            <School className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{t('classes.title')}</h2>
            <p className="text-muted-foreground text-sm">{t('classes.subtitle')}</p>
          </div>
        </div>
        <Button onClick={openAdd} className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-md shadow-emerald-500/20"><Plus className="w-4 h-4 mr-2" /> {t('classes.addClass')}</Button>
      </div>

      <Card className="border border-border/50 shadow-card rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b-2 border-border sticky top-0 z-10">
                  <TableHead className="py-3 px-4 font-bold uppercase text-xs tracking-wider">{t('common.name')}</TableHead>
                  <TableHead className="py-3 px-4 font-bold uppercase text-xs tracking-wider">{t('classes.grade')}</TableHead>
                  <TableHead className="py-3 px-4 font-bold uppercase text-xs tracking-wider">{t('classes.section')}</TableHead>
                  <TableHead className="py-3 px-4 font-bold uppercase text-xs tracking-wider">{t('classes.classTeacher')}</TableHead>
                  <TableHead className="py-3 px-4 font-bold uppercase text-xs tracking-wider">{t('classes.students')}</TableHead>
                  <TableHead className="py-3 px-4 text-right font-bold uppercase text-xs tracking-wider">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedClasses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12">
                      <div className="flex flex-col items-center gap-3 text-center">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <FileX2 className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground text-sm">{t('classes.noClassesYet')}</p>
                        <Button size="sm" onClick={openAdd} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-1" /> {t('classes.addClass')}</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedClasses.map((c, idx) => (
                  <TableRow key={c.id} className={`hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20 transition-colors duration-200 ${idx % 2 !== 0 ? 'bg-muted/15 dark:bg-muted/8' : ''} border-l-2 border-l-transparent hover:border-l-emerald-400`}>
                    <TableCell className="font-medium py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center"><School className="w-4 h-4 text-emerald-600" /></div>
                        {c.name}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">{c.grade || '-'}</TableCell>
                    <TableCell className="py-3 px-4"><Badge variant="outline" className="rounded-full px-2.5 py-0.5 font-medium text-xs">{c.section || '-'}</Badge></TableCell>
                    <TableCell className="py-3 px-4">{c.classTeacher ? `${c.classTeacher.firstName} ${c.classTeacher.lastName}` : t('classes.noTeacherAssigned')}</TableCell>
                    <TableCell className="py-3 px-4">
                      <Button variant="ghost" size="sm" onClick={() => openStudents(c)} className="gap-1">
                        <Users className="w-4 h-4" /> {c._count?.students ?? c.students?.length ?? 0}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right py-3 px-4">
                      <div className="flex justify-end gap-1">
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent>{t('common.edit')}</TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="text-destructive" onClick={() => openDelete(c)}><Trash2 className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent>{t('common.delete')}</TooltipContent></Tooltip>
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
            totalItems={classes.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg dialog-accent-top">
          <DialogHeader>
            <DialogTitle>{isEdit ? t('classes.editClass') : t('classes.addNewClass')}</DialogTitle>
            <DialogDescription>{isEdit ? t('classes.updateClassInfo') : t('classes.enterDetails')}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-2"><Label>{t('classes.className')} *</Label><Input value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); if (validationErrors.name) setValidationErrors({ ...validationErrors, name: '' }) }} placeholder="e.g., Grade 10" />{validationErrors.name && <p className="text-xs text-red-500">{validationErrors.name}</p>}</div>
            <div className="space-y-2"><Label>{t('classes.grade')} *</Label><Input value={form.grade} onChange={(e) => { setForm({ ...form, grade: e.target.value }); if (validationErrors.grade) setValidationErrors({ ...validationErrors, grade: '' }) }} placeholder="e.g., 10" />{validationErrors.grade && <p className="text-xs text-red-500">{validationErrors.grade}</p>}</div>
            <div className="space-y-2"><Label>{t('classes.section')} *</Label><Input value={form.section} onChange={(e) => { setForm({ ...form, section: e.target.value }); if (validationErrors.section) setValidationErrors({ ...validationErrors, section: '' }) }} placeholder="e.g., A, B" />{validationErrors.section && <p className="text-xs text-red-500">{validationErrors.section}</p>}</div>
            <div className="space-y-2"><Label>{t('classes.academicYear')}</Label><Input value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} placeholder="e.g., 2024-2025" /></div>
            <div className="space-y-2 sm:col-span-2">
              <Label>{t('classes.classTeacher')}</Label>
              <Select value={form.classTeacherId || 'none'} onValueChange={(v) => setForm({ ...form, classTeacherId: v === 'none' ? null : v })}>
                <SelectTrigger><SelectValue placeholder={t('classes.selectTeacher')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('classes.noTeacher')}</SelectItem>
                  {teachers.map((tc) => <SelectItem key={tc.id} value={tc.id}>{tc.firstName} {tc.lastName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-md shadow-emerald-500/20 gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? t('common.saving') : t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Students */}
      <Dialog open={viewStudentsOpen} onOpenChange={setViewStudentsOpen}>
        <DialogContent className="max-w-lg dialog-accent-top">
          <DialogHeader>
            <DialogTitle>{t('classes.studentsIn')} {selected?.name}</DialogTitle>
          </DialogHeader>
          {selected?.students && selected.students.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
              {selected.students.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 border-b-2 border-border">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center"><Users className="w-4 h-4 text-emerald-600" /></div>
                  <span className="text-sm">{s.firstName} {s.lastName}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">{t('classes.noStudentsInClass')}</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="dialog-accent-top">
          <DialogHeader><DialogTitle>{t('classes.deleteClass')}</DialogTitle><DialogDescription>{t('common.areYouSureDelete')} {selected?.name}? {t('common.thisActionCannotBeUndone')}</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete}>{t('common.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
