'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  ClipboardList,
  MoreHorizontal,
  Pencil,
  BarChart3,
  Copy,
  Share2,
  Link as LinkIcon,
  Power,
  Trash2,
  Check,
  Calendar,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAssignments } from '@/hooks/useAssignments'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { formatDate } from '@/lib/utils'
import type { Assignment } from '@/types/database'

export default function AssignmentsPage() {
  const router = useRouter()
  const { assignments, loading, deleteAssignment, toggleActive, getShareUrl } = useAssignments()
  const [deletingAssignment, setDeletingAssignment] = useState<Assignment | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deletingAssignment) return
    setDeleteLoading(true)
    try {
      await deleteAssignment(deletingAssignment.id)
      setDeletingAssignment(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleCopyLink = async (assignment: Assignment) => {
    const url = getShareUrl(assignment.public_token)
    await navigator.clipboard.writeText(url)
    setCopiedId(assignment.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleShareWhatsApp = (assignment: Assignment) => {
    const url = getShareUrl(assignment.public_token)
    const text = encodeURIComponent(`📚 Tarea: ${assignment.title}\n${url}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-heading text-2xl text-neutral-800 lg:text-3xl">Tareas</h1>
        <Button onClick={() => router.push('/assignments/new')} className="btn-primary gap-2">
          <Plus className="h-4 w-4" strokeWidth={1.75} />
          Nueva Tarea
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <div className="card-base">
          <EmptyState
            icon={ClipboardList}
            title="Crea tu primera tarea"
            description="Crea tareas con ejercicios y compártelas con tus estudiantes por link."
            actionLabel="Crear tarea"
            onAction={() => router.push('/assignments/new')}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              copied={copiedId === assignment.id}
              onEdit={() => router.push(`/assignments/${assignment.id}`)}
              onResults={() => router.push(`/assignments/${assignment.id}`)}
              onCopyLink={() => handleCopyLink(assignment)}
              onShareWhatsApp={() => handleShareWhatsApp(assignment)}
              onToggleActive={() => toggleActive(assignment.id)}
              onDelete={() => setDeletingAssignment(assignment)}
            />
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        open={!!deletingAssignment}
        onClose={() => setDeletingAssignment(null)}
        onConfirm={handleDelete}
        title="Eliminar tarea"
        description={`¿Eliminar "${deletingAssignment?.title}"? Se eliminarán todos los ejercicios y submissions. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        loading={deleteLoading}
        variant="danger"
      />
    </div>
  )
}

function AssignmentCard({
  assignment,
  copied,
  onEdit,
  onResults,
  onCopyLink,
  onShareWhatsApp,
  onToggleActive,
  onDelete,
}: {
  assignment: Assignment
  copied: boolean
  onEdit: () => void
  onResults: () => void
  onCopyLink: () => void
  onShareWhatsApp: () => void
  onToggleActive: () => void
  onDelete: () => void
}) {
  return (
    <div className="card-base cursor-pointer overflow-hidden p-0" onClick={onEdit}>
      {/* Top strip */}
      <div className="relative bg-gradient-to-br from-primary-700 to-primary-900 px-4 py-4">
        <div className="flex items-start justify-between">
          <div>
            <span className={assignment.is_active ? 'badge-success' : 'badge-warning'}>
              {assignment.is_active ? 'Activa' : 'Inactiva'}
            </span>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/70 hover:bg-white/20 hover:text-white">
                  <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="mr-2 h-4 w-4" strokeWidth={1.75} />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onResults}>
                  <BarChart3 className="mr-2 h-4 w-4" strokeWidth={1.75} />
                  Ver resultados
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onCopyLink}>
                  <Copy className="mr-2 h-4 w-4" strokeWidth={1.75} />
                  {copied ? 'Copiado!' : 'Copiar link'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onShareWhatsApp}>
                  <Share2 className="mr-2 h-4 w-4" strokeWidth={1.75} />
                  Compartir WhatsApp
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onToggleActive}>
                  <Power className="mr-2 h-4 w-4" strokeWidth={1.75} />
                  {assignment.is_active ? 'Desactivar' : 'Activar'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-error focus:text-error">
                  <Trash2 className="mr-2 h-4 w-4" strokeWidth={1.75} />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-heading text-lg text-neutral-800 line-clamp-1">{assignment.title}</h3>
        {assignment.description && (
          <p className="mt-1 text-sm text-neutral-500 line-clamp-2">{assignment.description}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-neutral-400">
          {assignment.due_date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />
              {formatDate(assignment.due_date)}
            </span>
          )}
          {assignment.lesson_id && (
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />
              Lección asociada
            </span>
          )}
        </div>

        {/* Quick share */}
        <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            className="btn-secondary h-8 flex-1 gap-1.5 text-xs"
            onClick={onCopyLink}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <LinkIcon className="h-3.5 w-3.5" strokeWidth={1.75} />}
            {copied ? 'Copiado' : 'Copiar link'}
          </Button>
        </div>
      </div>
    </div>
  )
}
