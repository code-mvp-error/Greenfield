'use client'

import { useSMSStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Users,
  School,
  BookMarked,
  ClipboardCheck,
  FileText,
  DollarSign,
  Megaphone,
  X,
  Sun,
  Moon,
  User,
  Calendar,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  LogOut,
  Settings,
  Globe,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LogoIcon } from '@/components/ui/logo-icon'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { useState, useCallback } from 'react'
import { useTranslation } from '@/lib/i18n'

export function Sidebar() {
  const { data: session } = useSession()
  const { activeTab, setActiveTab, sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed } = useSMSStore()
  const { theme, setTheme } = useTheme()
  const { t, locale, setLocale } = useTranslation()
  const [clickedItem, setClickedItem] = useState<string | null>(null)
  const [userHovered, setUserHovered] = useState(false)

  const userName = session?.user?.name || 'User'
  const userEmail = session?.user?.email || ''
  const userRole = session?.user?.role || 'staff'
  const roleDisplay = userRole === 'admin' ? t('sidebar.administrator') : userRole === 'teacher' ? t('sidebar.teacher') : t('sidebar.staffRole')

  const navGroups = [
    {
      label: t('sidebar.overview'),
      items: [
        { id: 'dashboard', label: t('sidebar.dashboard'), icon: LayoutDashboard },
      ],
    },
    {
      label: t('sidebar.people'),
      items: [
        { id: 'students', label: t('sidebar.students'), icon: GraduationCap },
        { id: 'teachers', label: t('sidebar.teachers'), icon: BookOpen },
        { id: 'staff', label: t('sidebar.staff'), icon: Users },
      ],
    },
    {
      label: t('sidebar.academic'),
      items: [
        { id: 'classes', label: t('sidebar.classes'), icon: School },
        { id: 'subjects', label: t('sidebar.subjects'), icon: BookMarked },
        { id: 'attendance', label: t('sidebar.attendance'), icon: ClipboardCheck },
        { id: 'grading', label: t('sidebar.examsGrades'), icon: FileText },
        { id: 'calendar', label: t('sidebar.calendar'), icon: Calendar },
      ],
    },
    {
      label: t('sidebar.administration'),
      items: [
        { id: 'finances', label: t('sidebar.finances'), icon: DollarSign },
        { id: 'communications', label: t('sidebar.communications'), icon: Megaphone },
      ],
    },
  ]

  const handleNavClick = useCallback((id: string) => {
    setClickedItem(id)
    setActiveTab(id)
    setTimeout(() => setClickedItem(null), 150)
  }, [setActiveTab])

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const collapsed = sidebarCollapsed

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen text-sidebar-foreground flex flex-col border-r border-sidebar-border/40',
          'transition-all duration-300 ease-in-out lg:translate-x-0',
          // Glass morphism effect
          'backdrop-blur-xl bg-sidebar/95',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'w-[72px]' : 'w-64'
        )}
      >
        {/* Decorative gradient mesh overlay at top */}
        <div className="absolute inset-x-0 top-0 h-32 pointer-events-none overflow-hidden rounded-t-none">
          <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full bg-sidebar-primary/8 blur-2xl" />
          <div className="absolute -top-4 right-0 w-32 h-32 rounded-full bg-sidebar-primary/5 blur-2xl" />
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-sidebar-primary/4 blur-xl" />
        </div>

        {/* Header / Brand */}
        <div className="relative flex items-center justify-between p-4">
          <div className={cn('flex items-center gap-3 overflow-hidden', collapsed && 'justify-center w-full')}>
            <div className={cn(
              'rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/70 flex items-center justify-center shrink-0',
              'shadow-lg shadow-sidebar-primary/20',
              'ring-1 ring-sidebar-primary/30',
              collapsed ? 'w-10 h-10' : 'w-10 h-10'
            )}>
              <LogoIcon className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="min-w-0 animate-[slideInLeft_0.3s_ease-out]">
                <h1 className="text-[15px] font-bold text-sidebar-foreground leading-tight truncate tracking-tight">{t('app.name')}</h1>
                <p className="text-[11px] text-sidebar-foreground/45 leading-tight truncate font-medium">{t('app.tagline')}</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground h-8 w-8 transition-all duration-200"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Separator glow between brand and navigation */}
        <div className="sidebar-separator-glow mx-4" />

        {/* Navigation */}
        <nav className="relative flex-1 py-3 overflow-y-auto custom-scrollbar min-h-0">
          {navGroups.map((group, groupIdx) => (
            <div key={group.label} className="animate-[slideInLeft_0.3s_ease-out]" style={{ animationDelay: `${groupIdx * 50}ms`, animationFillMode: 'both' }}>
              {groupIdx > 0 && (
                <div className="my-2 mx-4 h-px bg-sidebar-border/20" />
              )}
              {!collapsed && (
                <div className="flex items-center gap-2 px-4 mb-1.5 mt-1">
                  <div className="w-1 h-1 rounded-full bg-sidebar-primary/40" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/35">
                    {group.label}
                  </p>
                  <div className="flex-1 h-px bg-sidebar-border/15" />
                </div>
              )}
              {collapsed && groupIdx > 0 && (
                <div className="mx-3 my-1 h-px bg-sidebar-border/20" />
              )}
              <div className="space-y-0.5 px-2">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id
                  const isClicked = clickedItem === item.id
                  const btn = (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={cn(
                        'group w-full flex items-center gap-3 rounded-lg text-sm font-medium',
                        'transition-all duration-200 ease-out',
                        collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2',
                        // Active state: pill-shaped with glow
                        isActive
                          ? 'bg-sidebar-primary/15 text-sidebar-primary nav-active-glow rounded-xl'
                          : 'text-sidebar-foreground/55 hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground hover:translate-x-0.5',
                        // Click micro-animation
                        isClicked && 'scale-95',
                      )}
                    >
                      <div className={cn(
                        'shrink-0 transition-all duration-200 rounded-lg',
                        collapsed ? 'w-5 h-5 p-0' : 'w-[22px] h-[22px] flex items-center justify-center',
                        isActive && 'nav-icon-ring rounded-lg'
                      )}>
                        <Icon className={cn(
                          'transition-all duration-200',
                          collapsed ? 'w-5 h-5' : 'w-[16px] h-[16px]',
                          isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground'
                        )} />
                      </div>
                      {!collapsed && (
                        <>
                          <span className="truncate transition-all duration-200">{item.label}</span>
                          {isActive && (
                            <div className="ml-auto flex items-center gap-1.5 shrink-0">
                              <Sparkles className="w-3 h-3 text-sidebar-primary/60" />
                              <div className="w-1.5 h-1.5 rounded-full bg-sidebar-primary shrink-0" />
                            </div>
                          )}
                        </>
                      )}
                    </button>
                  )

                  // When collapsed, show tooltip with item label
                  if (collapsed) {
                    return (
                      <Tooltip key={item.id}>
                        <TooltipTrigger asChild>
                          {btn}
                        </TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    )
                  }

                  return btn
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom section: Theme Toggle + User + Collapse Toggle */}
        <div className="relative border-t border-sidebar-border/20">
          {/* Theme Toggle Switch */}
          <div className="px-2 pt-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleTheme}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-lg text-sm font-medium text-sidebar-foreground/55',
                    'hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground transition-all duration-200',
                    collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2'
                  )}
                >
                  {!collapsed ? (
                    // Toggle switch style
                    <div className="flex items-center gap-3 w-full">
                      <div className={cn(
                        'relative w-10 h-5 rounded-full transition-colors duration-300',
                        theme === 'dark'
                          ? 'bg-sky-500/30'
                          : 'bg-amber-500/30'
                      )}>
                        <div className={cn(
                          'absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 flex items-center justify-center',
                          theme === 'dark'
                            ? 'left-5 bg-sky-400'
                            : 'left-0.5 bg-amber-400'
                        )}>
                          {theme === 'dark' ? (
                            <Moon className="w-2.5 h-2.5 text-white" />
                          ) : (
                            <Sun className="w-2.5 h-2.5 text-white" />
                          )}
                        </div>
                      </div>
                      <span className="text-sidebar-foreground/60">
                        {theme === 'dark' ? t('sidebar.darkMode') : t('sidebar.lightMode')}
                      </span>
                    </div>
                  ) : (
                    // Collapsed: just icon
                    <div className="flex items-center justify-center">
                      {theme === 'dark' ? (
                        <Moon className="w-[18px] h-[18px] shrink-0 text-sky-400" />
                      ) : (
                        <Sun className="w-[18px] h-[18px] shrink-0 text-amber-400" />
                      )}
                    </div>
                  )}
                </button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" className="font-medium">
                  {theme === 'dark' ? t('sidebar.lightMode') : t('sidebar.darkMode')}
                </TooltipContent>
              )}
            </Tooltip>
          </div>

          {/* Language Switcher */}
          <div className="px-2 py-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-lg text-sm font-medium text-sidebar-foreground/55',
                    'hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground transition-all duration-200',
                    collapsed ? 'px-0 py-2 justify-center' : 'px-3 py-2'
                  )}
                >
                  {!collapsed ? (
                    <div className="flex items-center gap-3 w-full">
                      <Globe className="w-4 h-4 shrink-0" />
                      <span>{locale === 'fr' ? 'Français' : 'English'}</span>
                    </div>
                  ) : (
                    <Globe className="w-4 h-4 shrink-0" />
                  )}
                </button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" className="font-medium">
                  {locale === 'fr' ? 'Français' : 'English'}
                </TooltipContent>
              )}
            </Tooltip>
          </div>

          {/* Collapse Toggle (desktop only) */}
          <div className="px-2 py-1 hidden lg:block">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setSidebarCollapsed(!collapsed)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-lg text-sm font-medium text-sidebar-foreground/35',
                    'hover:bg-sidebar-accent/40 hover:text-sidebar-foreground/60 transition-all duration-200',
                    collapsed ? 'px-0 py-2 justify-center' : 'px-3 py-1.5'
                  )}
                >
                  {collapsed ? (
                    <ChevronsRight className="w-4 h-4 shrink-0" />
                  ) : (
                    <>
                      <ChevronsLeft className="w-4 h-4 shrink-0" />
                      <span>{t('sidebar.collapse')}</span>
                    </>
                  )}
                </button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" className="font-medium">
                  {t('sidebar.expandSidebar')}
                </TooltipContent>
              )}
            </Tooltip>
          </div>

          {/* User Avatar Section with hover expand */}
          <div className="px-2 pb-2 pt-1">
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <div
                      className={cn(
                        'flex items-center gap-3 rounded-xl transition-all duration-300 cursor-pointer w-full',
                        'hover:bg-sidebar-accent/30',
                        collapsed ? 'px-0 py-2 justify-center' : 'px-3 py-2.5',
                        userHovered && !collapsed && 'bg-sidebar-accent/30'
                      )}
                      onMouseEnter={() => setUserHovered(true)}
                      onMouseLeave={() => setUserHovered(false)}
                    >
                      <div className={cn(
                        'rounded-full bg-gradient-to-br from-sidebar-primary/60 to-sidebar-primary/30 flex items-center justify-center shrink-0',
                        'ring-2 ring-sidebar-primary/20 transition-all duration-300',
                        userHovered ? 'ring-sidebar-primary/40 scale-105' : '',
                        collapsed ? 'w-8 h-8' : 'w-9 h-9'
                      )}>
                        <User className={cn(
                          'text-sidebar-foreground/70 transition-transform duration-300',
                          collapsed ? 'w-4 h-4' : 'w-4.5 h-4.5',
                          userHovered && 'scale-110'
                        )} />
                      </div>
                      {!collapsed && (
                        <div className={cn(
                          'flex-1 min-w-0 transition-all duration-300 text-left',
                          userHovered && 'translate-x-0.5'
                        )}>
                          <p className="text-sm font-semibold text-sidebar-foreground/80 truncate">{userName}</p>
                          <p className="text-[11px] text-sidebar-foreground/40 truncate">{roleDisplay}</p>
                        </div>
                      )}
                      {!collapsed && userHovered && (
                        <Settings className="w-3.5 h-3.5 text-sidebar-foreground/30 shrink-0 animate-[scaleIn_0.2s_ease-out]" />
                      )}
                    </div>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">
                    <p className="font-medium">{userName}</p>
                    <p className="text-xs text-muted-foreground">{roleDisplay}</p>
                  </TooltipContent>
                )}
              </Tooltip>
              <DropdownMenuContent side="right" align="start" className="w-56 ml-2 mb-2">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                    <p className="text-xs leading-none text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">{roleDisplay}</p>
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
        </div>
      </aside>
    </>
  )
}
