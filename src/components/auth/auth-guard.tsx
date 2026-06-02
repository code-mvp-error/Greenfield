'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { LoginPage } from '@/components/auth/login-page'
import { LandingPage } from '@/components/landing/landing-page'
import { Loader2 } from 'lucide-react'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [showLogin, setShowLogin] = useState(false)

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-600/20 animate-pulse">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Greenfield</p>
            <p className="text-xs text-muted-foreground mt-0.5">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    if (showLogin) {
      return <LoginPage />
    }
    return <LandingPage onGetStarted={() => setShowLogin(true)} />
  }

  return <>{children}</>
}
