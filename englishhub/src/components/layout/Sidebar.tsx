'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  ClipboardList,
  Users,
  CreditCard,
  Settings,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { getLocaleFromClientPathname, toLocalizedPath } from '@/i18n/navigation'

interface SidebarProps {
  tutorName?: string
  tutorEmail?: string
}

export function Sidebar({ tutorName = 'Profesor', tutorEmail }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('DashboardNav')
  const locale = getLocaleFromClientPathname(pathname)

  const navSections = [
    {
      label: t('general'),
      items: [
        { href: '/', icon: LayoutDashboard, label: t('dashboard') },
        { href: '/calendar', icon: Calendar, label: t('calendar') },
      ],
    },
    {
      label: t('teaching'),
      items: [
        { href: '/lessons', icon: BookOpen, label: t('lessons') },
        { href: '/assignments', icon: ClipboardList, label: t('assignments') },
      ],
    },
    {
      label: t('management'),
      items: [
        { href: '/students', icon: Users, label: t('students') },
        { href: '/payments', icon: CreditCard, label: t('payments') },
      ],
    },
    {
      label: t('account'),
      items: [
        { href: '/settings', icon: Settings, label: t('settings') },
      ],
    },
  ]

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(toLocalizedPath('/login', locale))
  }

  return (
    <aside className="flex h-screen w-[260px] flex-col bg-[var(--bg-sidebar)] text-white">
      {/* Logo */}
      <div className="px-6 py-6">
        <h1 className="font-heading text-xl tracking-tight">EnglishHub</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3">
        {navSections.map((section) => (
          <div key={section.label} className="mb-6">
            <p className="mb-2 mt-4 px-4 text-[11px] font-medium uppercase tracking-wider text-white/40">
              {section.label}
            </p>
            {section.items.map((item) => {
              const localizedHref = toLocalizedPath(item.href, locale)
              const isActive = pathname === localizedHref
              return (
                <Link
                  key={item.href}
                  href={localizedHref}
                  className={cn(
                    'sidebar-item',
                    isActive && 'sidebar-item-active'
                  )}
                >
                  <item.icon className="h-5 w-5" strokeWidth={1.75} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Bottom — User info + Logout */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-medium">
            {tutorName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-white">{tutorName}</p>
            {tutorEmail && (
              <p className="truncate text-xs text-white/50">{tutorEmail}</p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="rounded-md p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            title={t('logout')}
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </aside>
  )
}
