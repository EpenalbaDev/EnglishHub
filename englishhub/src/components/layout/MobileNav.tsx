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
  Shield,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn, getInitials } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { getLocaleFromClientPathname, toLocalizedPath } from '@/i18n/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface MobileNavProps {
  open: boolean
  onClose: () => void
  tutorName?: string
  tutorEmail?: string
  tutorAvatarUrl?: string | null
  isSuperAdmin?: boolean
}

export function MobileNav({
  open,
  onClose,
  tutorName = 'Profesor',
  tutorEmail,
  tutorAvatarUrl,
  isSuperAdmin = false,
}: MobileNavProps) {
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
    ...(isSuperAdmin ? [{ href: '/super-admin', icon: Shield, label: t('superAdmin') }] : []),
  ]

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    onClose()
    router.push(toLocalizedPath('/login', locale))
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[280px] bg-(--bg-sidebar) p-0 border-none [&>button]:hidden">
        <SheetHeader className="px-6 py-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-heading text-xl text-white">HavenLanguage</SheetTitle>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Cerrar menú"
              title="Cerrar menú"
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
            <Avatar className="h-9 w-9 bg-white/10">
              {tutorAvatarUrl && <AvatarImage src={tutorAvatarUrl} alt={tutorName} />}
              <AvatarFallback className="bg-white/10 text-white text-sm font-medium">
                {getInitials(tutorName)}
              </AvatarFallback>
            </Avatar>
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
