'use client'

import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from '@/lib/i18n'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  GraduationCap, BookOpen, School, DollarSign, TrendingUp, TrendingDown,
  CheckCircle2, XCircle, Clock, Banknote, UserPlus, ClipboardCheck,
  CreditCard, Megaphone, Calendar, ArrowRight, BarChart3, PieChart as PieChartIcon,
  Activity, ChevronRight, Sparkles, Users
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useSMSStore } from '@/lib/store'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts'

interface TodayOverview {
  present: number
  absent: number
  late: number
  feeCollected: number
}

interface DashboardStats {
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  totalRevenue: number
  attendanceRate: number
  todayOverview: TodayOverview
  attendanceData: Array<{ day: string; rate: number }>
  genderData: Array<{ name: string; value: number; color: string }>
  feeData: Array<{ month: string; collected: number; pending: number }>
  recentActivities: Array<{ id: string; text: string; time: string; type: string }>
}

const defaultStats: DashboardStats = {
  totalStudents: 0,
  totalTeachers: 0,
  totalClasses: 0,
  totalRevenue: 0,
  attendanceRate: 0,
  todayOverview: { present: 0, absent: 0, late: 0, feeCollected: 0 },
  attendanceData: [],
  genderData: [],
  feeData: [],
  recentActivities: [],
}

/** Format a date string or Date into a relative "time ago" string */
function timeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

/** Format today's date nicely */
function formatToday(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function Dashboard() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<DashboardStats>(defaultStats)
  const [loading, setLoading] = useState(true)
  const { setActiveTab, setOpenAddDialog } = useSMSStore()

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/dashboard')
        if (res.ok) {
          const data = await res.json()
          setStats({ ...defaultStats, ...data, todayOverview: { ...defaultStats.todayOverview, ...data.todayOverview } })
        }
      } catch {
        // use default stats
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  const todayFormatted = useMemo(() => formatToday(), [])

  const totalStudentsForOverview = stats.totalStudents || 1

  const statCards = [
    { title: t('dashboard.totalStudents'), value: stats.totalStudents, icon: GraduationCap, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-gradient-to-br from-emerald-50 via-emerald-100 to-teal-50 dark:from-emerald-950/50 dark:via-emerald-900/40 dark:to-teal-950/30', borderAccent: 'border-l-4 border-l-emerald-500', trend: '+12%', trendUp: true, tab: 'students', shineFrom: 'from-emerald-200/40 dark:from-emerald-700/20' },
    { title: t('dashboard.totalTeachers'), value: stats.totalTeachers, icon: BookOpen, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-gradient-to-br from-amber-50 via-amber-100 to-yellow-50 dark:from-amber-950/50 dark:via-amber-900/40 dark:to-yellow-950/30', borderAccent: 'border-l-4 border-l-amber-500', trend: '+3%', trendUp: true, tab: 'teachers', shineFrom: 'from-amber-200/40 dark:from-amber-700/20' },
    { title: t('dashboard.totalClasses'), value: stats.totalClasses, icon: School, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-gradient-to-br from-violet-50 via-violet-100 to-purple-50 dark:from-violet-950/50 dark:via-violet-900/40 dark:to-purple-950/30', borderAccent: 'border-l-4 border-l-violet-500', trend: '+5%', trendUp: true, tab: 'classes', shineFrom: 'from-violet-200/40 dark:from-violet-700/20' },
    { title: t('dashboard.totalRevenue'), value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-gradient-to-br from-rose-50 via-rose-100 to-pink-50 dark:from-rose-950/50 dark:via-rose-900/40 dark:to-pink-950/30', borderAccent: 'border-l-4 border-l-rose-500', trend: '+8%', trendUp: true, tab: 'finances', shineFrom: 'from-rose-200/40 dark:from-rose-700/20' },
  ]

  const todayCards = [
    {
      title: t('dashboard.presentToday'),
      value: stats.todayOverview.present,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
      progressColor: 'bg-emerald-500',
      progressTrack: 'bg-emerald-100 dark:bg-emerald-900/40',
      showProgress: true,
      total: totalStudentsForOverview,
      percent: Math.round((stats.todayOverview.present / totalStudentsForOverview) * 100),
    },
    {
      title: t('dashboard.absentToday'),
      value: stats.todayOverview.absent,
      icon: XCircle,
      color: 'text-red-500 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950/30',
      iconBg: 'bg-red-100 dark:bg-red-900/50',
      progressColor: 'bg-red-500',
      progressTrack: 'bg-red-100 dark:bg-red-900/40',
      showProgress: true,
      total: totalStudentsForOverview,
      percent: Math.round((stats.todayOverview.absent / totalStudentsForOverview) * 100),
    },
    {
      title: t('dashboard.lateToday'),
      value: stats.todayOverview.late,
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      iconBg: 'bg-amber-100 dark:bg-amber-900/50',
      progressColor: 'bg-amber-500',
      progressTrack: 'bg-amber-100 dark:bg-amber-900/40',
      showProgress: true,
      total: totalStudentsForOverview,
      percent: Math.round((stats.todayOverview.late / totalStudentsForOverview) * 100),
    },
    {
      title: t('dashboard.feeCollectedToday'),
      value: `$${stats.todayOverview.feeCollected.toLocaleString()}`,
      icon: Banknote,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-950/30',
      iconBg: 'bg-violet-100 dark:bg-violet-900/50',
      progressColor: '',
      progressTrack: '',
      showProgress: false,
      total: 0,
      percent: 0,
    },
  ]

  const quickActions = [
    { label: t('dashboard.addStudent'), icon: UserPlus, tab: 'students', openDialog: 'students', description: t('dashboard.addStudentDesc') },
    { label: t('dashboard.markAttendance'), icon: ClipboardCheck, tab: 'attendance', description: t('dashboard.markAttendanceDesc') },
    { label: t('dashboard.recordPayment'), icon: CreditCard, tab: 'finances', description: t('dashboard.recordPaymentDesc') },
    { label: t('dashboard.createAnnouncement'), icon: Megaphone, tab: 'communications', description: t('dashboard.createAnnouncementDesc') },
  ]

  /** Activity type → left border color class */
  const activityBorderMap: Record<string, string> = {
    announcement: 'border-l-4 border-l-amber-400 dark:border-l-amber-500',
    enrollment: 'border-l-4 border-l-emerald-400 dark:border-l-emerald-500',
    payment: 'border-l-4 border-l-violet-400 dark:border-l-violet-500',
    attendance: 'border-l-4 border-l-blue-400 dark:border-l-blue-500',
    default: 'border-l-4 border-l-gray-300 dark:border-l-gray-600',
  }

  /** Activity type → dot color class */
  const activityDotMap: Record<string, string> = {
    announcement: 'bg-amber-500 ring-amber-100 dark:ring-amber-950/50',
    enrollment: 'bg-emerald-500 ring-emerald-100 dark:ring-emerald-950/50',
    payment: 'bg-violet-500 ring-violet-100 dark:ring-violet-950/50',
    attendance: 'bg-blue-500 ring-blue-100 dark:ring-blue-950/50',
    default: 'bg-gray-400 ring-gray-100 dark:ring-gray-800',
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-stagger">
        {/* Welcome skeleton */}
        <Card className="border border-border/50 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-56" />
              </div>
              <Skeleton className="h-16 w-16 rounded-2xl" />
            </div>
          </CardContent>
        </Card>
        {/* Stat card skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-14 w-14 rounded-2xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Today overview skeletons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border border-border/50">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-5 w-12" />
                    </div>
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ───────────────────────────────────────────────────────────────
          SECTION 1: Welcome / Greeting Banner
      ─────────────────────────────────────────────────────────────── */}
      <Card className="border-0 overflow-hidden relative rounded-xl">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-500 dark:from-emerald-700 dark:via-emerald-800 dark:to-teal-700" />
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        {/* Decorative circles */}
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10 dark:bg-white/5" />
        <div className="absolute -right-4 bottom-0 w-24 h-24 rounded-full bg-white/5 dark:bg-white/3" />

        <CardContent className="relative p-6 md:p-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {t('dashboard.welcomeBack')} 👋
              </h1>
              <p className="text-emerald-100 dark:text-emerald-200/80 text-sm md:text-base font-medium">
                {todayFormatted}
              </p>
              <p className="text-emerald-100/90 dark:text-emerald-200/70 text-sm">
                <Users className="w-4 h-4 inline mr-1 -mt-0.5" />
                You have <span className="font-semibold text-white">{stats.todayOverview.present}</span> {t('dashboard.studentsPresentToday')}
              </p>
            </div>
            <div className="hidden sm:flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/15 dark:bg-white/10 backdrop-blur-sm">
              <School className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ───────────────────────────────────────────────────────────────
          SECTION 2: Stat Cards — Refined
      ─────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card
              key={card.title}
              className={`group relative rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border border-border/50 shadow-card cursor-pointer card-gradient-animate overflow-hidden hover:border-emerald-300/50 dark:hover:border-emerald-600/40 ${card.borderAccent}`}
              onClick={() => setActiveTab(card.tab)}
            >
              {/* Shimmer overlay on hover */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r ${card.shineFrom} via-transparent to-transparent pointer-events-none`} />

              <CardContent className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                    <p className="text-2xl font-bold">{card.value}</p>
                    <div className={`flex items-center gap-1 text-xs font-semibold ${card.trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {card.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>{card.trend} {t('dashboard.fromLastMonth')}</span>
                    </div>
                  </div>
                  <div className={`p-3.5 rounded-2xl shadow-inner ${card.bg} transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className={`w-7 h-7 ${card.color}`} />
                  </div>
                </div>
                {/* View Details link */}
                <div className="mt-3 pt-3 border-t border-border/40">
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors inline-flex items-center gap-1">
                    {t('dashboard.viewDetails')} <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ───────────────────────────────────────────────────────────────
          SECTION 3: Today's Overview — with section header & progress bars
      ─────────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-lg font-bold section-accent">{t('dashboard.todayOverview')}</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
          {todayCards.map((card) => {
            const Icon = card.icon
            return (
              <Card key={card.title} className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border border-border/50 shadow-card rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2.5 rounded-xl shadow-sm ${card.iconBg}`}>
                      <Icon className={`w-5 h-5 ${card.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground truncate">{card.title}</p>
                      <div className="flex items-baseline gap-1.5">
                        <p className="text-lg font-bold">{card.value}</p>
                        {card.showProgress && (
                          <span className="text-[11px] text-muted-foreground">/ {card.total}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {card.showProgress ? (
                    <div className="space-y-1">
                      <div className={`h-1.5 w-full rounded-full ${card.progressTrack} overflow-hidden`}>
                        <div
                          className={`h-full rounded-full ${card.progressColor} transition-all duration-700 ease-out`}
                          style={{ width: `${Math.min(card.percent, 100)}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground text-right">{card.percent}%</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="text-[11px]">{t('dashboard.todaysCollection')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────
          SECTION 4: Quick Actions — Outlined Cards
      ─────────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold section-accent">{t('dashboard.quickActions')}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-stagger">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Card
                key={action.label}
                className="group rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50/30 dark:bg-emerald-950/10 hover:border-emerald-400/70 dark:hover:border-emerald-600/50 hover:shadow-lg hover:scale-[1.03] transition-all duration-200 cursor-pointer"
                onClick={() => {
                  setActiveTab(action.tab)
                  if (action.openDialog) {
                    setTimeout(() => setOpenAddDialog(action.openDialog!), 100)
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="p-2 rounded-lg bg-emerald-100/60 dark:bg-emerald-900/30 group-hover:bg-emerald-200/70 dark:group-hover:bg-emerald-800/40 transition-colors">
                        <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{action.label}</p>
                        <p className="text-[11px] text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-1 transition-all mt-1" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Subtle divider */}
      <div className="border-t border-border/40" />

      {/* ───────────────────────────────────────────────────────────────
          SECTION 5: Charts Row 1 — Attendance + Gender
      ─────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Rate Chart */}
        <Card className="lg:col-span-2 border border-border/50 shadow-card rounded-xl bg-gradient-to-br from-card via-card to-emerald-50/20 dark:to-emerald-950/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <CardTitle className="text-lg section-accent">{t('dashboard.weeklyAttendanceRate')}</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 -mr-2"
                onClick={() => setActiveTab('attendance')}
              >
                {t('dashboard.viewFullReport')} <ChevronRight className="w-3 h-3 ml-0.5" />
              </Button>
            </div>
            <CardDescription>{t('dashboard.attendanceDescription')} &bull; {t('dashboard.overallRate')}: {stats.attendanceRate}%</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {stats.attendanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} unit="%" />
                  <Tooltip formatter={(value: number) => [`${value}%`, t('dashboard.attendanceRate')]} contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#059669"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#059669', strokeWidth: 2, stroke: 'var(--card)' }}
                    activeDot={{ r: 7, fill: '#047857', stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Activity className="w-10 h-10 opacity-30" />
                <p className="text-sm">{t('dashboard.noAttendanceData')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gender Distribution */}
        <Card className="border border-border/50 shadow-card rounded-xl bg-gradient-to-br from-card via-card to-emerald-50/20 dark:to-emerald-950/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <CardTitle className="text-lg section-accent">{t('dashboard.genderDistribution')}</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 -mr-2"
                onClick={() => setActiveTab('students')}
              >
                {t('dashboard.details')} <ChevronRight className="w-3 h-3 ml-0.5" />
              </Button>
            </div>
            <CardDescription>{t('dashboard.genderDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {stats.genderData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: 'var(--muted-foreground)', strokeWidth: 1 }}
                  >
                    {stats.genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="var(--card)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                <PieChartIcon className="w-10 h-10 opacity-30" />
                <p className="text-sm">{t('dashboard.noStudentData')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ───────────────────────────────────────────────────────────────
          SECTION 6: Charts Row 2 — Fee Collection + Recent Activities
      ─────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fee Collection Bar Chart */}
        <Card className="border border-border/50 shadow-card rounded-xl bg-gradient-to-br from-card via-card to-emerald-50/20 dark:to-emerald-950/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <CardTitle className="text-lg section-accent">{t('dashboard.feeCollectionStatus')}</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 -mr-2"
                onClick={() => setActiveTab('finances')}
              >
                {t('dashboard.viewFullReport')} <ChevronRight className="w-3 h-3 ml-0.5" />
              </Button>
            </div>
            <CardDescription>{t('dashboard.feeDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {stats.feeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.feeData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend />
                  <Bar dataKey="collected" fill="#059669" radius={[4, 4, 0, 0]} name={t('dashboard.collected')} />
                  <Bar dataKey="pending" fill="#f59e0b" radius={[4, 4, 0, 0]} name={t('dashboard.pendingLabel')} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                <BarChart3 className="w-10 h-10 opacity-30" />
                <p className="text-sm">{t('dashboard.noFeeData')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities — Redesigned */}
        <Card className="border border-border/50 shadow-card rounded-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <CardTitle className="text-lg section-accent">{t('dashboard.recentActivities')}</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 -mr-2"
                onClick={() => setActiveTab('communications')}
              >
                {t('dashboard.viewAll')} <ChevronRight className="w-3 h-3 ml-0.5" />
              </Button>
            </div>
            <CardDescription>{t('dashboard.recentActivitiesDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-0 max-h-[340px] overflow-y-auto custom-scrollbar">
              {stats.recentActivities.length > 0 ? (
                stats.recentActivities.map((activity, index) => (
                  <div
                    key={activity.id}
                    className={`flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 hover:translate-x-1 transition-all duration-200 relative ${activityBorderMap[activity.type] || activityBorderMap.default}`}
                  >
                    {/* Timeline dot and line */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-3 h-3 rounded-full ring-4 mt-1.5 ${activityDotMap[activity.type] || activityDotMap.default} ${index === 0 ? 'animate-pulse' : ''}`} />
                      {index < stats.recentActivities.length - 1 && (
                        <div className="w-px h-full min-h-[24px] bg-border mt-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed">{activity.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">{timeAgo(activity.time)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground gap-2">
                  <Activity className="w-10 h-10 opacity-30" />
                  <p className="text-sm">{t('dashboard.noRecentActivities')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
