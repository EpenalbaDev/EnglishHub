'use client'

import { Menu } from 'lucide-react'
import { MobileNav } from './MobileNav'
import { useState } from 'react'

interface HeaderProps {
  tutorName?: string
  tutorEmail?: string
  tutorAvatarUrl?: string | null
  isSuperAdmin?: boolean
}

export function Header({ tutorName, tutorEmail, tutorAvatarUrl, isSuperAdmin = false }: HeaderProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <>
      <header className="flex h-14 items-center border-b border-neutral-200 bg-white px-4 lg:hidden">
        <button
          onClick={() => setMobileNavOpen(true)}
          className="rounded-md p-2 text-neutral-600 transition-colors hover:bg-neutral-100"
          aria-label="Abrir menú"
          title="Abrir menú"
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <h1 className="ml-3 font-heading text-lg text-primary-800">HavenLanguage</h1>
      </header>
      <MobileNav
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        tutorName={tutorName}
        tutorEmail={tutorEmail}
        tutorAvatarUrl={tutorAvatarUrl}
        isSuperAdmin={isSuperAdmin}
      />
    </>
  )
}
