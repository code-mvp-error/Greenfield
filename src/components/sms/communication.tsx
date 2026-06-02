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
import { Plus, Trash2, Megaphone, Mail, MailOpen, Eye, Calendar as CalendarIcon, User, Tag, Users as UsersIcon, ShieldCheck, ChevronLeft, ChevronRight, Pencil, Send, Loader2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Pagination } from '@/components/sms/pagination'
import { AnnouncementFormSchema, MessageFormSchema, EventFormSchema, validateForm } from '@/lib/validations'
import type { FormErrors } from '@/lib/validations'
import { useTranslation } from '@/lib/i18n'

interface Announcement {
  id: string
  title: string
  content: string
  targetAudience: string
  priority: string
  authorName: string
  isActive: boolean
  createdAt: string
}

interface Message {
  id: string
  senderName: string
  senderRole: string
  receiverName: string
  receiverRole: string
  subject: string
  content: string
  isRead: boolean
  createdAt: string
}

interface SchoolEvent {
  id: string
  title: string
  description: string | null
  eventType: string
  startDate: string
  endDate: string | null
  color: string
}

const emptyAnnouncement: Omit<Announcement, 'id' | 'createdAt'> = {
  title: '', content: '', targetAudience: 'All', priority: 'Normal', authorName: '', isActive: true,
}

const emptyMessage: Omit<Message, 'id' | 'createdAt' | 'isRead'> = {
  senderName: '', senderRole: 'Admin', receiverName: '', receiverRole: '', subject: '', content: '',
}

const emptyEvent: Omit<SchoolEvent, 'id'> = {
  title: '', description: '', eventType: 'event', startDate: new Date().toISOString().split('T')[0], endDate: null, color: '#059669',
}

const priorityColor: Record<string, string> = {
  Urgent: 'bg-red-100 text-red-700 border-red-200',
  High: 'bg-orange-100 text-orange-700 border-orange-200',
  Normal: 'bg-blue-100 text-blue-700 border-blue-200',
}

const targetColor: Record<string, string> = {
  All: 'bg-emerald-100 text-emerald-700',
  Students: 'bg-blue-100 text-blue-700',
  Teachers: 'bg-violet-100 text-violet-700',
  Parents: 'bg-amber-100 text-amber-700',
  Staff: 'bg-gray-100 text-gray-700',
}

const eventTypeColor: Record<string, string> = {
  exam: 'bg-red-100 text-red-700',
  holiday: 'bg-amber-100 text-amber-700',
  meeting: 'bg-blue-100 text-blue-700',
  event: 'bg-emerald-100 text-emerald-700',
  deadline: 'bg-violet-100 text-violet-700',
}

const eventTypeDotColor: Record<string, string> = {
  exam: 'bg-red-500',
  holiday: 'bg-amber-500',
  meeting: 'bg-blue-500',
  event: 'bg-emerald-500',
  deadline: 'bg-violet-500',
}

const ITEMS_PER_PAGE = 10

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function Communication() {
  const { toast } = useToast()
  const { t } = useTranslation()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [events, setEvents] = useState<SchoolEvent[]>([])
  const [loading, setLoading] = useState(true)

  // Announcement
  const [annDialogOpen, setAnnDialogOpen] = useState(false)
  const [annDeleteOpen, setAnnDeleteOpen] = useState(false)
  const [annViewOpen, setAnnViewOpen] = useState(false)
  const [selectedAnn, setSelectedAnn] = useState<Announcement | null>(null)
  const [annForm, setAnnForm] = useState(emptyAnnouncement)
  const [annSaving, setAnnSaving] = useState(false)
  const [annValidationErrors, setAnnValidationErrors] = useState<FormErrors>({})

  // Message
  const [msgDialogOpen, setMsgDialogOpen] = useState(false)
  const [msgDeleteOpen, setMsgDeleteOpen] = useState(false)
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null)
  const [msgForm, setMsgForm] = useState(emptyMessage)
  const [msgSaving, setMsgSaving] = useState(false)
  const [msgValidationErrors, setMsgValidationErrors] = useState<FormErrors>({})
  const [viewMsgOpen, setViewMsgOpen] = useState(false)

  // Calendar / Events
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [eventDeleteOpen, setEventDeleteOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<SchoolEvent | null>(null)
  const [eventForm, setEventForm] = useState(emptyEvent)
  const [eventIsEdit, setEventIsEdit] = useState(false)
  const [eventSaving, setEventSaving] = useState(false)
  const [eventValidationErrors, setEventValidationErrors] = useState<FormErrors>({})

  // Pagination
  const [annPage, setAnnPage] = useState(1)
  const [msgPage, setMsgPage] = useState(1)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const [aRes, mRes, eRes] = await Promise.all([fetch('/api/announcements'), fetch('/api/messages'), fetch('/api/events')])
      if (aRes.ok) setAnnouncements(await aRes.json())
      if (mRes.ok) setMessages(await mRes.json())
      if (eRes.ok) setEvents(await eRes.json())
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  // Announcement CRUD
  function openAddAnn() { setAnnForm(emptyAnnouncement); setAnnValidationErrors({}); setAnnDialogOpen(true) }

  async function saveAnn() {
    const result = validateForm(AnnouncementFormSchema, annForm)
    if (!result.success) {
      setAnnValidationErrors(result.errors)
      const errorCount = Object.keys(result.errors).length
      toast({ title: t('common.validationError'), description: `${errorCount} ${t('common.fieldsNeedAttention')}`, variant: 'destructive' })
      return
    }
    setAnnValidationErrors({})
    setAnnSaving(true)
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(annForm),
      })
      if (res.ok) { toast({ title: t('common.success'), description: t('communications.announcementCreated') }); setAnnDialogOpen(false); fetchData() }
      else { toast({ title: t('common.error'), description: t('communications.failedToCreateAnnouncement'), variant: 'destructive' }) }
    } catch { toast({ title: t('common.error'), description: t('common.networkError'), variant: 'destructive' }) }
    finally { setAnnSaving(false) }
  }

  function openViewAnn(a: Announcement) { setSelectedAnn(a); setAnnViewOpen(true) }

  function openDeleteAnn(a: Announcement) { setSelectedAnn(a); setAnnDeleteOpen(true) }

  async function deleteAnn() {
    try {
      const res = await fetch(`/api/announcements?id=${selectedAnn?.id}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: t('common.success'), description: t('communications.announcementDeleted') }); setAnnDeleteOpen(false); fetchData() }
    } catch { /* ignore */ }
  }

  // Message CRUD
  function openAddMsg() { setMsgForm(emptyMessage); setMsgValidationErrors({}); setMsgDialogOpen(true) }

  async function saveMsg() {
    const result = validateForm(MessageFormSchema, msgForm)
    if (!result.success) {
      setMsgValidationErrors(result.errors)
      const errorCount = Object.keys(result.errors).length
      toast({ title: t('common.validationError'), description: `${errorCount} ${t('common.fieldsNeedAttention')}`, variant: 'destructive' })
      return
    }
    setMsgValidationErrors({})
    setMsgSaving(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msgForm),
      })
      if (res.ok) { toast({ title: t('common.success'), description: t('communications.messageSent') }); setMsgDialogOpen(false); fetchData() }
      else { toast({ title: t('common.error'), description: t('communications.failedToSendMessage'), variant: 'destructive' }) }
    } catch { toast({ title: t('common.error'), description: t('common.networkError'), variant: 'destructive' }) }
    finally { setMsgSaving(false) }
  }

  function openDeleteMsg(m: Message) { setSelectedMsg(m); setMsgDeleteOpen(true) }

  async function deleteMsg() {
    try {
      const res = await fetch(`/api/messages?id=${selectedMsg?.id}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: t('common.success'), description: t('communications.messageDeleted') }); setMsgDeleteOpen(false); fetchData() }
    } catch { /* ignore */ }
  }

  async function toggleRead(m: Message) {
    try {
      const res = await fetch(`/api/messages?id=${m.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: !m.isRead }),
      })
      if (res.ok) { fetchData() }
    } catch { /* ignore */ }
  }

  function openViewMsg(m: Message) {
    setSelectedMsg(m)
    setViewMsgOpen(true)
    if (!m.isRead) toggleRead(m)
  }

  // Event CRUD
  function openAddEvent(date?: string) {
    setEventForm({ ...emptyEvent, startDate: date || new Date().toISOString().split('T')[0] })
    setEventIsEdit(false)
    setEventValidationErrors({})
    setEventDialogOpen(true)
  }

  function openEditEvent(e: SchoolEvent) {
    setEventForm({ title: e.title, description: e.description || '', eventType: e.eventType, startDate: e.startDate, endDate: e.endDate || null, color: e.color })
    setSelectedEvent(e)
    setEventIsEdit(true)
    setEventValidationErrors({})
    setEventDialogOpen(true)
  }

  function openDeleteEvent(e: SchoolEvent) {
    setSelectedEvent(e)
    setEventDeleteOpen(true)
  }

  async function saveEvent() {
    const result = validateForm(EventFormSchema, eventForm)
    if (!result.success) {
      setEventValidationErrors(result.errors)
      const firstError = Object.values(result.errors)[0]
      toast({ title: t('common.validationError'), description: firstError, variant: 'destructive' })
      return
    }
    setEventValidationErrors({})
    setEventSaving(true)
    try {
      const body = { ...eventForm, endDate: eventForm.endDate || null, description: eventForm.description || null }
      const res = eventIsEdit
        ? await fetch(`/api/events?id=${selectedEvent?.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        toast({ title: t('common.success'), description: eventIsEdit ? t('calendar.eventUpdated') : t('calendar.eventCreated') })
        setEventDialogOpen(false)
        fetchData()
      } else {
        toast({ title: t('common.error'), description: t('common.failedToSave'), variant: 'destructive' })
      }
    } catch {
      toast({ title: t('common.error'), description: t('common.networkError'), variant: 'destructive' })
    } finally { setEventSaving(false) }
  }

  async function deleteEvent() {
    try {
      const res = await fetch(`/api/events?id=${selectedEvent?.id}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: t('common.success'), description: t('calendar.eventDeleted') }); setEventDeleteOpen(false); fetchData() }
    } catch { /* ignore */ }
  }

  // Calendar helpers
  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1) }
    else { setCurrentMonth(currentMonth - 1) }
    setSelectedDate(null)
  }

  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1) }
    else { setCurrentMonth(currentMonth + 1) }
    setSelectedDate(null)
  }

  function getCalendarDays(): (number | null)[] {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const days: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    return days
  }

  function getEventsForDate(dateStr: string): SchoolEvent[] {
    return events.filter((e) => {
      if (e.startDate === dateStr) return true
      if (e.endDate && e.startDate <= dateStr && e.endDate >= dateStr) return true
      return false
    })
  }

  function formatDateStr(year: number, month: number, day: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(0, '0').padStart(2, '0')}`
  }

  const today = new Date()
  const todayStr = formatDateStr(today.getFullYear(), today.getMonth(), today.getDate())

  const calendarDays = getCalendarDays()
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

  const annTotalPages = Math.ceil(announcements.length / ITEMS_PER_PAGE)
  const paginatedAnnouncements = announcements.slice((annPage - 1) * ITEMS_PER_PAGE, annPage * ITEMS_PER_PAGE)

  const msgTotalPages = Math.ceil(messages.length / ITEMS_PER_PAGE)
  const paginatedMessages = messages.slice((msgPage - 1) * ITEMS_PER_PAGE, msgPage * ITEMS_PER_PAGE)

  // Translated priority labels
  const priorityLabel: Record<string, string> = {
    Normal: t('communications.normal'),
    High: t('communications.high'),
    Urgent: t('communications.urgent'),
  }

  // Translated target audience labels
  const targetLabel: Record<string, string> = {
    All: t('communications.all'),
    Students: t('communications.studentsOnly'),
    Teachers: t('communications.teachersOnly'),
    Parents: t('communications.parentsOnly'),
    Staff: t('communications.staffOnly'),
  }

  // Translated event type labels
  const eventTypeLabel: Record<string, string> = {
    exam: t('calendar.exam'),
    holiday: t('calendar.holiday'),
    meeting: t('calendar.meeting'),
    event: t('calendar.event'),
    deadline: t('calendar.deadline'),
  }

  if (loading) return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
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
            <Megaphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{t('communications.title')}</h2>
            <p className="text-muted-foreground text-sm">{t('communications.subtitle')}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="announcements">
        <TabsList>
          <TabsTrigger value="announcements"><Megaphone className="w-4 h-4 mr-2" />{t('communications.announcements')}</TabsTrigger>
          <TabsTrigger value="messages"><Mail className="w-4 h-4 mr-2" />{t('communications.messages')} ({messages.filter((m) => !m.isRead).length})</TabsTrigger>
          <TabsTrigger value="calendar"><CalendarIcon className="w-4 h-4 mr-2" />{t('sidebar.calendar')}</TabsTrigger>
        </TabsList>

        {/* Announcements */}
        <TabsContent value="announcements" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openAddAnn} className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-md shadow-emerald-500/20"><Plus className="w-4 h-4 mr-2" /> {t('communications.createAnnouncement')}</Button>
          </div>

          <Card className="border border-border/50 shadow-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 border-b-2 border-border"><TableHead className="py-3 px-4">{t('common.name')}</TableHead><TableHead className="py-3 px-4">{t('communications.targetAudience')}</TableHead><TableHead className="py-3 px-4">{t('communications.priority')}</TableHead><TableHead className="py-3 px-4">{t('common.date')}</TableHead><TableHead className="py-3 px-4">{t('common.status')}</TableHead><TableHead className="py-3 px-4 text-right">{t('common.actions')}</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAnnouncements.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t('communications.noAnnouncementsFound')}</TableCell></TableRow>
                  ) : paginatedAnnouncements.map((a, idx) => (
                    <TableRow key={a.id} className={`hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors duration-150 ${idx % 2 === 0 ? '' : 'bg-muted/20 dark:bg-muted/10'}`}>
                      <TableCell className="font-medium py-3 px-4">{a.title}</TableCell>
                      <TableCell className="py-3 px-4"><Badge className={`rounded-full px-3 py-0.5 font-semibold text-xs border ${targetColor[a.targetAudience] || ''}`}>{targetLabel[a.targetAudience] || a.targetAudience}</Badge></TableCell>
                      <TableCell className="py-3 px-4"><Badge className={`rounded-full px-3 py-0.5 font-semibold text-xs border ${priorityColor[a.priority] || ''}`}>{priorityLabel[a.priority] || a.priority}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground py-3 px-4">{new Date(a.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="py-3 px-4"><Badge className={`rounded-full px-3 py-0.5 font-semibold text-xs border ${a.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>{a.isActive ? t('common.active') : t('common.inactive')}</Badge></TableCell>
                      <TableCell className="text-right py-3 px-4">
                        <div className="flex justify-end gap-1">
                          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => openViewAnn(a)}><Eye className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent>{t('communications.viewDetails')}</TooltipContent></Tooltip>
                          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="text-destructive" onClick={() => openDeleteAnn(a)}><Trash2 className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent>{t('common.delete')}</TooltipContent></Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                currentPage={annPage}
                totalPages={annTotalPages}
                onPageChange={setAnnPage}
                totalItems={announcements.length}
                itemsPerPage={ITEMS_PER_PAGE}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages */}
        <TabsContent value="messages" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openAddMsg} className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-md shadow-emerald-500/20"><Plus className="w-4 h-4 mr-2" /> {t('communications.composeMessage')}</Button>
          </div>

          <Card className="border border-border/50 shadow-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 border-b-2 border-border"><TableHead className="py-3 px-4 w-8"></TableHead><TableHead className="py-3 px-4">{t('communications.from')}</TableHead><TableHead className="py-3 px-4">{t('communications.to')}</TableHead><TableHead className="py-3 px-4">{t('communications.subject')}</TableHead><TableHead className="py-3 px-4">{t('common.date')}</TableHead><TableHead className="py-3 px-4 text-right">{t('common.actions')}</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMessages.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t('communications.noMessagesFound')}</TableCell></TableRow>
                  ) : paginatedMessages.map((m, idx) => (
                    <TableRow key={m.id} className={`hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors duration-150 ${idx % 2 === 0 ? '' : 'bg-muted/20 dark:bg-muted/10'} ${!m.isRead ? 'bg-emerald-50/50' : ''}`}>
                      <TableCell className="py-3 px-4">
                        {m.isRead ? <MailOpen className="w-4 h-4 text-muted-foreground" /> : <Mail className="w-4 h-4 text-emerald-600" />}
                      </TableCell>
                      <TableCell className="font-medium py-3 px-4">{m.senderName} <span className="text-muted-foreground text-xs">({m.senderRole})</span></TableCell>
                      <TableCell className="py-3 px-4">{m.receiverName} <span className="text-muted-foreground text-xs">({m.receiverRole})</span></TableCell>
                      <TableCell className="py-3 px-4">{m.subject || t('communications.noSubject')}</TableCell>
                      <TableCell className="text-sm text-muted-foreground py-3 px-4">{new Date(m.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right py-3 px-4">
                        <div className="flex justify-end gap-1">
                          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => openViewMsg(m)}><Eye className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent>{t('communications.viewMessage')}</TooltipContent></Tooltip>
                          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => toggleRead(m)}>{m.isRead ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4" />}</Button></TooltipTrigger><TooltipContent>{m.isRead ? t('communications.markAsUnread') : t('communications.markAsRead')}</TooltipContent></Tooltip>
                          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="text-destructive" onClick={() => openDeleteMsg(m)}><Trash2 className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent>{t('common.delete')}</TooltipContent></Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                currentPage={msgPage}
                totalPages={msgTotalPages}
                onPageChange={setMsgPage}
                totalItems={messages.length}
                itemsPerPage={ITEMS_PER_PAGE}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openAddEvent()} className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-md shadow-emerald-500/20"><Plus className="w-4 h-4 mr-2" /> {t('calendar.addEvent')}</Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Calendar Grid */}
            <Card className="lg:col-span-2 border border-border/50 shadow-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
                  <CardTitle className="text-lg">{MONTHS[currentMonth]} {currentYear}</CardTitle>
                  <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DAYS.map((d) => (
                    <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
                  ))}
                </div>
                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, idx) => {
                    if (day === null) return <div key={`empty-${idx}`} className="aspect-square" />
                    const dateStr = formatDateStr(currentYear, currentMonth, day)
                    const dayEvents = getEventsForDate(dateStr)
                    const isToday = dateStr === todayStr
                    const isSelected = dateStr === selectedDate
                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`aspect-square rounded-lg text-sm font-medium relative flex flex-col items-center justify-center transition-colors duration-150 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 ${isSelected ? 'bg-emerald-100 dark:bg-emerald-900/40 ring-2 ring-emerald-500' : isToday ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'hover:bg-muted/50'}`}
                      >
                        <span className={isToday && !isSelected ? 'text-white font-bold' : ''}>{day}</span>
                        {dayEvents.length > 0 && (
                          <div className="flex gap-0.5 mt-0.5 absolute bottom-1">
                            {dayEvents.slice(0, 3).map((e, i) => (
                              <span key={i} className={`w-1.5 h-1.5 rounded-full ${eventTypeDotColor[e.eventType] || 'bg-emerald-500'}`} />
                            ))}
                            {dayEvents.length > 3 && <span className="text-[8px] text-muted-foreground leading-none">+</span>}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Selected Date Events */}
            <Card className="border border-border/50 shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {selectedDate
                    ? new Date(selectedDate + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                    : t('communications.selectDate')}
                </CardTitle>
                {selectedDate && (
                  <Button variant="outline" size="sm" className="mt-1" onClick={() => openAddEvent(selectedDate)}>
                    <Plus className="w-3 h-3 mr-1" /> {t('calendar.addEvent')}
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {!selectedDate ? (
                  <p className="text-sm text-muted-foreground text-center py-8">{t('communications.clickDateToView')}</p>
                ) : selectedDateEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">{t('communications.noEventsOnDate')}</p>
                ) : (
                  <div className="space-y-3">
                    {selectedDateEvents.map((e) => (
                      <div key={e.id} className="p-3 rounded-lg border border-border/50 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: e.color || '#059669' }} />
                              <p className="font-medium text-sm truncate">{e.title}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={`rounded-full px-2 py-0.5 text-[10px] ${eventTypeColor[e.eventType] || ''}`}>{eventTypeLabel[e.eventType] || e.eventType}</Badge>
                              {e.endDate && e.endDate !== e.startDate && (
                                <span className="text-[10px] text-muted-foreground">{t('communications.to')} {e.endDate}</span>
                              )}
                            </div>
                            {e.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{e.description}</p>}
                          </div>
                          <div className="flex gap-0.5 shrink-0">
                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditEvent(e)}><Pencil className="w-3 h-3" /></Button></TooltipTrigger><TooltipContent>{t('common.edit')}</TooltipContent></Tooltip>
                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => openDeleteEvent(e)}><Trash2 className="w-3 h-3" /></Button></TooltipTrigger><TooltipContent>{t('common.delete')}</TooltipContent></Tooltip>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* All Upcoming Events List */}
          {events.length > 0 && (
            <Card className="border border-border/50 shadow-card">
              <CardHeader>
                <CardTitle className="text-base">{t('calendar.allEvents')}</CardTitle>
                <CardDescription>{t('communications.upcomingAndRecent')}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 border-b-2 border-border">
                        <TableHead className="py-3 px-4">{t('common.name')}</TableHead>
                        <TableHead className="py-3 px-4">{t('calendar.eventType')}</TableHead>
                        <TableHead className="py-3 px-4">{t('calendar.startDate')}</TableHead>
                        <TableHead className="py-3 px-4">{t('calendar.endDate')}</TableHead>
                        <TableHead className="py-3 px-4 text-right">{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events
                        .sort((a, b) => a.startDate.localeCompare(b.startDate))
                        .map((e, idx) => (
                          <TableRow key={e.id} className={`hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors duration-150 ${idx % 2 === 0 ? '' : 'bg-muted/20 dark:bg-muted/10'}`}>
                            <TableCell className="font-medium py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: e.color || '#059669' }} />
                                {e.title}
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4"><Badge className={`rounded-full px-2.5 py-0.5 font-semibold text-xs ${eventTypeColor[e.eventType] || ''}`}>{eventTypeLabel[e.eventType] || e.eventType}</Badge></TableCell>
                            <TableCell className="py-3 px-4 text-sm">{new Date(e.startDate + 'T12:00:00').toLocaleDateString()}</TableCell>
                            <TableCell className="py-3 px-4 text-sm text-muted-foreground">{e.endDate ? new Date(e.endDate + 'T12:00:00').toLocaleDateString() : '-'}</TableCell>
                            <TableCell className="text-right py-3 px-4">
                              <div className="flex justify-end gap-1">
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => openEditEvent(e)}><Pencil className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent>{t('common.edit')}</TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="text-destructive" onClick={() => openDeleteEvent(e)}><Trash2 className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent>{t('common.delete')}</TooltipContent></Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Announcement Dialog */}
      <Dialog open={annDialogOpen} onOpenChange={setAnnDialogOpen}>
        <DialogContent className="max-w-lg dialog-accent-top">
          <DialogHeader><DialogTitle>{t('communications.createAnnouncement')}</DialogTitle><DialogDescription>{t('communications.createAnnouncementDesc')}</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>{t('common.name')} *</Label><Input value={annForm.title} onChange={(e) => { setAnnForm({ ...annForm, title: e.target.value }); if (annValidationErrors.title) setAnnValidationErrors({ ...annValidationErrors, title: '' }) }} />{annValidationErrors.title && <p className="text-xs text-red-500">{annValidationErrors.title}</p>}</div>
            <div className="space-y-2"><Label>{t('communications.content')} *</Label><Textarea rows={4} value={annForm.content} onChange={(e) => { setAnnForm({ ...annForm, content: e.target.value }); if (annValidationErrors.content) setAnnValidationErrors({ ...annValidationErrors, content: '' }) }} />{annValidationErrors.content && <p className="text-xs text-red-500">{annValidationErrors.content}</p>}</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t('communications.targetAudience')} *</Label><Select value={annForm.targetAudience} onValueChange={(v) => { setAnnForm({ ...annForm, targetAudience: v }); if (annValidationErrors.targetAudience) setAnnValidationErrors({ ...annValidationErrors, targetAudience: '' }) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All">{t('communications.all')}</SelectItem><SelectItem value="Students">{t('communications.studentsOnly')}</SelectItem><SelectItem value="Teachers">{t('communications.teachersOnly')}</SelectItem><SelectItem value="Parents">{t('communications.parentsOnly')}</SelectItem><SelectItem value="Staff">{t('communications.staffOnly')}</SelectItem></SelectContent></Select>{annValidationErrors.targetAudience && <p className="text-xs text-red-500">{annValidationErrors.targetAudience}</p>}</div>
              <div className="space-y-2"><Label>{t('communications.priority')}</Label><Select value={annForm.priority} onValueChange={(v) => setAnnForm({ ...annForm, priority: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Normal">{t('communications.normal')}</SelectItem><SelectItem value="High">{t('communications.high')}</SelectItem><SelectItem value="Urgent">{t('communications.urgent')}</SelectItem></SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>{t('communications.author')}</Label><Input value={annForm.authorName} onChange={(e) => setAnnForm({ ...annForm, authorName: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnnDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={saveAnn} disabled={annSaving} className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-md shadow-emerald-500/20 gap-2">{annSaving && <Loader2 className="w-4 h-4 animate-spin" />}{annSaving ? t('common.saving') : t('common.create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compose Message Dialog */}
      <Dialog open={msgDialogOpen} onOpenChange={setMsgDialogOpen}>
        <DialogContent className="max-w-lg dialog-accent-top">
          <DialogHeader><DialogTitle>{t('communications.composeMessage')}</DialogTitle><DialogDescription>{t('communications.composeMessageDesc')}</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t('communications.sender')} *</Label><Input value={msgForm.senderName} onChange={(e) => { setMsgForm({ ...msgForm, senderName: e.target.value }); if (msgValidationErrors.senderName) setMsgValidationErrors({ ...msgValidationErrors, senderName: '' }) }} />{msgValidationErrors.senderName && <p className="text-xs text-red-500">{msgValidationErrors.senderName}</p>}</div>
              <div className="space-y-2"><Label>{t('communications.senderRole')}</Label><Select value={msgForm.senderRole} onValueChange={(v) => setMsgForm({ ...msgForm, senderRole: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Admin">Admin</SelectItem><SelectItem value="Teacher">{t('sidebar.teachers')}</SelectItem><SelectItem value="Staff">{t('sidebar.staff')}</SelectItem><SelectItem value="Parent">{t('communications.parentsOnly')}</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t('communications.receiver')} *</Label><Input value={msgForm.receiverName} onChange={(e) => { setMsgForm({ ...msgForm, receiverName: e.target.value }); if (msgValidationErrors.receiverName) setMsgValidationErrors({ ...msgValidationErrors, receiverName: '' }) }} />{msgValidationErrors.receiverName && <p className="text-xs text-red-500">{msgValidationErrors.receiverName}</p>}</div>
              <div className="space-y-2"><Label>{t('communications.receiverRole')}</Label><Select value={msgForm.receiverRole} onValueChange={(v) => setMsgForm({ ...msgForm, receiverRole: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Admin">Admin</SelectItem><SelectItem value="Teacher">{t('sidebar.teachers')}</SelectItem><SelectItem value="Student">{t('sidebar.students')}</SelectItem><SelectItem value="Parent">{t('communications.parentsOnly')}</SelectItem><SelectItem value="Staff">{t('sidebar.staff')}</SelectItem></SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>{t('communications.subject')} *</Label><Input value={msgForm.subject} onChange={(e) => { setMsgForm({ ...msgForm, subject: e.target.value }); if (msgValidationErrors.subject) setMsgValidationErrors({ ...msgValidationErrors, subject: '' }) }} />{msgValidationErrors.subject && <p className="text-xs text-red-500">{msgValidationErrors.subject}</p>}</div>
            <div className="space-y-2"><Label>{t('communications.content')} *</Label><Textarea rows={4} value={msgForm.content} onChange={(e) => { setMsgForm({ ...msgForm, content: e.target.value }); if (msgValidationErrors.content) setMsgValidationErrors({ ...msgValidationErrors, content: '' }) }} />{msgValidationErrors.content && <p className="text-xs text-red-500">{msgValidationErrors.content}</p>}</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMsgDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={saveMsg} disabled={msgSaving} className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-md shadow-emerald-500/20 gap-2">{msgSaving && <Loader2 className="w-4 h-4 animate-spin" />}{msgSaving ? t('communications.sending') : t('communications.sendBtn')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Event Dialog */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="max-w-lg dialog-accent-top">
          <DialogHeader>
            <DialogTitle>{eventIsEdit ? t('calendar.editEvent') : t('calendar.addEvent')}</DialogTitle>
            <DialogDescription>{eventIsEdit ? t('communications.updateEventDetails') : t('communications.createNewEvent')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('common.name')} <span className="text-red-500">*</span></Label>
              <Input value={eventForm.title} onChange={(e) => { setEventForm({ ...eventForm, title: e.target.value }); if (eventValidationErrors.title) setEventValidationErrors({ ...eventValidationErrors, title: '' }) }} placeholder={t('communications.eventTitle')} />
              {eventValidationErrors.title && <p className="text-xs text-red-500">{eventValidationErrors.title}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('common.description')}</Label>
              <Textarea rows={3} value={eventForm.description || ''} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} placeholder={t('communications.eventDescription')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('calendar.eventType')} <span className="text-red-500">*</span></Label>
                <Select value={eventForm.eventType} onValueChange={(v) => { setEventForm({ ...eventForm, eventType: v }); if (eventValidationErrors.eventType) setEventValidationErrors({ ...eventValidationErrors, eventType: '' }) }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exam">{t('calendar.exam')}</SelectItem>
                    <SelectItem value="holiday">{t('calendar.holiday')}</SelectItem>
                    <SelectItem value="meeting">{t('calendar.meeting')}</SelectItem>
                    <SelectItem value="event">{t('calendar.event')}</SelectItem>
                    <SelectItem value="deadline">{t('calendar.deadline')}</SelectItem>
                  </SelectContent>
                </Select>
                {eventValidationErrors.eventType && <p className="text-xs text-red-500">{eventValidationErrors.eventType}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('calendar.color')}</Label>
                <div className="flex items-center gap-2">
                  <Input type="color" value={eventForm.color || '#059669'} onChange={(e) => setEventForm({ ...eventForm, color: e.target.value })} className="w-10 h-10 p-1 rounded cursor-pointer" />
                  <span className="text-sm text-muted-foreground">{eventForm.color || '#059669'}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('calendar.startDate')} <span className="text-red-500">*</span></Label>
                <Input type="date" value={eventForm.startDate} onChange={(e) => { setEventForm({ ...eventForm, startDate: e.target.value }); if (eventValidationErrors.startDate) setEventValidationErrors({ ...eventValidationErrors, startDate: '' }) }} />
                {eventValidationErrors.startDate && <p className="text-xs text-red-500">{eventValidationErrors.startDate}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('calendar.endDate')}</Label>
                <Input type="date" value={eventForm.endDate || ''} onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value || null })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={saveEvent} disabled={eventSaving} className="bg-emerald-600 hover:bg-emerald-700">{eventSaving ? t('common.saving') : eventIsEdit ? t('common.save') : t('common.create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Event Dialog */}
      <Dialog open={eventDeleteOpen} onOpenChange={setEventDeleteOpen}>
        <DialogContent className="dialog-accent-top">
          <DialogHeader><DialogTitle>{t('communications.deleteEvent')}</DialogTitle><DialogDescription>{t('communications.deleteEventConfirm')}</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventDeleteOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={deleteEvent}>{t('common.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Message Dialog */}
      <Dialog open={viewMsgOpen} onOpenChange={setViewMsgOpen}>
        <DialogContent className="max-w-lg dialog-accent-top">
          <DialogHeader><DialogTitle>{selectedMsg?.subject || t('communications.noSubject')}</DialogTitle></DialogHeader>
          {selectedMsg && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">{t('communications.from')}:</span> {selectedMsg.senderName} ({selectedMsg.senderRole})</div>
                <div><span className="text-muted-foreground">{t('communications.to')}:</span> {selectedMsg.receiverName} ({selectedMsg.receiverRole})</div>
                <div className="col-span-2"><span className="text-muted-foreground">{t('common.date')}:</span> {new Date(selectedMsg.createdAt).toLocaleString()}</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap">{selectedMsg.content}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Announcement Dialog */}
      <Dialog open={annViewOpen} onOpenChange={setAnnViewOpen}>
        <DialogContent className="max-w-lg dialog-accent-top">
          <DialogHeader>
            <DialogTitle className="text-lg">{selectedAnn?.title}</DialogTitle>
            <DialogDescription>{t('communications.announcementDetails')}</DialogDescription>
          </DialogHeader>
          {selectedAnn && (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <Badge className={`rounded-full px-3 py-1 font-medium text-xs ${priorityColor[selectedAnn.priority] || ''}`}>
                  <Tag className="w-3 h-3 mr-1" /> {priorityLabel[selectedAnn.priority] || selectedAnn.priority}
                </Badge>
                <Badge className={`rounded-full px-3 py-1 font-medium text-xs ${targetColor[selectedAnn.targetAudience] || ''}`}>
                  <UsersIcon className="w-3 h-3 mr-1" /> {targetLabel[selectedAnn.targetAudience] || selectedAnn.targetAudience}
                </Badge>
                <Badge className={`rounded-full px-3 py-1 font-medium text-xs ${selectedAnn.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                  <ShieldCheck className="w-3 h-3 mr-1" /> {selectedAnn.isActive ? t('common.active') : t('common.inactive')}
                </Badge>
              </div>

              <Separator />

              <div className="p-4 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap leading-relaxed">{selectedAnn.content}</div>

              <Separator />

              <div className="grid grid-cols-2 gap-3 text-sm">
                {selectedAnn.authorName && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t('communications.author')}:</span>
                    <span className="font-medium">{selectedAnn.authorName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('common.date')}:</span>
                  <span className="font-medium">{new Date(selectedAnn.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Announcement */}
      <Dialog open={annDeleteOpen} onOpenChange={setAnnDeleteOpen}>
        <DialogContent className="dialog-accent-top">
          <DialogHeader><DialogTitle>{t('communications.deleteAnnouncement')}</DialogTitle><DialogDescription>{t('communications.deleteAnnouncementConfirm')}</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setAnnDeleteOpen(false)}>{t('common.cancel')}</Button><Button variant="destructive" onClick={deleteAnn}>{t('common.delete')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Message */}
      <Dialog open={msgDeleteOpen} onOpenChange={setMsgDeleteOpen}>
        <DialogContent className="dialog-accent-top">
          <DialogHeader><DialogTitle>{t('communications.deleteMessage')}</DialogTitle><DialogDescription>{t('communications.deleteMessageConfirm')}</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setMsgDeleteOpen(false)}>{t('common.cancel')}</Button><Button variant="destructive" onClick={deleteMsg}>{t('common.delete')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
