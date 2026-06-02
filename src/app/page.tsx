'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useSession, signOut } from 'next-auth/react'
import { useSMSStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { AuthGuard } from '@/components/auth/auth-guard'
import { Sidebar } from '@/components/sms/sidebar'
import { useTranslation } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Menu, School, Search, GraduationCap, BookOpen, Users, Bell, ChevronRight, User, Settings, LogOut, LayoutDashboard, ClipboardCheck, FileText, DollarSign, Megaphone, BookMarked, Calendar } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'

// Dynamic imports to reduce initial compilation memory
const Dashboard = dynamic(() => import('@/components/sms/dashboard').then(m => ({ default: m.Dashboard })), { ssr: false })
const StudentManagement = dynamic(() => import('@/components/sms/student-management').then(m => ({ default: m.StudentManagement })), { ssr: false })
const TeacherManagement = dynamic(() => import('@/components/sms/teacher-management').then(m => ({ default: m.TeacherManagement })), { ssr: false })
const StaffManagement = dynamic(() => import('@/components/sms/staff-management').then(m => ({ default: m.StaffManagement })), { ssr: false })
const ClassManagement = dynamic(() => import('@/components/sms/class-management').then(m => ({ default: m.ClassManagement })), { ssr: false })
const SubjectManagement = dynamic(() => import('@/components/sms/subject-management').then(m => ({ default: m.SubjectManagement })), { ssr: false })
const AttendanceTracking = dynamic(() => import('@/components/sms/attendance-tracking').then(m => ({ default: m.AttendanceTracking })), { ssr: false })
const GradingManagement = dynamic(() => import('@/components/sms/grading-management').then(m => ({ default: m.GradingManagement })), { ssr: false })
const FinancialManagement = dynamic(() => import('@/components/sms/financial-management').then(m => ({ default: m.FinancialManagement })), { ssr: false })
const Communication = dynamic(() => import('@/components/sms/communication').then(m => ({ default: m.Communication })), { ssr: false })
const AcademicCalendar = dynamic(() => import('@/components/sms/academic-calendar').then(m => ({ default: m.AcademicCalendar })), { ssr: false })

const moduleMap: Record<string, React.ComponentType> = {
  dashboard: Dashboard,
  students: StudentManagement,
  teachers: TeacherManagement,
  staff: StaffManagement,
  classes: ClassManagement,
  subjects: SubjectManagement,
  attendance: AttendanceTracking,
  grading: GradingManagement,
  finances: FinancialManagement,
  communications: Communication,
  calendar: AcademicCalendar,
}

// moduleDescriptions is now built dynamically using translations inside the component

const moduleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  students: GraduationCap,
  teachers: BookOpen,
  staff: Users,
  classes: School,
  subjects: BookMarked,
  attendance: ClipboardCheck,
  grading: FileText,
  finances: DollarSign,
  communications: Megaphone,
  calendar: Calendar,
}

interface SearchResult {
  id: string
  name: string
  description: string
  type: 'student' | 'teacher' | 'class'
  icon: React.ComponentType<{ className?: string }>
  tab: string
}

export default function Home() {
  const { data: session } = useSession()
  const { activeTab, toggleSidebar, setActiveTab, openAddDialog, setOpenAddDialog, sidebarCollapsed } = useSMSStore()
  const { t } = useTranslation()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null)

  const userName = session?.user?.name || 'User'
  const userEmail = session?.user?.email || ''
  const userRole = session?.user?.role || 'staff'
  const roleDisplay = userRole === 'admin' ? t('sidebar.administrator') : userRole === 'teacher' ? t('sidebar.teacher') : t('sidebar.staffRole')

  const moduleDescriptions: Record<string, string> = useMemo(() => ({
    dashboard: t('dashboard.welcomeBack'),
    students: t('students.subtitle'),
    teachers: t('teachers.subtitle'),
    staff: t('staff.subtitle'),
    classes: t('classes.subtitle'),
    subjects: t('subjects.subtitle'),
    attendance: t('attendance.subtitle'),
    grading: t('grading.subtitle'),
    finances: t('finances.subtitle'),
    communications: t('communications.subtitle'),
    calendar: t('calendar.subtitle'),
  }), [t])

  // Seed database on first load
  useEffect(() => {
    async function seed() {
      try {
        await fetch('/api/seed', { method: 'POST' })
      } catch {
        // ignore
      }
    }
    seed()
  }, [])

  // Sync URL search params with active tab
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    if (tab && tab !== activeTab) {
      setActiveTab(tab)
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (activeTab === 'dashboard') {
      params.delete('tab')
    } else {
      params.set('tab', activeTab)
    }
    const qs = params.toString()
    const newUrl = qs ? `?${qs}` : window.location.pathname
    if (window.location.search !== (qs ? `?${qs}` : '')) {
      window.history.replaceState(null, '', newUrl)
    }
  }, [activeTab])

  // Keyboard shortcut for search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Fetch unread message count for notification bell
  useEffect(() => {
    let cancelled = false
    async function fetchUnread() {
      try {
        const res = await fetch('/api/messages')
        if (res.ok && !cancelled) {
          const messages = await res.json()
          setUnreadCount(messages.filter((m: { isRead: boolean }) => !m.isRead).length)
        }
      } catch { /* ignore */ }
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 60000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  // Search across students, teachers, and classes
  const performSearch = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      return
    }
    setSearchLoading(true)
    try {
      const [sRes, tRes, cRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/teachers'),
        fetch('/api/classes'),
      ])
      const results: SearchResult[] = []
      if (sRes.ok) {
        const students = await sRes.json()
        const q = query.toLowerCase()
        students
          .filter((s: { firstName: string; lastName: string; email: string }) => {
            const name = `${s.firstName} ${s.lastName}`.toLowerCase()
            return name.includes(q) || s.email?.toLowerCase().includes(q)
          })
          .forEach((s: { id: string; firstName: string; lastName: string; class?: { name: string; section: string } }) => {
            results.push({
              id: s.id,
              name: `${s.firstName} ${s.lastName}`,
              description: s.class ? `${s.class.name} - ${s.class.section}` : 'No class assigned',
              type: 'student',
              icon: GraduationCap,
              tab: 'students',
            })
          })
      }
      if (tRes.ok) {
        const teachers = await tRes.json()
        const q = query.toLowerCase()
        teachers
          .filter((t: { firstName: string; lastName: string; email: string; specialization: string }) => {
            const name = `${t.firstName} ${t.lastName}`.toLowerCase()
            return name.includes(q) || t.email?.toLowerCase().includes(q) || t.specialization?.toLowerCase().includes(q)
          })
          .forEach((t: { id: string; firstName: string; lastName: string; specialization: string }) => {
            results.push({
              id: t.id,
              name: `${t.firstName} ${t.lastName}`,
              description: t.specialization || 'Teacher',
              type: 'teacher',
              icon: BookOpen,
              tab: 'teachers',
            })
          })
      }
      if (cRes.ok) {
        const classes = await cRes.json()
        const q = query.toLowerCase()
        classes
          .filter((c: { name: string; section: string; grade: string }) => {
            const str = `${c.name} ${c.section} ${c.grade}`.toLowerCase()
            return str.includes(q)
          })
          .forEach((c: { id: string; name: string; section: string }) => {
            results.push({
              id: c.id,
              name: `${c.name} - ${c.section}`,
              description: 'Class',
              type: 'class',
              icon: Users,
              tab: 'classes',
            })
          })
      }
      setSearchResults(results)
    } catch {
      // ignore
    } finally {
      setSearchLoading(false)
    }
  }, [])

  // Handle search input with debounce
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    if (value.length >= 2) {
      searchTimerRef.current = setTimeout(() => performSearch(value), 300)
    } else {
      setSearchResults([])
    }
  }, [performSearch])

  function handleSearchSelect(result: SearchResult) {
    setSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
    setActiveTab(result.tab)
  }

  const ActiveModule = moduleMap[activeTab] || Dashboard
  const ModuleIcon = moduleIcons[activeTab] || LayoutDashboard
  const moduleTitle = activeTab === 'dashboard' ? t('sidebar.dashboard') : activeTab === 'students' ? t('sidebar.students') : activeTab === 'teachers' ? t('sidebar.teachers') : activeTab === 'staff' ? t('sidebar.staff') : activeTab === 'classes' ? t('sidebar.classes') : activeTab === 'subjects' ? t('sidebar.subjects') : activeTab === 'attendance' ? t('sidebar.attendance') : activeTab === 'grading' ? t('sidebar.examsGrades') : activeTab === 'finances' ? t('sidebar.finances') : activeTab === 'communications' ? t('sidebar.communications') : activeTab === 'calendar' ? t('sidebar.calendar') : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)

  return (
    <AuthGuard>
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className={cn("flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out", !sidebarCollapsed ? 'lg:ml-64' : 'lg:ml-[72px]')}>
          {/* Top Header Bar */}
          <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 border-b border-border/40 header-shadow px-4 lg:px-6 py-3 flex items-center gap-3">
            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 hover:text-primary transition-all duration-200 h-9 w-9 rounded-lg"
              onClick={toggleSidebar}
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Mobile logo */}
            <div className="flex items-center gap-2.5 lg:hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md shadow-primary/20 ring-1 ring-primary/20">
                <School className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-sm gradient-text">{t('app.name')}</span>
            </div>

            {/* Breadcrumb / Module Title */}
            <div className="hidden lg:flex items-center gap-2.5 flex-1 min-w-0">
              <div className="flex items-center gap-1 text-muted-foreground/60">
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{t('app.name')}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <ModuleIcon className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground truncate">{moduleTitle}</span>
              </div>
            </div>

            {/* Welcome message (hidden on small screens) */}
            <div className="hidden xl:block flex-shrink-0 mr-2">
              <p className="text-xs text-muted-foreground/60 max-w-[200px] truncate">
                {moduleDescriptions[activeTab] || t('app.copyright')}
              </p>
            </div>

            {/* Search + Notifications + User Avatar */}
            <div className="ml-auto flex items-center gap-2">
              {/* Search Button */}
              <Button
                variant="outline"
                className="hidden sm:flex items-center gap-2.5 text-muted-foreground h-9 px-3.5 w-64 justify-start hover:border-primary/25 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/15 hover:text-foreground transition-all duration-200 rounded-lg border-border/50 bg-background/50"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="w-4 h-4 text-muted-foreground/60" />
                <span className="text-sm text-muted-foreground/80">{t('header.search')}</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded-md border border-border/50 bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground/60">
                  <span className="text-[9px]">⌘</span>K
                </kbd>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 hover:text-primary transition-all duration-200 rounded-lg h-9 w-9"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="w-5 h-5" />
              </Button>

              {/* Notification Bell */}
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all duration-200 rounded-lg h-9 w-9"
                onClick={() => setActiveTab('communications')}
              >
                <Bell className={cn('w-5 h-5 transition-colors duration-200', unreadCount > 0 ? 'text-primary' : 'text-muted-foreground')} />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-0.5 -right-0.5 h-5 min-w-[20px] rounded-full p-0 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white border-2 border-background badge-bounce-in shadow-lg shadow-red-500/20">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>

              {/* User Avatar Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden sm:flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-1 ring-primary/15 transition-all duration-200 hover:ring-primary/30">
                      <User className="w-4 h-4 text-primary/70" />
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-xs font-semibold text-foreground leading-tight">{userName}</p>
                      <p className="text-[10px] text-muted-foreground/60 leading-tight">{roleDisplay}</p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>{t('common.profile')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>{t('common.settings')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-red-600 dark:text-red-400" onClick={() => signOut({ redirect: false })}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('common.logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <ActiveModule />
          </main>

          {/* Footer */}
          <footer className="border-t border-border/40 bg-background/80 backdrop-blur-sm px-4 lg:px-6 py-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 status-dot" />
                <p className="text-xs text-muted-foreground/70">
                  {t('app.copyright')} © {new Date().getFullYear()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveTab('dashboard')} className="text-xs text-muted-foreground/50 hover:text-primary transition-colors duration-200">{t('sidebar.dashboard')}</button>
                <button onClick={() => setActiveTab('students')} className="text-xs text-muted-foreground/50 hover:text-primary transition-colors duration-200">{t('sidebar.students')}</button>
                <button onClick={() => setActiveTab('finances')} className="text-xs text-muted-foreground/50 hover:text-primary transition-colors duration-200">{t('sidebar.finances')}</button>
                <span className="text-xs text-muted-foreground/30 font-mono">v2.0</span>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Global Search Dialog */}
      <CommandDialog open={searchOpen} onOpenChange={(open) => { setSearchOpen(open); if (!open) { setSearchQuery(''); setSearchResults([]) } }} title={t('header.searchTitle')} description={t('header.searchDescription')}>
        <CommandInput placeholder={t('header.searchPlaceholder')} value={searchQuery} onValueChange={handleSearchChange} />
        <CommandList>
          <CommandEmpty>{searchLoading ? t('header.searching') : searchQuery.length >= 2 ? t('header.noResults') : t('header.startTyping')}</CommandEmpty>
          {searchResults.filter((r) => r.type === 'student').length > 0 && (
            <CommandGroup heading={t('header.studentsGroup')}>
              {searchResults.filter((r) => r.type === 'student').map((result) => {
                const Icon = result.icon
                return (
                  <CommandItem key={result.id} onSelect={() => handleSearchSelect(result)}>
                    <Icon className="w-4 h-4 mr-2" />
                    <span>{result.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{result.description}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}
          {searchResults.filter((r) => r.type === 'teacher').length > 0 && (
            <CommandGroup heading={t('header.teachersGroup')}>
              {searchResults.filter((r) => r.type === 'teacher').map((result) => {
                const Icon = result.icon
                return (
                  <CommandItem key={result.id} onSelect={() => handleSearchSelect(result)}>
                    <Icon className="w-4 h-4 mr-2" />
                    <span>{result.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{result.description}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}
          {searchResults.filter((r) => r.type === 'class').length > 0 && (
            <CommandGroup heading={t('header.classesGroup')}>
              {searchResults.filter((r) => r.type === 'class').map((result) => {
                const Icon = result.icon
                return (
                  <CommandItem key={result.id} onSelect={() => handleSearchSelect(result)}>
                    <Icon className="w-4 h-4 mr-2" />
                    <span>{result.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{result.description}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </div>
    </AuthGuard>
  )
}


