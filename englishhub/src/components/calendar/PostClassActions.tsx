'use client'

import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  ClipboardList,
  CreditCard,
  CheckCircle,
} from 'lucide-react'
import type { ScheduledClassWithDetails } from '@/types/database'

interface PostClassActionsProps {
  open: boolean
  onClose: () => void
  classData: ScheduledClassWithDetails | null
}

export function PostClassActions({ open, onClose, classData }: PostClassActionsProps) {
  const router = useRouter()

  if (!classData) return null

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-success-light">
            <CheckCircle className="h-6 w-6 text-success" strokeWidth={1.75} />
          </div>
          <DialogTitle className="text-center font-heading text-xl">
            ¡Clase completada!
          </DialogTitle>
          <DialogDescription className="text-center">
            {classData.title}
            {classData.student && ` con ${classData.student.full_name}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          {classData.lesson_id && (
            <Button
              variant="outline"
              className="btn-secondary w-full justify-start gap-3 h-auto py-3"
              onClick={() => {
                router.push(`/lessons/${classData.lesson_id}`)
                onClose()
              }}
            >
              <Sparkles className="h-5 w-5 text-accent-500" strokeWidth={1.75} />
              <div className="text-left">
                <p className="text-sm font-medium">Generar resumen de la lección</p>
                <p className="text-xs text-neutral-400">Resumen AI para compartir con el estudiante</p>
              </div>
            </Button>
          )}

          {classData.student_id && (
            <Button
              variant="outline"
              className="btn-secondary w-full justify-start gap-3 h-auto py-3"
              onClick={() => {
                router.push('/assignments/new')
                onClose()
              }}
            >
              <ClipboardList className="h-5 w-5 text-primary-600" strokeWidth={1.75} />
              <div className="text-left">
                <p className="text-sm font-medium">Crear tarea para el estudiante</p>
                <p className="text-xs text-neutral-400">Asignar ejercicios de práctica</p>
              </div>
            </Button>
          )}

          {classData.student_id && (
            <Button
              variant="outline"
              className="btn-secondary w-full justify-start gap-3 h-auto py-3"
              onClick={() => {
                router.push('/payments')
                onClose()
              }}
            >
              <CreditCard className="h-5 w-5 text-accent-600" strokeWidth={1.75} />
              <div className="text-left">
                <p className="text-sm font-medium">Registrar pago</p>
                <p className="text-xs text-neutral-400">Registrar pago del estudiante</p>
              </div>
            </Button>
          )}

          <Button
            variant="ghost"
            className="w-full text-neutral-500"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
