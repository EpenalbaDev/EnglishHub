'use client'

import { useState } from 'react'
import { Mail, Loader2, CheckCircle, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default function StudentLoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/student/dashboard`,
      },
    })

    if (authError) {
      setError(authError.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-neutral-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-600">
            <BookOpen className="h-7 w-7 text-white" strokeWidth={1.75} />
          </div>
          <h1 className="font-heading text-2xl text-neutral-800">HavenLanguage</h1>
          <p className="mt-1 text-sm text-neutral-500">Portal del Estudiante</p>
        </div>

        <div className="card-base">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle className="mx-auto h-12 w-12 text-success" strokeWidth={1.5} />
              <h2 className="mt-4 font-heading text-xl text-neutral-800">¡Revisa tu correo!</h2>
              <p className="mt-2 text-sm text-neutral-500">
                Enviamos un link de acceso a <strong>{email}</strong>. Haz clic en el link para entrar a tu portal.
              </p>
              <Button
                variant="outline"
                className="btn-secondary mt-6"
                onClick={() => { setSent(false); setEmail('') }}
              >
                Usar otro email
              </Button>
            </div>
          ) : (
            <>
              <h2 className="mb-2 font-heading text-xl text-neutral-800">Accede a tu portal</h2>
              <p className="mb-6 text-sm text-neutral-500">
                Ingresa tu email para recibir un link de acceso seguro.
              </p>

              {error && (
                <div className="mb-4 rounded-lg bg-error-light p-3 text-sm text-error">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-neutral-700">Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" strokeWidth={1.75} />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="btn-primary w-full gap-2" disabled={loading || !email.trim()}>
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
                  ) : (
                    <>Recibir link de acceso</>
                  )}
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-neutral-400">
          ¿Eres profesor? <a href="/login" className="text-primary-600 hover:text-primary-700 font-medium">Inicia sesión aquí</a>
        </p>
      </div>
    </div>
  )
}
