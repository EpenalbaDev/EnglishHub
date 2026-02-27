'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'
import { getLocaleFromClientPathname, toLocalizedPath } from '@/i18n/navigation'

export default function LoginPage() {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('Auth')
  const locale = getLocaleFromClientPathname(pathname)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(t('invalidCredentials'))
      setLoading(false)
      return
    }

    router.push(toLocalizedPath('/', locale))
    router.refresh()
  }

  return (
    <div className="animate-fade-in">
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="font-heading text-3xl text-primary-800">HavenLanguage</h1>
        <p className="mt-2 text-sm text-neutral-500">{t('tagline')}</p>
      </div>

      {/* Card */}
      <div className="rounded-xl bg-white p-8 shadow-card border border-neutral-100">
        <h2 className="font-heading text-xl text-neutral-800">{t('loginTitle')}</h2>
        <p className="mt-1 text-sm text-neutral-500">{t('loginSubtitle')}</p>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-md bg-error-light px-4 py-3 text-sm text-error">
            <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-neutral-700">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1.5 input-base"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-sm font-medium text-neutral-700">
              Contraseña
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1.5 input-base"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? t('loggingIn') : t('loginButton')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          {t('noAccount')}{' '}
          <Link href={toLocalizedPath('/register', locale)} className="font-medium text-primary-600 hover:text-primary-700">
            {t('registerLink')}
          </Link>
        </p>
      </div>
    </div>
  )
}
