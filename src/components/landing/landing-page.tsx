'use client'

import { useRef } from 'react'
import { useInView, motion } from 'framer-motion'
import { useTranslation } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  School,
  GraduationCap,
  BookOpen,
  Users,
  ClipboardCheck,
  FileText,
  DollarSign,
  Megaphone,
  ArrowRight,
  Globe,
  Star,
  CheckCircle2,
  BarChart3,
  ChevronRight,
} from 'lucide-react'

interface LandingPageProps {
  onGetStarted: () => void
}

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' },
  viewport: { once: true, margin: '-50px' },
}

const stagger = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
}

function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const { t, locale, setLocale } = useTranslation()

  const features = [
    { icon: GraduationCap, title: t('landing.features.studentManagement'), desc: t('landing.features.studentManagementDesc'), color: 'emerald' },
    { icon: BookOpen, title: t('landing.features.teacherManagement'), desc: t('landing.features.teacherManagementDesc'), color: 'teal' },
    { icon: ClipboardCheck, title: t('landing.features.attendanceTracking'), desc: t('landing.features.attendanceTrackingDesc'), color: 'green' },
    { icon: FileText, title: t('landing.features.examGrading'), desc: t('landing.features.examGradingDesc'), color: 'lime' },
    { icon: DollarSign, title: t('landing.features.financialManagement'), desc: t('landing.features.financialManagementDesc'), color: 'emerald' },
    { icon: Megaphone, title: t('landing.features.communication'), desc: t('landing.features.communicationDesc'), color: 'teal' },
  ] as const

  const stats = [
    { value: '500+', label: t('landing.stats.students'), icon: GraduationCap },
    { value: '50+', label: t('landing.stats.teachers'), icon: BookOpen },
    { value: '25+', label: t('landing.stats.schools'), icon: School },
    { value: '99.9%', label: t('landing.stats.uptime'), icon: BarChart3 },
  ]

  const testimonials = [
    { quote: t('landing.testimonials.quote1'), author: t('landing.testimonials.author1'), role: t('landing.testimonials.role1') },
    { quote: t('landing.testimonials.quote2'), author: t('landing.testimonials.author2'), role: t('landing.testimonials.role2') },
    { quote: t('landing.testimonials.quote3'), author: t('landing.testimonials.author3'), role: t('landing.testimonials.role3') },
  ]

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const iconColorMap: Record<string, string> = {
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    teal: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    lime: 'bg-lime-100 dark:bg-lime-900/30 text-lime-600 dark:text-lime-400',
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-600/20 ring-1 ring-emerald-500/20">
              <School className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-foreground tracking-tight">Greenfield</span>
          </div>

          {/* Nav Links - hidden on mobile */}
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollTo('features')} className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
              {locale === 'fr' ? 'Fonctionnalités' : 'Features'}
            </button>
            <button onClick={() => scrollTo('testimonials')} className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
              {locale === 'fr' ? 'Témoignages' : 'Testimonials'}
            </button>
            <button onClick={() => scrollTo('contact')} className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
              {locale === 'fr' ? 'Contact' : 'Contact'}
            </button>
          </div>

          {/* Right side: Language + CTA */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <button
              onClick={() => setLocale(locale === 'en' ? 'fr' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-border transition-all duration-200 bg-background/50"
            >
              <Globe className="w-3.5 h-3.5" />
              {locale === 'en' ? 'FR' : 'EN'}
            </button>

            {/* Get Started CTA */}
            <Button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all duration-200 font-medium rounded-lg hidden sm:flex"
            >
              {t('landing.hero.getStarted')}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-16 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-green-50/50 to-teal-50/30 dark:from-emerald-950/30 dark:via-green-950/20 dark:to-teal-950/10" />
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-emerald-200/30 dark:bg-emerald-800/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-teal-200/20 dark:bg-teal-800/10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-900/30 border border-emerald-200/50 dark:border-emerald-800/30 mb-6">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  {locale === 'fr' ? 'Plateforme #1' : '#1 Platform'}
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
                {t('landing.hero.title1')}
                <br />
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {t('landing.hero.title2')}
                </span>
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
                {t('landing.hero.subtitle')}
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={onGetStarted}
                  size="lg"
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/35 transition-all duration-200 font-semibold rounded-xl h-12 px-8 group"
                >
                  {t('landing.hero.getStarted')}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                </Button>
                <Button
                  onClick={() => scrollTo('features')}
                  variant="outline"
                  size="lg"
                  className="border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all duration-200 font-semibold rounded-xl h-12 px-8"
                >
                  {t('landing.hero.learnMore')}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="flex items-center gap-4 mt-8">
                <div className="flex -space-x-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-background flex items-center justify-center">
                      <Users className="w-3.5 h-3.5 text-white" />
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-0.5">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {locale === 'fr' ? '25+ écoles nous font confiance' : '25+ schools trust us'}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Right - Decorative cards */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
              className="hidden lg:block relative"
            >
              <div className="relative w-full h-[480px]">
                {/* Main floating card */}
                <div className="absolute top-8 right-0 w-72 bg-white dark:bg-card rounded-2xl shadow-2xl border border-border/40 p-5 transform rotate-1 hover:rotate-0 transition-transform duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{locale === 'fr' ? 'Étudiants' : 'Students'}</p>
                      <p className="text-xs text-muted-foreground">{locale === 'fr' ? 'Gestion complète' : 'Full management'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-full overflow-hidden">
                      <div className="h-full w-4/5 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full" />
                    </div>
                    <p className="text-[10px] text-muted-foreground">{locale === 'fr' ? '500+ étudiants actifs' : '500+ active students'}</p>
                  </div>
                </div>

                {/* Second floating card */}
                <div className="absolute top-44 left-4 w-64 bg-white dark:bg-card rounded-2xl shadow-xl border border-border/40 p-4 transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                      <ClipboardCheck className="w-4.5 h-4.5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{locale === 'fr' ? 'Présence' : 'Attendance'}</p>
                      <p className="text-xs text-muted-foreground">87%</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {[85, 92, 78, 95, 88, 0, 0].map((v, i) => (
                      <div key={i} className="h-8 rounded-sm overflow-hidden bg-muted/30 dark:bg-muted/10">
                        {v > 0 && (
                          <div
                            className="w-full bg-gradient-to-t from-teal-500 to-teal-400 rounded-sm"
                            style={{ height: `${v}%`, marginTop: `${100 - v}%` }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Third floating card - stats badge */}
                <div className="absolute bottom-8 right-12 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl shadow-xl p-5 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-emerald-200" />
                    <span className="text-xs font-medium text-emerald-200 uppercase tracking-wider">
                      {locale === 'fr' ? 'Performance' : 'Performance'}
                    </span>
                  </div>
                  <p className="text-3xl font-bold">99.9%</p>
                  <p className="text-xs text-emerald-200/80">{t('landing.stats.uptime')}</p>
                </div>

                {/* Decorative dots */}
                <div className="absolute top-0 left-1/3 grid grid-cols-4 gap-3 opacity-20">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-emerald-500" />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" className="py-20 sm:py-28 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-900/30 border border-emerald-200/50 dark:border-emerald-800/30 mb-4">
              <Star className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                {locale === 'fr' ? 'Fonctionnalités' : 'Features'}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              {t('landing.features.title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <AnimatedSection key={i} delay={i * 0.1}>
                  <Card className="h-full border-border/40 hover:border-emerald-200 dark:hover:border-emerald-800/50 hover:shadow-xl transition-all duration-300 group bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-xl ${iconColorMap[feature.color]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.desc}
                      </p>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== STATS SECTION ===== */}
      <section className="py-20 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-teal-400/15 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              {locale === 'fr' ? 'Chiffres clés' : 'By the Numbers'}
            </h2>
            <p className="text-emerald-200/70 text-lg">
              {locale === 'fr' ? "L'impact que nous avons sur l'éducation" : 'The impact we make in education'}
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => {
              const Icon = stat.icon
              return (
                <AnimatedSection key={i} delay={i * 0.1}>
                  <div className="text-center p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-emerald-200" />
                    </div>
                    <p className="text-3xl sm:text-4xl font-bold text-white mb-1">{stat.value}</p>
                    <p className="text-sm text-emerald-200/70 font-medium">{stat.label}</p>
                  </div>
                </AnimatedSection>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS SECTION ===== */}
      <section id="testimonials" className="py-20 sm:py-28 bg-muted/30 dark:bg-muted/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-900/30 border border-emerald-200/50 dark:border-emerald-800/30 mb-4">
              <Star className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                {locale === 'fr' ? 'Témoignages' : 'Testimonials'}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              {t('landing.testimonials.title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('landing.testimonials.subtitle')}
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <AnimatedSection key={i} delay={i * 0.15}>
                <Card className="h-full border-border/40 hover:border-emerald-200 dark:hover:border-emerald-800/50 hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-0.5 mb-4">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed mb-6 italic">
                      {testimonial.quote}
                    </p>
                    <div className="flex items-center gap-3 pt-4 border-t border-border/40">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                        {testimonial.author.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{testimonial.author}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section id="contact" className="py-20 sm:py-28 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="relative rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 p-8 sm:p-12 lg:p-16 text-center overflow-hidden">
              {/* Decorative */}
              <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-emerald-500/20 blur-3xl" />
              <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-teal-400/15 blur-3xl" />

              <div className="relative">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  {t('landing.cta.title')}
                </h2>
                <p className="text-lg text-emerald-100/70 mb-8 max-w-2xl mx-auto">
                  {t('landing.cta.subtitle')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={onGetStarted}
                    size="lg"
                    className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg shadow-emerald-900/30 font-semibold rounded-xl h-12 px-8 group transition-all duration-200"
                  >
                    {t('landing.cta.startNow')}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 font-semibold rounded-xl h-12 px-8 transition-all duration-200"
                  >
                    {t('landing.cta.contactSales')}
                  </Button>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-muted/50 dark:bg-muted/20 border-t border-border/40 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-md shadow-emerald-600/20">
                  <School className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-foreground">Greenfield</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                {t('landing.footer.description')}
              </p>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">{t('landing.footer.platform')}</h4>
              <ul className="space-y-2">
                <li><button onClick={() => scrollTo('features')} className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">{t('landing.footer.dashboard')}</button></li>
                <li><button onClick={() => scrollTo('features')} className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">{t('landing.footer.students')}</button></li>
                <li><button onClick={() => scrollTo('features')} className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">{t('landing.footer.finances')}</button></li>
                <li><button onClick={() => scrollTo('features')} className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">{t('landing.footer.attendance')}</button></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">{t('landing.footer.company')}</h4>
              <ul className="space-y-2">
                <li><span className="text-sm text-muted-foreground">{t('landing.footer.about')}</span></li>
                <li><span className="text-sm text-muted-foreground">{t('landing.footer.careers')}</span></li>
                <li><span className="text-sm text-muted-foreground">{t('landing.footer.contact')}</span></li>
                <li><span className="text-sm text-muted-foreground">{t('landing.footer.blog')}</span></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">{t('landing.footer.legal')}</h4>
              <ul className="space-y-2">
                <li><span className="text-sm text-muted-foreground">{t('landing.footer.privacy')}</span></li>
                <li><span className="text-sm text-muted-foreground">{t('landing.footer.terms')}</span></li>
                <li><span className="text-sm text-muted-foreground">{t('landing.footer.cookies')}</span></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              &copy; 2025 Greenfield Academy. {t('landing.footer.rights')}
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setLocale(locale === 'en' ? 'fr' : 'en')}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                {locale === 'en' ? 'Français' : 'English'}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
