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
import { Progress } from '@/components/ui/progress'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Pencil, Trash2, DollarSign, TrendingUp, Clock, AlertTriangle, Download, PieChart as PieChartIcon, BarChart3, Bell, Send, CheckCircle2, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Pagination } from '@/components/sms/pagination'
import { exportToCSV } from '@/lib/export'
import { FeeStructureFormSchema, FeePaymentFormSchema, validateForm } from '@/lib/validations'
import type { FormErrors } from '@/lib/validations'
import { Checkbox } from '@/components/ui/checkbox'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useTranslation } from '@/lib/i18n'

interface FeeStructure {
  id: string
  classId: string
  feeType: string
  amount: number
  academicYear: string
  description: string
  class?: { id: string; name: string; section: string }
}

interface FeePayment {
  id: string
  studentId: string
  feeType: string
  amount: number
  paymentDate: string
  paymentMethod: string
  status: string
  receiptNumber: string
  academicYear: string
  remarks: string
  student?: { id: string; firstName: string; lastName: string }
}

interface ClassItem { id: string; name: string; section: string }
interface Student { id: string; firstName: string; lastName: string }

interface OverduePayment {
  id: string
  studentId: string
  studentName: string
  feeType: string
  amount: number
  paymentDate: string
  daysOverdue: number
  status: string
}

const emptyFeeStructure: Omit<FeeStructure, 'id' | 'class'> = {
  classId: '', feeType: 'Tuition', amount: 0, academicYear: '2025-2026', description: '',
}

const emptyFeePayment: Omit<FeePayment, 'id' | 'student'> = {
  studentId: '', feeType: 'Tuition', amount: 0, paymentDate: new Date().toISOString().split('T')[0], paymentMethod: 'Cash',
  status: 'Paid', receiptNumber: '', academicYear: '2025-2026', remarks: '',
}

const statusColor: Record<string, string> = {
  Paid: 'bg-emerald-100 text-emerald-700 before:bg-emerald-500',
  Pending: 'bg-amber-100 text-amber-700 before:bg-amber-500',
  Overdue: 'bg-red-100 text-red-700 before:bg-red-500',
  Partial: 'bg-blue-100 text-blue-700 before:bg-blue-500',
}

const PIE_COLORS = ['#059669', '#d97706', '#2563eb', '#dc2626']

const ITEMS_PER_PAGE = 10

export function FinancialManagement() {
  const { toast } = useToast()
  const { t } = useTranslation()
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
  const [feePayments, setFeePayments] = useState<FeePayment[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  // Fee Structure
  const [fsDialogOpen, setFsDialogOpen] = useState(false)
  const [fsDeleteOpen, setFsDeleteOpen] = useState(false)
  const [selectedFs, setSelectedFs] = useState<FeeStructure | null>(null)
  const [fsForm, setFsForm] = useState(emptyFeeStructure)
  const [fsIsEdit, setFsIsEdit] = useState(false)
  const [fsSaving, setFsSaving] = useState(false)
  const [fsValidationErrors, setFsValidationErrors] = useState<FormErrors>({})

  // Fee Payment
  const [fpDialogOpen, setFpDialogOpen] = useState(false)
  const [fpDeleteOpen, setFpDeleteOpen] = useState(false)
  const [selectedFp, setSelectedFp] = useState<FeePayment | null>(null)
  const [fpForm, setFpForm] = useState(emptyFeePayment)
  const [fpIsEdit, setFpIsEdit] = useState(false)
  const [fpSaving, setFpSaving] = useState(false)
  const [fpValidationErrors, setFpValidationErrors] = useState<FormErrors>({})
  const [filterStatus, setFilterStatus] = useState('all')

  // Pagination
  const [fsPage, setFsPage] = useState(1)
  const [fpPage, setFpPage] = useState(1)

  // Tab state
  const [activeTab, setActiveTab] = useState('structures')

  // Overdue alerts state
  const [overduePayments, setOverduePayments] = useState<OverduePayment[]>([])
  const [overdueLoading, setOverdueLoading] = useState(false)
  const [selectedOverdueIds, setSelectedOverdueIds] = useState<Set<string>>(new Set())
  const [markOverdueLoading, setMarkOverdueLoading] = useState(false)
  const [reminderSent, setReminderSent] = useState(false)

  useEffect(() => { fetchData(); fetchOverdueData() }, [])

  async function fetchData() {
    try {
      const [fsRes, fpRes, cRes, sRes] = await Promise.all([
        fetch('/api/fee-structures'), fetch('/api/fee-payments'), fetch('/api/classes'), fetch('/api/students'),
      ])
      if (fsRes.ok) setFeeStructures(await fsRes.json())
      if (fpRes.ok) setFeePayments(await fpRes.json())
      if (cRes.ok) setClasses(await cRes.json())
      if (sRes.ok) setStudents(await sRes.json())
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  async function fetchOverdueData() {
    setOverdueLoading(true)
    try {
      const res = await fetch('/api/overdue-alerts')
      if (res.ok) {
        const data = await res.json()
        setOverduePayments(data.overduePayments || [])
      }
    } catch { /* ignore */ }
    finally { setOverdueLoading(false) }
  }

  // Reset payment page on filter change
  useEffect(() => {
    setFpPage(1)
  }, [filterStatus])

  const filteredPayments = feePayments.filter((p) => filterStatus === 'all' || p.status === filterStatus)

  // Summary stats
  const totalCollected = feePayments.filter((p) => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0)
  const totalPending = feePayments.filter((p) => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0)
  const totalOverdue = feePayments.filter((p) => p.status === 'Overdue').reduce((sum, p) => sum + p.amount, 0)
  const totalDue = feeStructures.reduce((sum, fs) => sum + fs.amount, 0)
  const collectionProgress = totalDue > 0 ? Math.round((totalCollected / totalDue) * 100) : 0

  // Monthly revenue trends data
  const monthlyRevenue = useMemo(() => {
    const monthMap: Record<string, number> = {}
    feePayments
      .filter((p) => p.status === 'Paid' && p.paymentDate)
      .forEach((p) => {
        const monthKey = p.paymentDate.slice(0, 7) // YYYY-MM
        monthMap[monthKey] = (monthMap[monthKey] || 0) + p.amount
      })
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({
        month: month.slice(5), // MM only
        revenue: amount,
      }))
  }, [feePayments])

  // Payment method breakdown data
  const paymentMethodData = useMemo(() => {
    const methodMap: Record<string, number> = {}
    feePayments
      .filter((p) => p.status === 'Paid')
      .forEach((p) => {
        methodMap[p.paymentMethod] = (methodMap[p.paymentMethod] || 0) + p.amount
      })
    return Object.entries(methodMap).map(([method, amount]) => ({
      name: method,
      value: amount,
    }))
  }, [feePayments])

  // Fee Structure CRUD
  function openAddFs() { setFsForm(emptyFeeStructure); setFsIsEdit(false); setFsValidationErrors({}); setFsDialogOpen(true) }
  function openEditFs(fs: FeeStructure) {
    setFsForm({ classId: fs.classId, feeType: fs.feeType, amount: fs.amount, academicYear: fs.academicYear, description: fs.description })
    setSelectedFs(fs); setFsIsEdit(true); setFsDialogOpen(true)
  }
  function openDeleteFs(fs: FeeStructure) { setSelectedFs(fs); setFsDeleteOpen(true) }

  async function saveFs() {
    const result = validateForm(FeeStructureFormSchema, fsForm)
    if (!result.success) {
      setFsValidationErrors(result.errors)
      const errorCount = Object.keys(result.errors).length
      toast({ title: t('common.validationError'), description: `${errorCount} ${t('common.fieldsNeedAttention')}`, variant: 'destructive' })
      return
    }
    setFsValidationErrors({})
    setFsSaving(true)
    try {
      const res = fsIsEdit
        ? await fetch(`/api/fee-structures?id=${selectedFs?.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fsForm) })
        : await fetch('/api/fee-structures', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fsForm) })
      if (res.ok) { toast({ title: t('common.success'), description: t('finances.feeStructureSaved') }); setFsDialogOpen(false); fetchData() }
      else { toast({ title: t('common.error'), description: t('common.failedToSave'), variant: 'destructive' }) }
    } catch { toast({ title: t('common.error'), description: t('common.networkError'), variant: 'destructive' }) }
    finally { setFsSaving(false) }
  }

  async function deleteFs() {
    try {
      const res = await fetch(`/api/fee-structures?id=${selectedFs?.id}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: t('common.success'), description: t('finances.feeStructureDeleted') }); setFsDeleteOpen(false); fetchData() }
    } catch { /* ignore */ }
  }

  // Fee Payment CRUD
  function openAddFp() { setFpForm(emptyFeePayment); setFpIsEdit(false); setFpValidationErrors({}); setFpDialogOpen(true) }
  function openEditFp(fp: FeePayment) {
    setFpForm({ studentId: fp.studentId, feeType: fp.feeType, amount: fp.amount, paymentDate: fp.paymentDate, paymentMethod: fp.paymentMethod, status: fp.status, receiptNumber: fp.receiptNumber, academicYear: fp.academicYear, remarks: fp.remarks })
    setSelectedFp(fp); setFpIsEdit(true); setFpDialogOpen(true)
  }
  function openDeleteFp(fp: FeePayment) { setSelectedFp(fp); setFpDeleteOpen(true) }

  async function saveFp() {
    const result = validateForm(FeePaymentFormSchema, fpForm)
    if (!result.success) {
      setFpValidationErrors(result.errors)
      const errorCount = Object.keys(result.errors).length
      toast({ title: t('common.validationError'), description: `${errorCount} ${t('common.fieldsNeedAttention')}`, variant: 'destructive' })
      return
    }
    setFpValidationErrors({})
    setFpSaving(true)
    try {
      const res = fpIsEdit
        ? await fetch(`/api/fee-payments?id=${selectedFp?.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fpForm) })
        : await fetch('/api/fee-payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fpForm) })
      if (res.ok) { toast({ title: t('common.success'), description: t('finances.paymentSaved') }); setFpDialogOpen(false); fetchData() }
      else { toast({ title: t('common.error'), description: t('common.failedToSave'), variant: 'destructive' }) }
    } catch { toast({ title: t('common.error'), description: t('common.networkError'), variant: 'destructive' }) }
    finally { setFpSaving(false) }
  }

  async function deleteFp() {
    try {
      const res = await fetch(`/api/fee-payments?id=${selectedFp?.id}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: t('common.success'), description: t('finances.paymentDeleted') }); setFpDeleteOpen(false); fetchData() }
    } catch { /* ignore */ }
  }

  const fsTotalPages = Math.ceil(feeStructures.length / ITEMS_PER_PAGE)
  const paginatedFs = feeStructures.slice((fsPage - 1) * ITEMS_PER_PAGE, fsPage * ITEMS_PER_PAGE)

  const fpTotalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE)
  const paginatedFp = filteredPayments.slice((fpPage - 1) * ITEMS_PER_PAGE, fpPage * ITEMS_PER_PAGE)

  // Helper to translate fee type for display
  const translateFeeType = (feeType: string) => {
    if (feeType === 'Tuition') return t('finances.tuition')
    if (feeType === 'Inscription') return t('finances.inscription')
    if (feeType === 'Scolarité') return t('finances.scolarite')
    if (feeType === 'Lab Fee') return t('finances.labFee')
    if (feeType === 'Library Fee') return t('finances.libraryFee')
    if (feeType === 'Transport') return t('finances.transport')
    if (feeType === 'Sports') return t('finances.transport') // fallback
    return feeType
  }

  // Helper to translate payment method for display
  const translatePaymentMethod = (method: string) => {
    if (method === 'Cash') return t('common.cash')
    if (method === 'Bank Transfer') return t('common.bankTransfer')
    if (method === 'Online') return t('common.online')
    if (method === 'Check') return t('common.check')
    return method
  }

  // Helper to translate status for display
  const translateStatus = (status: string) => {
    if (status === 'Paid') return t('common.paid')
    if (status === 'Pending') return t('common.pending')
    if (status === 'Overdue') return t('common.overdue')
    if (status === 'Partial') return t('common.partial')
    return status
  }

  if (loading) return <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{t('finances.title')}</h2>
            <p className="text-muted-foreground text-sm">{t('finances.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="group border border-border/50 shadow-card hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-emerald-500 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 shadow-sm group-hover:scale-110 transition-transform duration-200">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="p-0.5 text-xs font-medium text-muted-foreground">{t('finances.totalCollected')}</p>
                <div className="flex items-center gap-2"><p className="text-xl font-bold text-emerald-600">${totalCollected.toLocaleString()}</p><span className="text-emerald-600 text-xs font-semibold">↑</span></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="group border border-border/50 shadow-card hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-amber-500 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 shadow-sm group-hover:scale-110 transition-transform duration-200">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="p-0.5 text-xs font-medium text-muted-foreground">{t('finances.totalPending')}</p>
                <div className="flex items-center gap-2"><p className="text-xl font-bold text-amber-600">${totalPending.toLocaleString()}</p><span className="text-amber-600 text-xs font-semibold">↓</span></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="group border border-border/50 shadow-card hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-red-500 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 shadow-sm group-hover:scale-110 transition-transform duration-200">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="p-0.5 text-xs font-medium text-muted-foreground">{t('finances.totalOverdue')}</p>
                <div className="flex items-center gap-2"><p className="text-xl font-bold text-red-600">${totalOverdue.toLocaleString()}</p><span className="text-red-600 text-xs font-semibold">↓</span></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Revenue Trends */}
        <Card className="border border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              {t('finances.monthlyRevenue')}
            </CardTitle>
            <CardDescription>{t('finances.revenueDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyRevenue.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyRevenue} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                    <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--popover)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, t('finances.revenue')]}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#059669"
                      strokeWidth={2}
                      dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#047857' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                {t('finances.noPaymentData')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Method Breakdown */}
        <Card className="border border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-emerald-600" />
              {t('finances.paymentMethodBreakdown')}
            </CardTitle>
            <CardDescription>{t('finances.paymentMethodDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentMethodData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethodData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {paymentMethodData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--popover)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      formatter={(value: string) => <span className="text-xs text-foreground">{translatePaymentMethod(value)}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                {t('finances.noPaymentData')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fee Collection Progress */}
      <Card className="border border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            {t('finances.feeCollectionProgress')}
          </CardTitle>
          <CardDescription>{t('finances.feeCollectionDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('finances.collected')}</span>
              <span className="text-sm font-bold text-emerald-600">${totalCollected.toLocaleString()}</span>
            </div>
            <Progress value={collectionProgress} className="h-3" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{collectionProgress}% {t('finances.collectedLabel')}</span>
              <span>{t('finances.totalDue')}: ${totalDue.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="text-center p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                <p className="text-xs text-muted-foreground">{t('common.paid')}</p>
                <p className="text-lg font-bold text-emerald-600">${totalCollected.toLocaleString()}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-amber-50/50 border border-amber-100">
                <p className="text-xs text-muted-foreground">{t('common.pending')}</p>
                <p className="text-lg font-bold text-amber-600">${totalPending.toLocaleString()}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-50/50 border border-red-100">
                <p className="text-xs text-muted-foreground">{t('common.overdue')}</p>
                <p className="text-lg font-bold text-red-600">${totalOverdue.toLocaleString()}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                <p className="text-xs text-muted-foreground">{t('finances.remaining')}</p>
                <p className="text-lg font-bold text-blue-600">${Math.max(totalDue - totalCollected, 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overdue Fee Alerts */}
      {overduePayments.length > 0 && (
        <Card className="border-red-200 bg-red-50/30 dark:border-red-900 dark:bg-red-950/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-red-600" />
                <CardTitle className="text-base text-red-700 dark:text-red-400">{t('finances.overdueFeeAlerts')}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                  onClick={async () => {
                    setReminderSent(true)
                    toast({ title: t('finances.remindersSent'), description: `Payment reminders sent for ${overduePayments.length} overdue fee(s) (simulated)` })
                    setTimeout(() => setReminderSent(false), 3000)
                  }}
                  disabled={reminderSent}
                >
                  <Send className="w-4 h-4 mr-1" /> {reminderSent ? t('common.sent') : t('common.sendReminders')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-amber-600 border-amber-300 hover:bg-amber-50"
                  onClick={async () => {
                    setMarkOverdueLoading(true)
                    try {
                      const res = await fetch('/api/overdue-alerts?action=mark-overdue')
                      if (res.ok) {
                        const data = await res.json()
                        toast({ title: t('finances.markAsOverdue'), description: data.message })
                        fetchData()
                        fetchOverdueData()
                      }
                    } catch { /* ignore */ }
                    finally { setMarkOverdueLoading(false) }
                  }}
                  disabled={markOverdueLoading}
                >
                  <AlertTriangle className="w-4 h-4 mr-1" /> {markOverdueLoading ? t('common.marking') : t('common.markAllOverdue')}
                </Button>
              </div>
            </div>
            <CardDescription className="text-red-600/70">
              {overduePayments.length} {t('finances.overduePaymentsDescription')} ${overduePayments.reduce((s, p) => s + p.amount, 0).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-red-100/50">
                    <TableHead className="py-2 px-3 w-10">
                      <Checkbox
                        checked={overduePayments.length > 0 && overduePayments.every((o) => selectedOverdueIds.has(o.id))}
                        onCheckedChange={(checked) => {
                          if (checked) setSelectedOverdueIds(new Set(overduePayments.map((o) => o.id)))
                          else setSelectedOverdueIds(new Set())
                        }}
                      />
                    </TableHead>
                    <TableHead className="py-2 px-3">{t('common.name')}</TableHead>
                    <TableHead className="py-2 px-3">{t('finances.feeType')}</TableHead>
                    <TableHead className="py-2 px-3">{t('common.amount')}</TableHead>
                    <TableHead className="py-2 px-3">{t('finances.daysOverdue')}</TableHead>
                    <TableHead className="py-2 px-3 text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overduePayments.map((o) => (
                    <TableRow key={o.id} className={`hover:bg-red-50/50 ${selectedOverdueIds.has(o.id) ? 'bg-red-50/70' : ''}`}>
                      <TableCell className="py-2 px-3">
                        <Checkbox
                          checked={selectedOverdueIds.has(o.id)}
                          onCheckedChange={(checked) => {
                            setSelectedOverdueIds((prev) => {
                              const next = new Set(prev)
                              if (checked) next.add(o.id)
                              else next.delete(o.id)
                              return next
                            })
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium py-2 px-3">{o.studentName}</TableCell>
                      <TableCell className="py-2 px-3">{o.feeType}</TableCell>
                      <TableCell className="py-2 px-3">${o.amount.toLocaleString()}</TableCell>
                      <TableCell className="py-2 px-3">
                        <Badge className="rounded-full px-2 py-0.5 text-xs bg-red-100 text-red-700">
                          {o.daysOverdue} {o.daysOverdue !== 1 ? t('finances.days') : t('finances.day')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right py-2 px-3">
                        <Button variant="outline" size="sm" className="text-amber-600 border-amber-300 hover:bg-amber-50 h-7 text-xs" onClick={async () => {
                          try {
                            const res = await fetch(`/api/overdue-alerts?action=send-reminder&paymentId=${o.id}`)
                            if (res.ok) { toast({ title: t('finances.remindersSent'), description: `Reminder sent to ${o.studentName} (simulated)` }) }
                          } catch { /* ignore */ }
                        }}><Send className="w-3 h-3 mr-1" /> {t('finances.remind')}</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {selectedOverdueIds.size > 0 && (
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-red-200">
                <CheckCircle2 className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700">{selectedOverdueIds.size} {t('common.selected')}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto text-amber-600 border-amber-300 hover:bg-amber-50"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/overdue-alerts', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ paymentIds: Array.from(selectedOverdueIds), status: 'Overdue' }),
                      })
                      if (res.ok) {
                        const data = await res.json()
                        toast({ title: t('finances.statusUpdated'), description: data.message })
                        setSelectedOverdueIds(new Set())
                        fetchData()
                        fetchOverdueData()
                      }
                    } catch { /* ignore */ }
                  }}
                >
                  <AlertTriangle className="w-4 h-4 mr-1" /> {t('finances.markAsOverdue')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="structures">{t('finances.feeStructures')}</TabsTrigger>
          <TabsTrigger value="payments">{t('finances.feePayments')}</TabsTrigger>
          <TabsTrigger value="overdue">
            <AlertTriangle className="w-4 h-4 mr-1" /> {t('common.overdue')}
            {overduePayments.length > 0 && (
              <Badge className="ml-1.5 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white">
                {overduePayments.length > 9 ? '9+' : overduePayments.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Fee Structures */}
        <TabsContent value="structures" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => exportToCSV(feeStructures.map((fs) => ({ Class: fs.class ? `${fs.class.name} - ${fs.class.section}` : '-', 'Fee Type': fs.feeType, Amount: fs.amount, 'Academic Year': fs.academicYear, Description: fs.description || '' })), 'fee-structures')} disabled={feeStructures.length === 0}>
              <Download className="w-4 h-4 mr-2" /> {t('common.exportCSV')}
            </Button>
            <Button onClick={openAddFs} className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-md shadow-emerald-500/20"><Plus className="w-4 h-4 mr-2" /> {t('finances.addFeeStructure')}</Button>
          </div>

          <Card className="border border-border/50 shadow-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 border-b-2 border-border"><TableHead className="py-3 px-4">{t('classes.title')}</TableHead><TableHead className="py-3 px-4">{t('finances.feeType')}</TableHead><TableHead className="py-3 px-4">{t('common.amount')}</TableHead><TableHead className="py-3 px-4">{t('finances.academicYear')}</TableHead><TableHead className="py-3 px-4">{t('common.description')}</TableHead><TableHead className="py-3 px-4 text-right">{t('common.actions')}</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedFs.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t('finances.noFeeStructuresFound')}</TableCell></TableRow>
                  ) : paginatedFs.map((fs, idx) => (
                    <TableRow key={fs.id} className={`hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors duration-150 ${idx % 2 === 0 ? '' : 'bg-muted/20 dark:bg-muted/10'}`}>
                      <TableCell className="font-medium py-3 px-4">{fs.class ? `${fs.class.name} - ${fs.class.section}` : '-'}</TableCell>
                      <TableCell className="py-3 px-4"><Badge variant="outline" className="rounded-full px-3 py-0.5 font-semibold text-xs border">{translateFeeType(fs.feeType)}</Badge></TableCell>
                      <TableCell className="py-3 px-4">${fs.amount.toLocaleString()}</TableCell>
                      <TableCell className="py-3 px-4">{fs.academicYear}</TableCell>
                      <TableCell className="max-w-xs truncate py-3 px-4">{fs.description || '-'}</TableCell>
                      <TableCell className="text-right py-3 px-4">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditFs(fs)}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => openDeleteFs(fs)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                currentPage={fsPage}
                totalPages={fsTotalPages}
                onPageChange={setFsPage}
                totalItems={feeStructures.length}
                itemsPerPage={ITEMS_PER_PAGE}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fee Payments */}
        <TabsContent value="payments" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder={t('finances.filterByStatus')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('finances.allStatus')}</SelectItem>
                <SelectItem value="Paid">{t('common.paid')}</SelectItem>
                <SelectItem value="Pending">{t('common.pending')}</SelectItem>
                <SelectItem value="Overdue">{t('common.overdue')}</SelectItem>
                <SelectItem value="Partial">{t('common.partial')}</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={openAddFp} className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-md shadow-emerald-500/20"><Plus className="w-4 h-4 mr-2" /> {t('finances.recordPayment')}</Button>
            <Button variant="outline" onClick={() => exportToCSV(filteredPayments.map((fp) => ({ Student: fp.student ? `${fp.student.firstName} ${fp.student.lastName}` : '-', 'Fee Type': fp.feeType, Amount: fp.amount, Date: fp.paymentDate || '', Method: fp.paymentMethod, Status: fp.status })), 'fee-payments')} disabled={filteredPayments.length === 0}>
              <Download className="w-4 h-4 mr-2" /> {t('common.exportCSV')}
            </Button>
          </div>

          <Card className="border border-border/50 shadow-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 border-b-2 border-border"><TableHead className="py-3 px-4">{t('students.title')}</TableHead><TableHead className="py-3 px-4">{t('finances.feeType')}</TableHead><TableHead className="py-3 px-4">{t('common.amount')}</TableHead><TableHead className="py-3 px-4">{t('common.date')}</TableHead><TableHead className="py-3 px-4">{t('common.method')}</TableHead><TableHead className="py-3 px-4">{t('common.status')}</TableHead><TableHead className="py-3 px-4 text-right">{t('common.actions')}</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedFp.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{t('finances.noPaymentsFound')}</TableCell></TableRow>
                  ) : paginatedFp.map((fp, idx) => (
                    <TableRow key={fp.id} className={`hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors duration-150 ${idx % 2 === 0 ? '' : 'bg-muted/20 dark:bg-muted/10'}`}>
                      <TableCell className="font-medium py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center"><DollarSign className="w-4 h-4 text-emerald-600" /></div>
                          {fp.student ? `${fp.student.firstName} ${fp.student.lastName}` : '-'}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">{translateFeeType(fp.feeType)}</TableCell>
                      <TableCell className="py-3 px-4">${fp.amount.toLocaleString()}</TableCell>
                      <TableCell className="py-3 px-4">{fp.paymentDate || '-'}</TableCell>
                      <TableCell className="py-3 px-4">{translatePaymentMethod(fp.paymentMethod)}</TableCell>
                      <TableCell className="py-3 px-4"><Badge className={`rounded-full px-3 py-0.5 font-semibold text-xs border ${statusColor[fp.status] || ''}`}>{translateStatus(fp.status)}</Badge></TableCell>
                      <TableCell className="text-right py-3 px-4">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditFp(fp)}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => openDeleteFp(fp)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                currentPage={fpPage}
                totalPages={fpTotalPages}
                onPageChange={setFpPage}
                totalItems={filteredPayments.length}
                itemsPerPage={ITEMS_PER_PAGE}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overdue Tab */}
        <TabsContent value="overdue" className="space-y-4">
          {overduePayments.length > 0 ? (
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      {t('finances.overdueFeePayments')}
                    </CardTitle>
                    <CardDescription>
                      {overduePayments.length} {t('finances.overduePaymentsDescription')} ${overduePayments.reduce((s, p) => s + p.amount, 0).toLocaleString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        setReminderSent(true)
                        toast({ title: t('finances.remindersSent'), description: `Payment reminders sent for ${overduePayments.length} overdue fee(s) (simulated)` })
                        setTimeout(() => setReminderSent(false), 3000)
                      }}
                      disabled={reminderSent}
                    >
                      <Send className="w-4 h-4 mr-1" /> {reminderSent ? t('common.sent') : t('common.sendReminders')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-amber-600 border-amber-300 hover:bg-amber-50"
                      onClick={async () => {
                        setMarkOverdueLoading(true)
                        try {
                          const res = await fetch('/api/overdue-alerts?action=mark-overdue')
                          if (res.ok) {
                            const data = await res.json()
                            toast({ title: t('finances.markAsOverdue'), description: data.message })
                            fetchData()
                            fetchOverdueData()
                          }
                        } catch { /* ignore */ }
                        finally { setMarkOverdueLoading(false) }
                      }}
                      disabled={markOverdueLoading}
                    >
                      <AlertTriangle className="w-4 h-4 mr-1" /> {markOverdueLoading ? t('common.marking') : t('common.markAllOverdue')}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-red-100/50">
                      <TableHead className="py-2 px-3 w-10">
                        <Checkbox
                          checked={overduePayments.length > 0 && overduePayments.every((o) => selectedOverdueIds.has(o.id))}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedOverdueIds(new Set(overduePayments.map((o) => o.id)))
                            else setSelectedOverdueIds(new Set())
                          }}
                        />
                      </TableHead>
                      <TableHead className="py-2 px-3">{t('common.name')}</TableHead>
                      <TableHead className="py-2 px-3">{t('finances.feeType')}</TableHead>
                      <TableHead className="py-2 px-3">{t('common.amount')}</TableHead>
                      <TableHead className="py-2 px-3">{t('finances.daysOverdue')}</TableHead>
                      <TableHead className="py-2 px-3 text-right">{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overduePayments.map((o) => (
                      <TableRow key={o.id} className={`hover:bg-red-50/50 ${selectedOverdueIds.has(o.id) ? 'bg-red-50/70' : ''}`}>
                        <TableCell className="py-2 px-3">
                          <Checkbox
                            checked={selectedOverdueIds.has(o.id)}
                            onCheckedChange={(checked) => {
                              setSelectedOverdueIds((prev) => {
                                const next = new Set(prev)
                                if (checked) next.add(o.id)
                                else next.delete(o.id)
                                return next
                              })
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium py-2 px-3">{o.studentName}</TableCell>
                        <TableCell className="py-2 px-3">{o.feeType}</TableCell>
                        <TableCell className="py-2 px-3">${o.amount.toLocaleString()}</TableCell>
                        <TableCell className="py-2 px-3">
                          <Badge className="rounded-full px-2 py-0.5 text-xs bg-red-100 text-red-700">
                            {o.daysOverdue} {o.daysOverdue !== 1 ? t('finances.days') : t('finances.day')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right py-2 px-3">
                          <Button variant="outline" size="sm" className="text-amber-600 border-amber-300 hover:bg-amber-50 h-7 text-xs" onClick={async () => {
                            try {
                              const res = await fetch(`/api/overdue-alerts?action=send-reminder&paymentId=${o.id}`)
                              if (res.ok) { toast({ title: t('finances.remindersSent'), description: `Reminder sent to ${o.studentName} (simulated)` }) }
                            } catch { /* ignore */ }
                          }}><Send className="w-3 h-3 mr-1" /> {t('finances.remind')}</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {selectedOverdueIds.size > 0 && (
                  <div className="flex items-center gap-3 m-3 pt-3 border-t border-red-200">
                    <CheckCircle2 className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-700">{selectedOverdueIds.size} {t('common.selected')}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-auto text-amber-600 border-amber-300 hover:bg-amber-50"
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/overdue-alerts', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ paymentIds: Array.from(selectedOverdueIds), status: 'Overdue' }),
                          })
                          if (res.ok) {
                            const data = await res.json()
                            toast({ title: t('finances.statusUpdated'), description: data.message })
                            setSelectedOverdueIds(new Set())
                            fetchData()
                            fetchOverdueData()
                          }
                        } catch { /* ignore */ }
                      }}
                    >
                      <AlertTriangle className="w-4 h-4 mr-1" /> {t('finances.markAsOverdue')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-border/50 shadow-card">
              <CardContent className="py-12">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-muted-foreground text-sm">{t('finances.noPaymentsFound')}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Fee Structure Dialog */}
      <Dialog open={fsDialogOpen} onOpenChange={setFsDialogOpen}>
        <DialogContent className="dialog-accent-top">
          <DialogHeader><DialogTitle>{fsIsEdit ? t('common.edit') : t('finances.addFeeStructure')}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>{t('classes.title')} *</Label><Select value={fsForm.classId} onValueChange={(v) => setFsForm({ ...fsForm, classId: v })}><SelectTrigger><SelectValue placeholder={t('attendance.selectClass')} /></SelectTrigger><SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} - {c.section}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t('finances.feeType')} *</Label><Select value={fsForm.feeType} onValueChange={(v) => setFsForm({ ...fsForm, feeType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Tuition">{t('finances.tuition')}</SelectItem><SelectItem value="Inscription">{t('finances.inscription')}</SelectItem><SelectItem value="Scolarité">{t('finances.scolarite')}</SelectItem><SelectItem value="Lab Fee">{t('finances.labFee')}</SelectItem><SelectItem value="Library Fee">{t('finances.libraryFee')}</SelectItem><SelectItem value="Transport">{t('finances.transport')}</SelectItem><SelectItem value="Sports">{t('finances.transport')}</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>{t('common.amount')} *</Label><Input type="number" value={fsForm.amount} onChange={(e) => setFsForm({ ...fsForm, amount: parseFloat(e.target.value) || 0 })} /></div>
            </div>
            <div className="space-y-2"><Label>{t('finances.academicYear')}</Label><Input value={fsForm.academicYear} onChange={(e) => setFsForm({ ...fsForm, academicYear: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t('common.description')}</Label><Textarea value={fsForm.description} onChange={(e) => setFsForm({ ...fsForm, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFsDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={saveFs} disabled={fsSaving} className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-md shadow-emerald-500/20 gap-2">{fsSaving && <Loader2 className="w-4 h-4 animate-spin" />}{fsSaving ? t('common.saving') : t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fee Payment Dialog */}
      <Dialog open={fpDialogOpen} onOpenChange={setFpDialogOpen}>
        <DialogContent className="max-w-lg dialog-accent-top max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{fpIsEdit ? t('common.edit') : t('finances.recordPayment')}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>{t('students.title')} *</Label><Select value={fpForm.studentId} onValueChange={(v) => setFpForm({ ...fpForm, studentId: v })}><SelectTrigger><SelectValue placeholder={t('students.title')} /></SelectTrigger><SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t('finances.feeType')} *</Label><Select value={fpForm.feeType} onValueChange={(v) => setFpForm({ ...fpForm, feeType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Tuition">{t('finances.tuition')}</SelectItem><SelectItem value="Inscription">{t('finances.inscription')}</SelectItem><SelectItem value="Scolarité">{t('finances.scolarite')}</SelectItem><SelectItem value="Lab Fee">{t('finances.labFee')}</SelectItem><SelectItem value="Library Fee">{t('finances.libraryFee')}</SelectItem><SelectItem value="Transport">{t('finances.transport')}</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>{t('common.amount')} *</Label><Input type="number" value={fpForm.amount} onChange={(e) => setFpForm({ ...fpForm, amount: parseFloat(e.target.value) || 0 })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t('finances.paymentDate')}</Label><Input type="date" value={fpForm.paymentDate} onChange={(e) => setFpForm({ ...fpForm, paymentDate: e.target.value })} /></div>
              <div className="space-y-2"><Label>{t('finances.paymentMethod')}</Label><Select value={fpForm.paymentMethod} onValueChange={(v) => setFpForm({ ...fpForm, paymentMethod: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Cash">{t('common.cash')}</SelectItem><SelectItem value="Bank Transfer">{t('common.bankTransfer')}</SelectItem><SelectItem value="Online">{t('common.online')}</SelectItem><SelectItem value="Check">{t('common.check')}</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t('common.status')}</Label><Select value={fpForm.status} onValueChange={(v) => setFpForm({ ...fpForm, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Paid">{t('common.paid')}</SelectItem><SelectItem value="Pending">{t('common.pending')}</SelectItem><SelectItem value="Overdue">{t('common.overdue')}</SelectItem><SelectItem value="Partial">{t('common.partial')}</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>{t('finances.receiptNumber')}</Label><Input value={fpForm.receiptNumber} onChange={(e) => setFpForm({ ...fpForm, receiptNumber: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>{t('finances.academicYear')}</Label><Input value={fpForm.academicYear} onChange={(e) => setFpForm({ ...fpForm, academicYear: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t('common.remarks')}</Label><Textarea value={fpForm.remarks} onChange={(e) => setFpForm({ ...fpForm, remarks: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFpDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={saveFp} disabled={fpSaving} className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-md shadow-emerald-500/20 gap-2">{fpSaving && <Loader2 className="w-4 h-4 animate-spin" />}{fpSaving ? t('common.saving') : t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Fee Structure Dialog */}
      <Dialog open={fsDeleteOpen} onOpenChange={setFsDeleteOpen}>
        <DialogContent className="dialog-accent-top">
          <DialogHeader><DialogTitle>{t('common.delete')} {t('finances.feeStructures')}</DialogTitle><DialogDescription>Are you sure? This cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setFsDeleteOpen(false)}>{t('common.cancel')}</Button><Button variant="destructive" onClick={deleteFs}>{t('common.delete')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Payment Dialog */}
      <Dialog open={fpDeleteOpen} onOpenChange={setFpDeleteOpen}>
        <DialogContent className="dialog-accent-top">
          <DialogHeader><DialogTitle>{t('common.delete')} {t('finances.feePayments')}</DialogTitle><DialogDescription>Are you sure? This cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setFpDeleteOpen(false)}>{t('common.cancel')}</Button><Button variant="destructive" onClick={deleteFp}>{t('common.delete')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
