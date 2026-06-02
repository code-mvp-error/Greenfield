'use client'

import { useEffect, useState, useMemo } from 'react'
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
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Calendar as CalendarIcon, X, Loader2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { EventFormSchema, validateForm } from '@/lib/validations'
import type { FormErrors } from '@/lib/validations'
import { useTranslation } from '@/lib/i18n'

interface SchoolEvent {
  id: string
  title: string
  description: string | null
  eventType: string
  startDate: string
  endDate: string | null
  color: string
}

const emptyEvent: Omit<SchoolEvent, 'id'> = {
  title: '', description: '', eventType: 'event',
  startDate: new Date().toISOString().split('T')[0],
  endDate: null, color: '#059669',
}

const eventTypeColors: Record<string, string> = {
  exam: '#dc2626',
  holiday: '#059669',
  meeting: '#d97706',
  event: '#2563eb',
  deadline: '#9333ea',
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function AcademicCalendar() {
  const { toast } = useToast()
  const { t } = useTranslation()
  const [events, setEvents] = useState<SchoolEvent[]>([])
  const [exams, setExams] = useState<Array<{ id: string; name: string; date: string; type: string }>>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<SchoolEvent | null>(null)
  const [form, setForm] = useState(emptyEvent)
  const [isEdit, setIsEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<FormErrors>({})

  // Translated event type labels
  const eventTypeLabels: Record<string, string> = {
    exam: t('calendar.exam'),
    holiday: t('calendar.holiday'),
    meeting: t('calendar.meeting'),
    event: t('calendar.event'),
    deadline: t('calendar.deadline'),
  }

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [eRes, exRes] = await Promise.all([fetch('/api/events'), fetch('/api/exams')])
      if (eRes.ok) setEvents(await eRes.json())
      if (exRes.ok) {
        const examData = await exRes.json()
        setExams(examData.map((e: { id: string; name: string; date: string; type: string }) => ({ id: e.id, name: e.name, date: e.date, type: e.type })))
      }
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  // Calendar grid computation
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date().toISOString().split('T')[0]

  // Map events to dates
  const eventsByDate = useMemo(() => {
    const map: Record<string, Array<SchoolEvent | { id: string; title: string; eventType: string; startDate: string; endDate: string | null; color: string; description: string | null }>> = {}
    // School events
    events.forEach((e) => {
      const start = new Date(e.startDate).toISOString().split('T')[0]
      const end = e.endDate ? new Date(e.endDate).toISOString().split('T')[0] : start
      let d = new Date(start)
      while (d.toISOString().split('T')[0] <= end) {
        const key = d.toISOString().split('T')[0]
        if (!map[key]) map[key] = []
        map[key].push(e)
        d.setDate(d.getDate() + 1)
      }
    })
    // Exam dates
    exams.forEach((e) => {
      if (e.date) {
        const key = e.date
        if (!map[key]) map[key] = []
        map[key].push({
          id: `exam-${e.id}`,
          title: e.name,
          eventType: 'exam',
          startDate: e.date,
          endDate: null,
          color: eventTypeColors.exam,
          description: `${e.type} ${t('calendar.exam').toLowerCase()}`,
        })
      }
    })
    return map
  }, [events, exams, t])

  // Days for the grid
  const calendarDays = useMemo(() => {
    const days: Array<{ date: string; day: number; isCurrentMonth: boolean }> = []
    // Previous month days
    const prevMonthDays = new Date(year, month, 0).getDate()
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i)
      days.push({ date: d.toISOString().split('T')[0], day: prevMonthDays - i, isCurrentMonth: false })
    }
    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i)
      days.push({ date: d.toISOString().split('T')[0], day: i, isCurrentMonth: true })
    }
    // Next month to fill grid
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i)
      days.push({ date: d.toISOString().split('T')[0], day: i, isCurrentMonth: false })
    }
    return days
  }, [year, month, firstDay, daysInMonth])

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  function goToday() {
    setCurrentDate(new Date())
  }

  function openAdd(date?: string) {
    setForm({ ...emptyEvent, startDate: date || new Date().toISOString().split('T')[0] })
    setIsEdit(false)
    setValidationErrors({})
    setDialogOpen(true)
  }

  function openEdit(e: SchoolEvent) {
    setForm({
      title: e.title,
      description: e.description || '',
      eventType: e.eventType,
      startDate: new Date(e.startDate).toISOString().split('T')[0],
      endDate: e.endDate ? new Date(e.endDate).toISOString().split('T')[0] : null,
      color: e.color,
    })
    setSelectedEvent(e)
    setIsEdit(true)
    setValidationErrors({})
    setDialogOpen(true)
  }

  function openDelete(e: SchoolEvent) {
    setSelectedEvent(e)
    setDeleteOpen(true)
  }

  async function handleSave() {
    const result = validateForm(EventFormSchema, form)
    if (!result.success) {
      setValidationErrors(result.errors)
      toast({ title: t('common.validationError'), description: t('common.fieldsNeedAttention'), variant: 'destructive' })
      return
    }
    setValidationErrors({})
    setSaving(true)
    try {
      const body = {
        ...form,
        startDate: new Date(form.startDate).toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      }
      const res = isEdit
        ? await fetch(`/api/events?id=${selectedEvent?.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        toast({ title: t('common.success'), description: isEdit ? t('calendar.eventUpdated') : t('calendar.eventCreated') })
        setDialogOpen(false)
        fetchData()
      } else {
        toast({ title: t('common.error'), description: t('common.failedToSave'), variant: 'destructive' })
      }
    } catch {
      toast({ title: t('common.error'), description: t('common.networkError'), variant: 'destructive' })
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/events?id=${selectedEvent?.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: t('common.success'), description: t('calendar.eventDeleted') })
        setDeleteOpen(false)
        fetchData()
      }
    } catch { /* ignore */ }
  }

  // Events for the selected date
  const selectedDateEvents = selectedDate ? (eventsByDate[selectedDate] || []) : []

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <CalendarIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{t('calendar.title')}</h2>
            <p className="text-muted-foreground text-sm">{t('calendar.subtitle')}</p>
          </div>
        </div>
        <Button onClick={() => openAdd()} className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-md shadow-emerald-500/20">
          <Plus className="w-4 h-4 mr-2" /> {t('calendar.addEvent')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <Card className="lg:col-span-2 border border-border/50 shadow-card rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-emerald-600" />
                {currentDate.toLocaleDateString('en', { month: 'long', year: 'numeric' })}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={prevMonth} className="hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors"><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm" onClick={goToday} className="hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 font-medium transition-colors">{t('common.today')}</Button>
                <Button variant="outline" size="icon" onClick={nextMonth} className="hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors"><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-px mb-1">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
              ))}
            </div>
            {/* Calendar cells */}
            <div className="grid grid-cols-7 gap-px">
              {calendarDays.map((day) => {
                const dayEvents = eventsByDate[day.date] || []
                const isToday = day.date === today
                const isSelected = day.date === selectedDate
                return (
                  <button
                    key={day.date}
                    className={`relative min-h-[72px] p-1 text-left border border-border/30 rounded-sm transition-colors hover:bg-muted/50 ${
                      !day.isCurrentMonth ? 'opacity-40' : ''
                    } ${isSelected ? 'bg-emerald-50 dark:bg-emerald-950/30 ring-2 ring-emerald-500' : ''} ${isToday ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''}`}
                    onClick={() => setSelectedDate(day.date)}
                  >
                    <span className={`text-xs font-medium ${isToday ? 'bg-emerald-600 text-white rounded-full w-5 h-5 flex items-center justify-center' : 'text-foreground'}`}>
                      {day.day}
                    </span>
                    {/* Event dots */}
                    {dayEvents.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 mt-1">
                        {dayEvents.slice(0, 3).map((e, i) => (
                          <Tooltip key={i}>
                            <TooltipTrigger asChild>
                              <div
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: e.color || eventTypeColors[e.eventType] || '#059669' }}
                              />
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                              {e.title}
                            </TooltipContent>
                          </Tooltip>
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[9px] text-muted-foreground">+{dayEvents.length - 3}</span>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t">
              {Object.entries(eventTypeLabels).map(([key, label]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: eventTypeColors[key] }} />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar: Selected Date Events */}
        <Card className="border border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {selectedDate
                ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })
                : t('calendar.selectDate')}
            </CardTitle>
            {selectedDate && (
              <CardDescription>{selectedDateEvents.length} {t('calendar.event').toLowerCase()}{selectedDateEvents.length !== 1 ? 's' : ''}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              selectedDateEvents.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedDateEvents.map((e) => (
                    <div key={e.id} className="p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: e.color || eventTypeColors[e.eventType] || '#059669' }} />
                            <span className="text-sm font-medium truncate">{e.title}</span>
                          </div>
                          <Badge variant="outline" className="mt-1.5 text-xs rounded-full">
                            {eventTypeLabels[e.eventType] || e.eventType}
                          </Badge>
                          {e.description && (
                            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{e.description}</p>
                          )}
                        </div>
                        {!e.id.startsWith('exam-') && (
                          <div className="flex gap-0.5 shrink-0">
                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(e as SchoolEvent)}><Pencil className="w-3 h-3" /></Button></TooltipTrigger><TooltipContent>{t('common.edit')}</TooltipContent></Tooltip>
                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => openDelete(e as SchoolEvent)}><Trash2 className="w-3 h-3" /></Button></TooltipTrigger><TooltipContent>{t('common.delete')}</TooltipContent></Tooltip>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => openAdd(selectedDate)}>
                    <Plus className="w-3 h-3 mr-1" /> {t('calendar.addEvent')}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="w-8 h-8 mx-auto text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground mt-2">{t('calendar.noEventsOnDate')}</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => openAdd(selectedDate)}>
                    <Plus className="w-3 h-3 mr-1" /> {t('calendar.addEvent')}
                  </Button>
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="w-8 h-8 mx-auto text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground mt-2">{t('calendar.clickDateToView')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Event Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEdit ? t('calendar.editEvent') : t('calendar.addNewEvent')}</DialogTitle>
            <DialogDescription>{isEdit ? t('calendar.updateEventInfo') : t('calendar.createNewEventDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('common.name')} *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t('calendar.eventTitlePlaceholder')} />
              {validationErrors.title && <p className="text-xs text-red-500">{validationErrors.title}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t('calendar.eventType')} *</Label>
              <Select value={form.eventType} onValueChange={(v) => setForm({ ...form, eventType: v, color: eventTypeColors[v] || '#059669' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="event">{t('calendar.event')}</SelectItem>
                  <SelectItem value="exam">{t('calendar.exam')}</SelectItem>
                  <SelectItem value="holiday">{t('calendar.holiday')}</SelectItem>
                  <SelectItem value="meeting">{t('calendar.meeting')}</SelectItem>
                  <SelectItem value="deadline">{t('calendar.deadline')}</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.eventType && <p className="text-xs text-red-500">{validationErrors.eventType}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('calendar.startDate')} *</Label>
                <Input type="date" value={form.startDate ? new Date(form.startDate).toISOString().split('T')[0] : ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                {validationErrors.startDate && <p className="text-xs text-red-500">{validationErrors.startDate}</p>}
              </div>
              <div className="space-y-2">
                <Label>{t('calendar.endDate')}</Label>
                <Input type="date" value={form.endDate ? new Date(form.endDate).toISOString().split('T')[0] : ''} onChange={(e) => setForm({ ...form, endDate: e.target.value || null })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('common.description')}</Label>
              <Textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>{t('calendar.color')}</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" />
                <span className="text-xs text-muted-foreground">{form.color}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-md shadow-emerald-500/20 gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? t('common.saving') : t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Event Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('calendar.deleteEventTitle')}</DialogTitle>
            <DialogDescription>{t('calendar.deleteEventConfirm')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete}>{t('common.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
