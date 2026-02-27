'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { PreferencesSync } from '@/components/providers/preferences-sync'
import type { UserPreferences } from '@/lib/preferences'

interface DashboardShellProps {
  children: React.ReactNode
  tutorName: string
  tutorEmail: string
  tutorAvatarUrl: string | null
  preferences: UserPreferences
  isSuperAdmin: boolean
}

export function DashboardShell({
  children,
  tutorName,
  tutorEmail,
  tutorAvatarUrl,
  preferences,
  isSuperAdmin,
}: DashboardShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <PreferencesSync preferences={preferences} />
      {/* Sidebar — hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar
          tutorName={tutorName}
          tutorEmail={tutorEmail}
          tutorAvatarUrl={tutorAvatarUrl}
          isSuperAdmin={isSuperAdmin}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <Header
          tutorName={tutorName}
          tutorEmail={tutorEmail}
          tutorAvatarUrl={tutorAvatarUrl}
          isSuperAdmin={isSuperAdmin}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1200px] p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
