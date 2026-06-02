'use client'

import { useEffect, useState } from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
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
import { Search, Plus, Pencil, Trash2, Users, FileX2, Funnel, RotateCcw, Loader2, Mail, Phone, User } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Pagination } from '@/components/sms/pagination'
import { StaffFormSchema, validateForm } from '@/lib/validations'
import type { FormErrors } from '@/lib/validations'
import { useTranslation } from '@/lib/i18n'

interface Staff {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  department: string
  hireDate: string
  status: string
}

const emptyStaff: Omit<Staff, 'id'> = {
  firstName: '', lastName: '', email: '', phone: '',
  role: 'Staff', department: '', hireDate: '', status: 'Active',
}

const ITEMS_PER_PAGE = 10

export function StaffManagement() {
  const { toast } = useToast()
  const { t } = useTranslation()
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<Staff | null>(null)
  const [form, setForm] = useState(emptyStaff)
  const [isEdit, setIsEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<FormErrors>({})
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => { fetchStaff() }, [])

  async function fetchStaff() {
    try {
      const res = await fetch('/api/staff')
      if (res.ok) setStaffList(await res.json())
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  const filtered = staffList.filter((s) => {
    const name = `${s.firstName} ${s.lastName}`.toLowerCase()
    const matchSearch = !search || name.includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === 'all' || s.role === filterRole
    const matchStatus = filterStatus === 'all' || s.status === filterStatus
    return matchSearch && matchRole && matchStatus
  })

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterRole, filterStatus])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginatedStaff = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  function openAdd() { setForm(emptyStaff); setIsEdit(false); setValidationErrors({}); setDialogOpen(true) }

  function openEdit(s: Staff) {
    setForm({ firstName: s.firstName, lastName: s.lastName, email: s.email, phone: s.phone, role: s.role, department: s.department, hireDate: s.hireDate, status: s.status })
    setSelected(s); setIsEdit(true); setDialogOpen(true)
  }

  function openDelete(s: Staff) { setSelected(s); setDeleteOpen(true) }

  const translateStatus = (status: string) => {
    switch (status) {
      case 'Active': return t('common.active')
      case 'On Leave': return t('common.onLeave')
      case 'Resigned': return t('staff.resigned')
      default: return status
    }
  }

  const translateRole = (role: string) => {
    switch (role) {
      case 'Admin': return t('staff.admin')
      case 'Staff': return t('staff.staffRole')
      case 'Accountant': return t('staff.accountant')
      case 'Librarian': return t('staff.librarian')
      default: return role
    }
  }

  async function handleSave() {
    const result = validateForm(StaffFormSchema, form)
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
        ? await fetch(`/api/staff?id=${selected?.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        : await fetch('/api/staff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) {
        toast({ title: t('common.success'), description: isEdit ? t('common.updatedSuccessfully') : t('common.createdSuccessfully') })
        setDialogOpen(false); fetchStaff()
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
      const res = await fetch(`/api/staff?id=${selected?.id}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: t('common.success'), description: t('common.deletedSuccessfully') }); setDeleteOpen(false); fetchStaff() }
    } catch { /* ignore */ }
  }

  const roleColor: Record<string, string> = {
    Admin: 'bg-violet-100 text-violet-700 before:bg-violet-500',
    Staff: 'bg-emerald-100 text-emerald-700 before:bg-emerald-500',
    Accountant: 'bg-amber-100 text-amber-700 before:bg-amber-500',
    Librarian: 'bg-blue-100 text-blue-700 before:bg-blue-500',
  }

  const statusColor: Record<string, string> = {
    Active: 'bg-emerald-100 text-emerald-700 before:bg-emerald-500',
    'On Leave': 'bg-amber-100 text-amber-700 before:bg-amber-500',
    Resigned: 'bg-red-100 text-red-700 before:bg-red-500',
  }

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-16 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{t('staff.title')}</h2>
            <p className="text-muted-foreground text-sm">{t('staff.subtitle')}</p>
          </div>
        </div>
        <Button onClick={openAdd} className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-md shadow-emerald-500/20"><Plus className="w-4 h-4 mr-2" /> {t('staff.addStaff')}</Button>
      </div>

      <Card className="border border-border/50 shadow-card bg-gradient-to-r from-background to-muted/30">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder={t('staff.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full sm:w-[150px] focus:ring-2 focus:ring-emerald-500/20"><Funnel className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" /><SelectValue placeholder={t('staff.allRoles')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('staff.allRoles')}</SelectItem>
                <SelectItem value="Admin">{t('staff.admin')}</SelectItem>
                <SelectItem value="Staff">{t('staff.staffRole')}</SelectItem>
                <SelectItem value="Accountant">{t('staff.accountant')}</SelectItem>
                <SelectItem value="Librarian">{t('staff.librarian')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[150px] focus:ring-2 focus:ring-emerald-500/20"><Funnel className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" /><SelectValue placeholder={`${t('common.all')} ${t('common.status')}`} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')} {t('common.status')}</SelectItem>
                <SelectItem value="Active">{t('common.active')}</SelectItem>
                <SelectItem value="On Leave">{t('common.onLeave')}</SelectItem>
                <SelectItem value="Resigned">{t('staff.resigned')}</SelectItem>
              </SelectContent>
            </Select>
            {(search || filterRole !== 'all' || filterStatus !== 'all') && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setFilterRole('all'); setFilterStatus('all') }} className="text-emerald-600 hover:text-emerald-700 gap-1">
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
                  <TableHead className="py-3 px-4 font-bold uppercase text-xs tracking-wider">{t('staff.role')}</TableHead>
                  <TableHead className="py-3 px-4 font-bold uppercase text-xs tracking-wider">{t('staff.department')}</TableHead>
                  <TableHead className="py-3 px-4 font-bold uppercase text-xs tracking-wider">{t('common.email')}</TableHead>
                  <TableHead className="py-3 px-4 font-bold uppercase text-xs tracking-wider">{t('common.status')}</TableHead>
                  <TableHead className="py-3 px-4 text-right font-bold uppercase text-xs tracking-wider">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12">
                      <div className="flex flex-col items-center gap-3 text-center">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <FileX2 className="w-6 h-6 text-muted-foreground" />
                        </div>
                        {search || filterRole !== 'all' || filterStatus !== 'all' ? (
                          <>
                            <p className="text-muted-foreground text-sm">{t('staff.noStaffFound')}</p>
                            <Button variant="outline" size="sm" onClick={() => { setSearch(''); setFilterRole('all'); setFilterStatus('all') }}>{t('common.clearFilters')}</Button>
                          </>
                        ) : (
                          <>
                            <p className="text-muted-foreground text-sm">{t('staff.noStaffYet')}</p>
                            <Button size="sm" onClick={openAdd} className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-md shadow-emerald-500/20"><Plus className="w-4 h-4 mr-1" /> {t('staff.addStaff')}</Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedStaff.map((s, idx) => (
                  <TableRow key={s.id} className={`hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors duration-150 ${idx % 2 === 0 ? '' : 'bg-muted/20 dark:bg-muted/10'}`}>
                    <TableCell className="font-medium py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center"><Users className="w-4 h-4 text-amber-600" /></div>
                        {s.firstName} {s.lastName}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4"><Badge className={`rounded-full px-3 py-1 text-xs font-semibold shadow-sm transition-colors before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:mr-1.5 before:inline-block ${roleColor[s.role] || ''}`}>{translateRole(s.role)}</Badge></TableCell>
                    <TableCell className="py-3 px-4">{s.department || '-'}</TableCell>
                    <TableCell className="py-3 px-4">{s.email}</TableCell>
                    <TableCell className="py-3 px-4"><Badge className={`rounded-full px-3 py-1 text-xs font-semibold shadow-sm transition-colors before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:mr-1.5 before:inline-block ${statusColor[s.status] || ''}`}>{translateStatus(s.status)}</Badge></TableCell>
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? t('staff.editStaff') : t('staff.addNewStaff')}</DialogTitle>
            <DialogDescription>{isEdit ? t('staff.updateStaffInfo') : t('staff.enterDetails')}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-2"><Label>{t('common.firstName')} *</Label><Input value={form.firstName} onChange={(e) => { setForm({ ...form, firstName: e.target.value }); if (validationErrors.firstName) setValidationErrors({ ...validationErrors, firstName: '' }) }} />{validationErrors.firstName && <p className="text-xs text-red-500">{validationErrors.firstName}</p>}</div>
            <div className="space-y-2"><Label>{t('common.lastName')} *</Label><Input value={form.lastName} onChange={(e) => { setForm({ ...form, lastName: e.target.value }); if (validationErrors.lastName) setValidationErrors({ ...validationErrors, lastName: '' }) }} />{validationErrors.lastName && <p className="text-xs text-red-500">{validationErrors.lastName}</p>}</div>
            <div className="space-y-2"><Label>{t('common.email')} *</Label><Input type="email" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); if (validationErrors.email) setValidationErrors({ ...validationErrors, email: '' }) }} />{validationErrors.email && <p className="text-xs text-red-500">{validationErrors.email}</p>}</div>
            <div className="space-y-2"><Label>{t('common.phone')}</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t('staff.role')} *</Label><Select value={form.role} onValueChange={(v) => { setForm({ ...form, role: v }); if (validationErrors.role) setValidationErrors({ ...validationErrors, role: '' }) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Admin">{t('staff.admin')}</SelectItem><SelectItem value="Staff">{t('staff.staffRole')}</SelectItem><SelectItem value="Accountant">{t('staff.accountant')}</SelectItem><SelectItem value="Librarian">{t('staff.librarian')}</SelectItem></SelectContent></Select>{validationErrors.role && <p className="text-xs text-red-500">{validationErrors.role}</p>}</div>
            <div className="space-y-2"><Label>{t('staff.department')} *</Label><Input value={form.department} onChange={(e) => { setForm({ ...form, department: e.target.value }); if (validationErrors.department) setValidationErrors({ ...validationErrors, department: '' }) }} placeholder="e.g., Administration, Finance" />{validationErrors.department && <p className="text-xs text-red-500">{validationErrors.department}</p>}</div>
            <div className="space-y-2"><Label>{t('staff.hireDate')}</Label><Input type="date" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t('common.status')}</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Active">{t('common.active')}</SelectItem><SelectItem value="On Leave">{t('common.onLeave')}</SelectItem><SelectItem value="Resigned">{t('staff.resigned')}</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-md shadow-emerald-500/20 gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? t('common.saving') : t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="dialog-accent-top">
          <DialogHeader><DialogTitle>{t('staff.deleteStaff')}</DialogTitle><DialogDescription>{t('common.areYouSureDelete')} {selected?.firstName} {selected?.lastName}? {t('common.thisActionCannotBeUndone')}</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete}>{t('common.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
