'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
  X,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { getLocaleFromClientPathname, toLocalizedPath } from '@/i18n/navigation'

interface MobileNavProps {
  open: boolean
  onClose: () => void
  tutorName?: string
  tutorEmail?: string
}

export function MobileNav({ open, onClose, tutorName = 'Profesor', tutorEmail }: MobileNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('DashboardNav')
  const locale = getLocaleFromClientPathname(pathname)

  const navItems = [
    { href: '/', icon: LayoutDashboard, label: t('dashboard') },
    { href: '/calendar', icon: Calendar, label: t('calendar') },
    { href: '/lessons', icon: BookOpen, label: t('lessons') },
    { href: '/assignments', icon: ClipboardList, label: t('assignments') },
    { href: '/students', icon: Users, label: t('students') },
    { href: '/payments', icon: CreditCard, label: t('payments') },
    { href: '/settings', icon: Settings, label: t('settings') },
  ]

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    onClose()
    router.push(toLocalizedPath('/login', locale))
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[280px] bg-[var(--bg-sidebar)] p-0 border-none [&>button]:hidden">
        <SheetHeader className="px-6 py-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-heading text-xl text-white">EnglishHub</SheetTitle>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" strokeWidth={1.75} />
            </button>
          </div>
        </SheetHeader>

        <nav className="flex-1 px-3">
          {navItems.map((item) => {
            const localizedHref = toLocalizedPath(item.href, locale)
            const isActive = pathname === localizedHref
            return (
              <Link
                key={item.href}
                href={localizedHref}
                onClick={onClose}
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
        </nav>

        <div className="mt-auto border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-medium text-white">
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
      </SheetContent>
    </Sheet>
  )
}
