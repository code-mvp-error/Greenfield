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
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Pencil, Trash2, Save, Printer, Download, GraduationCap, School, BarChart3, Loader2, FileText } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { exportToCSV } from '@/lib/export'
import { useTranslation } from '@/lib/i18n'

interface Exam {
  id: string
  name: string
  type: string
  classId: string
  subjectId: string
  date: string
  totalMarks: number
  description: string
  class?: { id: string; name: string; section: string }
  subject?: { id: string; name: string; code: string }
}

interface Grade {
  id: string
  studentId: string
  examId: string
  marksObtained: number
  grade: string
  remarks: string
  student?: { id: string; firstName: string; lastName: string }
}

interface ClassItem { id: string; name: string; section: string }
interface Subject { id: string; name: string; code: string }
interface Student { id: string; firstName: string; lastName: string; classId: string | null }

const emptyExam: Omit<Exam, 'id' | 'class' | 'subject'> = {
  name: '', type: 'Mid-Term', classId: '', subjectId: '', date: '', totalMarks: 100, description: '',
}

function calculateGrade(percentage: number): string {
  if (percentage >= 90) return 'A'
  if (percentage >= 80) return 'B'
  if (percentage >= 70) return 'C'
  if (percentage >= 60) return 'D'
  return 'F'
}

const gradeColor: Record<string, string> = {
  A: 'bg-emerald-100 text-emerald-700',
  B: 'bg-blue-100 text-blue-700',
  C: 'bg-amber-100 text-amber-700',
  D: 'bg-orange-100 text-orange-700',
  F: 'bg-red-100 text-red-700',
}

const gradePrintColor: Record<string, string> = {
  A: '#059669',
  B: '#2563eb',
  C: '#d97706',
  D: '#ea580c',
  F: '#dc2626',
}

export function GradingManagement() {
  const { toast } = useToast()
  const { t } = useTranslation()
  const [exams, setExams] = useState<Exam[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<Exam | null>(null)
  const [form, setForm] = useState(emptyExam)
  const [isEdit, setIsEdit] = useState(false)
  const [saving, setSaving] = useState(false)

  // Grades
  const [selectedExam, setSelectedExam] = useState('')
  const [gradeMap, setGradeMap] = useState<Record<string, number>>({})
  const [gradeSaving, setGradeSaving] = useState(false)
  const [reportCard, setReportCard] = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const [eRes, cRes, sRes, stRes] = await Promise.all([
        fetch('/api/exams'), fetch('/api/classes'), fetch('/api/subjects'), fetch('/api/students'),
      ])
      if (eRes.ok) setExams(await eRes.json())
      if (cRes.ok) setClasses(await cRes.json())
      if (sRes.ok) setSubjects(await sRes.json())
      if (stRes.ok) setStudents(await stRes.json())
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  async function fetchGrades(examId: string) {
    try {
      const res = await fetch(`/api/grades?examId=${examId}`)
      if (res.ok) {
        const data: Grade[] = await res.json()
        setGrades(data)
        const map: Record<string, number> = {}
        data.forEach((g) => { map[g.studentId] = g.marksObtained })
        setGradeMap(map)
      }
    } catch { /* ignore */ }
  }

  function openAdd() { setForm(emptyExam); setIsEdit(false); setDialogOpen(true) }

  function openEdit(e: Exam) {
    setForm({ name: e.name, type: e.type, classId: e.classId, subjectId: e.subjectId, date: e.date, totalMarks: e.totalMarks, description: e.description })
    setSelected(e); setIsEdit(true); setDialogOpen(true)
  }

  function openDelete(e: Exam) { setSelected(e); setDeleteOpen(true) }

  async function handleSave() {
    if (!form.name || !form.classId || !form.subjectId) {
      toast({ title: t('common.error'), description: t('grading.nameClassSubjectRequired'), variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = isEdit
        ? await fetch(`/api/exams?id=${selected?.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        : await fetch('/api/exams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) {
        toast({ title: t('common.success'), description: isEdit ? t('grading.examUpdated') : t('grading.examCreated') })
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
      const res = await fetch(`/api/exams?id=${selected?.id}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: t('common.success'), description: t('grading.examDeleted') }); setDeleteOpen(false); fetchData() }
    } catch { /* ignore */ }
  }

  async function saveGrades() {
    if (!selectedExam) {
      toast({ title: t('common.error'), description: t('grading.selectExamFirst'), variant: 'destructive' })
      return
    }
    setGradeSaving(true)
    try {
      const exam = exams.find((e) => e.id === selectedExam)
      if (!exam) return
      const records = Object.entries(gradeMap).map(([studentId, marks]) => ({
        studentId, examId: selectedExam, marksObtained: marks,
        grade: calculateGrade((marks / exam.totalMarks) * 100), remarks: '',
      }))
      const res = await fetch('/api/grades', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      })
      if (res.ok) {
        toast({ title: t('common.success'), description: t('grading.gradesSaved') })
        fetchGrades(selectedExam)
      } else {
        toast({ title: t('common.error'), description: t('grading.failedToSaveGrades'), variant: 'destructive' })
      }
    } catch {
      toast({ title: t('common.error'), description: t('common.networkError'), variant: 'destructive' })
    } finally { setGradeSaving(false) }
  }

  const examStudents = selectedExam
    ? students.filter((s) => s.classId === exams.find((e) => e.id === selectedExam)?.classId)
    : []

  // Report card calculations
  const reportStats = useMemo(() => {
    if (!selectedExam || examStudents.length === 0) {
      return { totalStudents: 0, classAverage: 0, highest: 0, lowest: 0, gradeDistribution: [] as { grade: string; count: number; color: string }[] }
    }
    const exam = exams.find((e) => e.id === selectedExam)
    if (!exam) return { totalStudents: 0, classAverage: 0, highest: 0, lowest: 0, gradeDistribution: [] as { grade: string; count: number; color: string }[] }

    const marks = examStudents.map((s) => gradeMap[s.id] ?? 0)
    const totalStudents = marks.length
    const classAverage = totalStudents > 0 ? Math.round(marks.reduce((a, b) => a + b, 0) / totalStudents) : 0
    const highest = totalStudents > 0 ? Math.max(...marks) : 0
    const lowest = totalStudents > 0 ? Math.min(...marks) : 0

    const gradeCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 }
    marks.forEach((m) => {
      const g = calculateGrade((m / exam.totalMarks) * 100)
      gradeCounts[g] = (gradeCounts[g] || 0) + 1
    })
    const gradeDistribution = Object.entries(gradeCounts).map(([grade, count]) => ({
      grade,
      count,
      color: gradePrintColor[grade],
    }))

    return { totalStudents, classAverage, highest, lowest, gradeDistribution }
  }, [selectedExam, examStudents, gradeMap, exams])

  function handlePrint() {
    window.print()
  }

  // Translate exam type for display
  const translateExamType = (type: string) => {
    if (type === 'Mid-Term') return t('grading.midTerm')
    if (type === 'Final') return t('grading.final')
    if (type === 'Quiz') return t('grading.quiz')
    if (type === 'Unit Test') return t('grading.unitTest')
    return type
  }

  if (loading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="no-print">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{t('grading.title')}</h2>
              <p className="text-muted-foreground text-sm">{t('grading.subtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="exams">
        <TabsList className="no-print">
          <TabsTrigger value="exams">{t('grading.exams')}</TabsTrigger>
          <TabsTrigger value="grades">{t('grading.grades')}</TabsTrigger>
        </TabsList>

        {/* Exams Tab */}
        <TabsContent value="exams" className="space-y-4">
          <div className="flex justify-end gap-2 no-print">
            <Button variant="outline" onClick={() => exportToCSV(examStudents.map((s) => {
              const marks = gradeMap[s.id] ?? 0
              const exam = exams.find((e) => e.id === selectedExam)
              const pct = exam ? (marks / exam.totalMarks) * 100 : 0
              const grade = calculateGrade(pct)
              return { Student: `${s.firstName} ${s.lastName}`, Exam: exams.find((e) => e.id === selectedExam)?.name || '', Marks: marks, Grade: grade, Remarks: '' }
            }), 'grades')} disabled={examStudents.length === 0 || !selectedExam}>
              <Download className="w-4 h-4 mr-2" /> {t('common.exportCSV')}
            </Button>
            <Button onClick={openAdd} className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-md shadow-emerald-500/20"><Plus className="w-4 h-4 mr-2" /> {t('grading.createExam')}</Button>
          </div>

          <Card className="border border-border/50 shadow-card rounded-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40">
                      <TableHead className="py-3 px-4">{t('common.name')}</TableHead>
                      <TableHead className="py-3 px-4">{t('grading.examType')}</TableHead>
                      <TableHead className="py-3 px-4">{t('grading.selectClass')}</TableHead>
                      <TableHead className="py-3 px-4">{t('grading.selectSubject')}</TableHead>
                      <TableHead className="py-3 px-4">{t('common.date')}</TableHead>
                      <TableHead className="py-3 px-4">{t('grading.totalMarks')}</TableHead>
                      <TableHead className="py-3 px-4 text-right no-print">{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exams.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{t('grading.noExamsFound')}</TableCell></TableRow>
                    ) : exams.map((e, idx) => (
                      <TableRow key={e.id} className={`hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors duration-150 ${idx % 2 === 0 ? '' : 'bg-muted/20 dark:bg-muted/10'}`}>
                        <TableCell className="font-medium py-3 px-4">{e.name}</TableCell>
                        <TableCell className="py-3 px-4"><Badge variant="outline" className="rounded-full px-3 py-0.5 font-semibold text-xs border">{translateExamType(e.type)}</Badge></TableCell>
                        <TableCell className="py-3 px-4">{e.class ? `${e.class.name} - ${e.class.section}` : '-'}</TableCell>
                        <TableCell className="py-3 px-4">{e.subject ? e.subject.name : '-'}</TableCell>
                        <TableCell className="py-3 px-4">{e.date || '-'}</TableCell>
                        <TableCell className="py-3 px-4">{e.totalMarks}</TableCell>
                        <TableCell className="text-right py-3 px-4 no-print">
                          <div className="flex justify-end gap-1">
                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => openEdit(e)}><Pencil className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent>{t('common.edit')}</TooltipContent></Tooltip>
                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="text-destructive" onClick={() => openDelete(e)}><Trash2 className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent>{t('common.delete')}</TooltipContent></Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grades Tab */}
        <TabsContent value="grades" className="space-y-4">
          <Card className="border border-border/50 shadow-card no-print">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="space-y-2 flex-1">
                  <Label>{t('grading.selectExam')}</Label>
                  <Select value={selectedExam} onValueChange={(v) => { setSelectedExam(v); fetchGrades(v) }}>
                    <SelectTrigger><SelectValue placeholder={t('grading.chooseExam')} /></SelectTrigger>
                    <SelectContent>{exams.map((e) => <SelectItem key={e.id} value={e.id}>{e.name} - {e.class?.name} ({e.subject?.name})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {selectedExam && (
                  <div className="flex gap-2">
                    <Button onClick={saveGrades} disabled={gradeSaving} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                      <Save className="w-4 h-4" /> {gradeSaving ? t('common.saving') : t('grading.saveGrades')}
                    </Button>
                    <Button variant="outline" onClick={() => setReportCard(!reportCard)} className="gap-2">
                      <Printer className="w-4 h-4" /> {reportCard ? t('grading.hideReport') : t('grading.reportCard')}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedExam && !reportCard && (
            <Card className="border border-border/50 shadow-card">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="py-3 px-4">{t('grading.student')}</TableHead>
                        <TableHead className="py-3 px-4">{t('grading.marksObtained')}</TableHead>
                        <TableHead className="py-3 px-4">{t('grading.percentage')}</TableHead>
                        <TableHead className="py-3 px-4">{t('grading.grade')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {examStudents.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">{t('grading.noStudentsInClass')}</TableCell></TableRow>
                      ) : examStudents.map((s, idx) => {
                        const marks = gradeMap[s.id] ?? 0
                        const exam = exams.find((e) => e.id === selectedExam)
                        const pct = exam ? (marks / exam.totalMarks) * 100 : 0
                        const grade = calculateGrade(pct)
                        return (
                          <TableRow key={s.id} className={`hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors duration-150 ${idx % 2 === 0 ? '' : 'bg-muted/20 dark:bg-muted/10'}`}>
                            <TableCell className="font-medium py-3 px-4">{s.firstName} {s.lastName}</TableCell>
                            <TableCell className="py-3 px-4">
                              <Input type="number" min={0} max={exam?.totalMarks || 100}
                                value={marks} onChange={(e) => setGradeMap({ ...gradeMap, [s.id]: parseFloat(e.target.value) || 0 })}
                                className="w-24" />
                            </TableCell>
                            <TableCell className="py-3 px-4">{pct.toFixed(1)}%</TableCell>
                            <TableCell className="py-3 px-4"><Badge className={`rounded-full px-3 py-0.5 font-semibold text-xs border ${gradeColor[grade]}`}>{grade}</Badge></TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Print-Friendly Report Card View */}
          {selectedExam && reportCard && (
            <div className="print-area">
              {/* Print Button (hidden in print) */}
              <div className="flex justify-end mb-4 no-print">
                <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                  <Printer className="w-4 h-4" /> {t('grading.printReportCard')}
                </Button>
              </div>

              <Card className="print:shadow-none print:border-0 border border-border/50 shadow-card">
                {/* School Header */}
                <CardHeader className="text-center border-b pb-6 print:pb-6">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center print:bg-emerald-100">
                      <School className="w-8 h-8 text-emerald-600 print:text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl print:text-2xl">{t('grading.greenfieldAcademy')}</CardTitle>
                      <p className="text-muted-foreground text-sm print:text-gray-600">{t('grading.excellenceInEducation')}</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <h3 className="text-xl font-bold print:text-xl">{t('grading.academicReportCard')}</h3>
                    <CardDescription className="print:text-gray-600">
                      {t('grading.examName')}: {exams.find((e) => e.id === selectedExam)?.name} |
                      {t('grading.selectClass')}: {exams.find((e) => e.id === selectedExam)?.class?.name} - {exams.find((e) => e.id === selectedExam)?.class?.section} |
                      {t('grading.selectSubject')}: {exams.find((e) => e.id === selectedExam)?.subject?.name}
                    </CardDescription>
                    {exams.find((e) => e.id === selectedExam)?.date && (
                      <p className="text-xs text-muted-foreground print:text-gray-500">{t('common.date')}: {exams.find((e) => e.id === selectedExam)?.date}</p>
                    )}
                  </div>
                </CardHeader>

                {/* Student Summary */}
                <div className="px-6 py-4 border-b print:border-b print:border-gray-300">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground print:text-gray-500">{t('students.totalStudents')}</p>
                      <p className="text-lg font-bold">{reportStats.totalStudents}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground print:text-gray-500">{t('grading.classAverage')}</p>
                      <p className="text-lg font-bold text-emerald-600 print:text-emerald-600">{reportStats.classAverage}/{exams.find((e) => e.id === selectedExam)?.totalMarks || 100}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground print:text-gray-500">{t('grading.highestScore')}</p>
                      <p className="text-lg font-bold text-emerald-600 print:text-emerald-600">{reportStats.highest}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground print:text-gray-500">{t('grading.lowestScore')}</p>
                      <p className="text-lg font-bold text-amber-600 print:text-amber-600">{reportStats.lowest}</p>
                    </div>
                  </div>
                </div>

                {/* Grade Distribution */}
                <div className="px-6 py-4 border-b print:border-b print:border-gray-300">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-muted-foreground print:text-gray-500" />
                    <h4 className="text-sm font-semibold">{t('grading.gradeDistribution')}</h4>
                  </div>
                  <div className="flex items-end gap-4 justify-center">
                    {reportStats.gradeDistribution.map((gd) => (
                      <div key={gd.grade} className="flex flex-col items-center gap-1">
                        <span className="text-sm font-bold" style={{ color: gd.color }}>{gd.count}</span>
                        <div
                          className="w-10 rounded-t-sm transition-all print:border-0"
                          style={{
                            height: `${reportStats.totalStudents > 0 ? Math.max((gd.count / reportStats.totalStudents) * 80, 4) : 4}px`,
                            backgroundColor: gd.color,
                          }}
                        />
                        <span className="text-xs font-medium" style={{ color: gd.color }}>{gd.grade}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grades Table */}
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 print:bg-gray-100">
                        <TableHead className="py-3 px-4">#</TableHead>
                        <TableHead className="py-3 px-4">{t('grading.studentName')}</TableHead>
                        <TableHead className="py-3 px-4 text-center">{t('grading.marks')}</TableHead>
                        <TableHead className="py-3 px-4 text-center">{t('grading.percentage')}</TableHead>
                        <TableHead className="py-3 px-4 text-center">{t('grading.grade')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {examStudents.map((s, idx) => {
                        const marks = gradeMap[s.id] ?? 0
                        const exam = exams.find((e) => e.id === selectedExam)
                        const pct = exam ? (marks / exam.totalMarks) * 100 : 0
                        const grade = calculateGrade(pct)
                        return (
                          <TableRow key={s.id} className={`hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors duration-150 ${idx % 2 === 0 ? '' : 'bg-muted/30 print:bg-gray-50'}`}>
                            <TableCell className="py-3 px-4">{idx + 1}</TableCell>
                            <TableCell className="font-medium py-3 px-4">{s.firstName} {s.lastName}</TableCell>
                            <TableCell className="text-center py-3 px-4">{marks}/{exam?.totalMarks}</TableCell>
                            <TableCell className="text-center py-3 px-4">{pct.toFixed(1)}%</TableCell>
                            <TableCell className="text-center py-3 px-4">
                              <span className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ backgroundColor: `${gradePrintColor[grade]}20`, color: gradePrintColor[grade] }}>
                                {grade}
                              </span>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>

                {/* Signature Lines */}
                <div className="px-6 py-8 print:py-8">
                  <div className="grid grid-cols-2 gap-16">
                    <div className="text-center">
                      <div className="border-b-2 border-gray-400 mb-2 w-full" />
                      <p className="text-sm font-medium">{t('grading.classTeacher')}</p>
                      <p className="text-xs text-muted-foreground print:text-gray-500">{t('grading.signatureDate')}</p>
                    </div>
                    <div className="text-center">
                      <div className="border-b-2 border-gray-400 mb-2 w-full" />
                      <p className="text-sm font-medium">{t('grading.principal')}</p>
                      <p className="text-xs text-muted-foreground print:text-gray-500">{t('grading.signatureDate')}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Exam Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg dialog-accent-top">
          <DialogHeader>
            <DialogTitle>{isEdit ? t('grading.editExam') : t('grading.createExam')}</DialogTitle>
            <DialogDescription>{isEdit ? t('grading.updateExamInfo') : t('grading.enterExamDetails')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>{t('grading.examName')} *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t('grading.examName')} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t('grading.examType')}</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Mid-Term">{t('grading.midTerm')}</SelectItem><SelectItem value="Final">{t('grading.final')}</SelectItem><SelectItem value="Quiz">{t('grading.quiz')}</SelectItem><SelectItem value="Unit Test">{t('grading.unitTest')}</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>{t('grading.totalMarks')}</Label><Input type="number" value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: parseFloat(e.target.value) || 0 })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t('grading.selectClass')} *</Label><Select value={form.classId} onValueChange={(v) => setForm({ ...form, classId: v })}><SelectTrigger><SelectValue placeholder={t('grading.selectClass')} /></SelectTrigger><SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} - {c.section}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>{t('grading.selectSubject')} *</Label><Select value={form.subjectId} onValueChange={(v) => setForm({ ...form, subjectId: v })}><SelectTrigger><SelectValue placeholder={t('grading.selectSubject')} /></SelectTrigger><SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>{t('common.date')}</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t('common.description')}</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
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
          <DialogHeader><DialogTitle>{t('common.delete')} {t('grading.exams')}</DialogTitle><DialogDescription>Are you sure you want to delete &quot;{selected?.name}&quot;? This action cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete}>{t('common.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
