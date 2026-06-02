'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { School, Eye, EyeOff, Mail, Lock, GraduationCap, BookOpen, Users, AlertCircle, Loader2, ArrowRight, Shield, Sparkles, AlertTriangle, Globe } from 'lucide-react'

export function LoginPage() {
  const router = useRouter()
  const { t, locale, setLocale } = useTranslation()
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [dbWarning, setDbWarning] = useState('')

  // Check database health on mount
  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch('/api/health')
        const data = await res.json()
        if (data.database === 'schema_mismatch') {
          setDbWarning(data.message || 'Database schema is out of sync. Please run "bun run db:push" to update.')
        }
      } catch {
        // Health check failed silently
      }
    }
    checkHealth()
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)

    try {
      const result = await signIn('credentials', {
        email: loginEmail,
        password: loginPassword,
        redirect: false,
      })

      if (result?.error) {
        setLoginError(t('login.invalidCredentials'))
      } else {
        router.refresh()
      }
    } catch {
      setLoginError(t('login.unexpectedError'))
    } finally {
      setLoginLoading(false)
    }
  }

  const features = [
    { icon: GraduationCap, labelKey: 'login.studentManagement', descKey: 'login.studentManagementDesc' },
    { icon: BookOpen, labelKey: 'login.teacherManagement', descKey: 'login.teacherManagementDesc' },
    { icon: Users, labelKey: 'login.attendanceTracking', descKey: 'login.attendanceTrackingDesc' },
    { icon: Shield, labelKey: 'login.gradeExamSystem', descKey: 'login.gradeExamSystemDesc' },
  ]

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Side - Branding / Feature Showcase */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute top-1/3 right-0 w-80 h-80 rounded-full bg-teal-400/15 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-72 h-72 rounded-full bg-emerald-400/10 blur-3xl" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-20">
          {/* Logo */}
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20 shadow-2xl">
              <School className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">{t('app.name')}</h1>
              <p className="text-emerald-200/70 text-sm font-medium">{t('app.fullTagline')}</p>
            </div>
          </div>

          {/* Hero Text */}
          <div className="mb-12">
            <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
              {t('login.manageYourSchool')}
              <br />
              <span className="text-emerald-200">{t('login.withConfidence')}</span>
            </h2>
            <p className="text-emerald-100/60 text-lg max-w-md leading-relaxed">
              {t('login.heroDescription')}
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-2 gap-3 max-w-lg">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div
                  key={i}
                  className="group bg-white/8 backdrop-blur-sm rounded-xl p-4 ring-1 ring-white/10 hover:bg-white/12 hover:ring-white/20 transition-all duration-300 hover:translate-y-[-2px]"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-400/20 flex items-center justify-center mb-3 group-hover:bg-emerald-400/30 transition-colors">
                    <Icon className="w-4.5 h-4.5 text-emerald-200" />
                  </div>
                  <p className="text-white font-semibold text-sm mb-0.5">{t(feature.labelKey)}</p>
                  <p className="text-emerald-200/50 text-xs">{t(feature.descKey)}</p>
                </div>
              )
            })}
          </div>

          {/* Bottom Stats */}
          <div className="mt-12 flex items-center gap-8 text-emerald-200/50">
            <div>
              <p className="text-2xl font-bold text-white">500+</p>
              <p className="text-xs">{t('login.studentsManaged')}</p>
            </div>
            <div className="w-px h-8 bg-emerald-400/20" />
            <div>
              <p className="text-2xl font-bold text-white">50+</p>
              <p className="text-xs">{t('login.activeTeachers')}</p>
            </div>
            <div className="w-px h-8 bg-emerald-400/20" />
            <div>
              <p className="text-2xl font-bold text-white">99%</p>
              <p className="text-xs">{t('login.uptime')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 relative">
        {/* Mobile branding */}
        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-600/20 ring-1 ring-emerald-500/20">
            <School className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-bold text-lg gradient-text">{t('app.name')}</span>
        </div>

        {/* Language Switcher */}
        <button
          onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
          className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
        >
          <Globe className="w-4 h-4" />
          {locale === 'fr' ? 'EN' : 'FR'}
        </button>

        <div className="w-full max-w-md">
          {/* Welcome back text */}
          <div className="mb-8">
            <div className="hidden lg:flex items-center gap-2 mb-6">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{t('login.welcomeBack')}</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-1.5">
              {t('login.signInTitle')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('login.signInSubtitle')}
            </p>
          </div>

          <Card className="border-border/50 shadow-card bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                {dbWarning && (
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 text-sm animate-[fadeIn_0.2s_ease-out]">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{t('login.dbWarning')}</p>
                      <p className="text-xs mt-0.5">{dbWarning}</p>
                    </div>
                  </div>
                )}
                {loginError && (
                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm animate-[fadeIn_0.2s_ease-out]">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-sm font-medium">
                    {t('login.emailAddress')}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="admin@school.edu"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="pl-10 h-11 bg-background/80 border-border/60 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password" className="text-sm font-medium">
                      {t('login.password')}
                    </Label>
                    <button type="button" className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors">
                      {t('login.forgotPassword')}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('login.enterPassword')}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-10 pr-10 h-11 bg-background/80 border-border/60 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all duration-200 font-medium rounded-lg group"
                  disabled={loginLoading}
                >
                  {loginLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('login.signingIn')}
                    </>
                  ) : (
                    <>
                      {t('login.signIn')}
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground/50 mt-6">
            {t('login.termsAgreement')}
          </p>
        </div>
      </div>
    </div>
  )
}
