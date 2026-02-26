'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  BookOpen,
  MoreHorizontal,
  Pencil,
  Play,
  Copy,
  Trash2,
  ClipboardList,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLessons } from '@/hooks/useLessons'
import { SearchBar } from '@/components/shared/SearchBar'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import type { Lesson } from '@/types/database'

const levelLabel: Record<string, string> = {
  beginner: 'Beginner',
  elementary: 'Elementary',
  intermediate: 'Intermediate',
  upper_intermediate: 'Upper Int.',
  advanced: 'Advanced',
}

const categoryLabel: Record<string, string> = {
  grammar: 'Gramática',
  vocabulary: 'Vocabulario',
  conversation: 'Conversación',
  reading: 'Lectura',
  writing: 'Escritura',
}

const categoryGradients: Record<string, string> = {
  grammar: 'from-primary-700 to-primary-900',
  vocabulary: 'from-accent-500 to-accent-700',
  conversation: 'from-emerald-600 to-emerald-800',
  reading: 'from-blue-600 to-blue-800',
  writing: 'from-purple-600 to-purple-800',
}

export default function LessonsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')
  const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { lessons, loading, createLesson, deleteLesson, duplicateLesson } = useLessons({
    category: categoryFilter,
    level: levelFilter,
    search,
  })

  const handleNewLesson = async () => {
    try {
      const lesson = await createLesson({ title: 'Sin título' })
      router.push(`/lessons/${lesson.id}`)
    } catch {
      // Handle error
    }
  }

  const handleDelete = async () => {
    if (!deletingLesson) return
    setDeleteLoading(true)
    try {
      await deleteLesson(deletingLesson.id)
      setDeletingLesson(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDuplicate = async (lesson: Lesson) => {
    try {
      await duplicateLesson(lesson.id)
    } catch {
      // Handle error
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-heading text-2xl text-neutral-800 lg:text-3xl">Lecciones</h1>
        <Button onClick={handleNewLesson} className="btn-primary gap-2">
          <Plus className="h-4 w-4" strokeWidth={1.75} />
          Nueva Lección
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar lección..." />
        </div>
        <div className="flex gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="grammar">Gramática</SelectItem>
              <SelectItem value="vocabulary">Vocabulario</SelectItem>
              <SelectItem value="conversation">Conversación</SelectItem>
              <SelectItem value="reading">Lectura</SelectItem>
              <SelectItem value="writing">Escritura</SelectItem>
            </SelectContent>
          </Select>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Nivel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="elementary">Elementary</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="upper_intermediate">Upper Int.</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : lessons.length === 0 ? (
        <div className="card-base">
          <EmptyState
            icon={BookOpen}
            title={search || categoryFilter !== 'all' || levelFilter !== 'all' ? 'No se encontraron lecciones' : 'Crea tu primera lección'}
            description={search ? 'Intenta con otros filtros.' : 'Diseña lecciones interactivas con vocabulario, gramática y ejercicios.'}
            actionLabel={!search && categoryFilter === 'all' ? 'Crear lección' : undefined}
            onAction={!search && categoryFilter === 'all' ? handleNewLesson : undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              onEdit={() => router.push(`/lessons/${lesson.id}`)}
              onPresent={() => router.push(`/lessons/${lesson.id}/present`)}
              onDuplicate={() => handleDuplicate(lesson)}
              onDelete={() => setDeletingLesson(lesson)}
            />
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        open={!!deletingLesson}
        onClose={() => setDeletingLesson(null)}
        onConfirm={handleDelete}
        title="Eliminar lección"
        description={`¿Eliminar "${deletingLesson?.title}"? Se eliminarán todas las secciones. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        loading={deleteLoading}
        variant="danger"
      />
    </div>
  )
}

function LessonCard({
  lesson,
  onEdit,
  onPresent,
  onDuplicate,
  onDelete,
}: {
  lesson: Lesson
  onEdit: () => void
  onPresent: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  const gradient = categoryGradients[lesson.category || ''] || 'from-neutral-600 to-neutral-800'

  return (
    <div
      className="card-base cursor-pointer overflow-hidden p-0"
      onClick={onEdit}
    >
      {/* Cover */}
      <div className={`relative h-32 bg-gradient-to-br ${gradient}`}>
        <div className="absolute bottom-3 left-4">
          {lesson.is_published ? (
            <span className="badge-success">Publicada</span>
          ) : (
            <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium text-white">Borrador</span>
          )}
        </div>
        <div className="absolute right-3 top-3" onClick={(e) => e.stopPropagation()}>
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
              <DropdownMenuItem onClick={onPresent}>
                <Play className="mr-2 h-4 w-4" strokeWidth={1.75} />
                Presentar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="mr-2 h-4 w-4" strokeWidth={1.75} />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-error focus:text-error">
                <Trash2 className="mr-2 h-4 w-4" strokeWidth={1.75} />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-heading text-lg text-neutral-800 line-clamp-1">{lesson.title}</h3>
        {lesson.description && (
          <p className="mt-1 text-sm text-neutral-500 line-clamp-2">{lesson.description}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {lesson.level && (
            <span className="badge-info">{levelLabel[lesson.level]}</span>
          )}
          {lesson.category && (
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
              {categoryLabel[lesson.category] || lesson.category}
            </span>
          )}
          {lesson.tags?.map((tag) => (
            <span key={tag} className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
