'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, BookOpen, Link as LinkIcon, Mail } from 'lucide-react'

export default function StudentLoginPage() {
  const searchParams = useSearchParams()
  const errorCode = searchParams.get('error')
  const errorMessage = useMemo(() => {
    if (errorCode === 'link_expired') return 'Este link vencio o ya no es valido. Pidele a tu profesor uno nuevo.'
    if (errorCode === 'student_without_email') return 'Este estudiante no tiene email configurado. Tu profesor debe agregarlo.'
    if (errorCode === 'magic_link_failed') return 'No se pudo generar la sesion. Pidele a tu profesor generar un link nuevo.'
    if (errorCode === 'verify_failed') return 'No se pudo verificar el link de acceso. Pidele a tu profesor generar uno nuevo.'
    return null
  }, [errorCode])

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-primary-50 to-neutral-50 px-4">
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
          <h2 className="mb-2 font-heading text-xl text-neutral-800">Acceso por link del profesor</h2>
          <p className="mb-6 text-sm text-neutral-500">
            Tu profesor te comparte un link privado de acceso. Abre ese link y entraras automaticamente a tu portal.
          </p>

          {errorMessage && (
            <div className="mb-4 rounded-lg bg-error-light p-3 text-sm text-error">
              <p className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
                <span>{errorMessage}</span>
              </p>
            </div>
          )}

          <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
            <p className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-primary-600" strokeWidth={1.75} />
              Si no tienes link, solicitale uno nuevo a tu profesor.
            </p>
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary-600" strokeWidth={1.75} />
              El link puede llegar por WhatsApp o correo.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-neutral-400">
          ¿Eres profesor? <a href="/login" className="text-primary-600 hover:text-primary-700 font-medium">Inicia sesión aquí</a>
        </p>
      </div>
    </div>
  )
}
