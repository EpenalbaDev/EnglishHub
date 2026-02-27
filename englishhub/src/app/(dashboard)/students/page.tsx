'use client'

import { useState, useMemo } from 'react'
import { Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useStudents } from '@/hooks/useStudents'
import { StudentTable } from '@/components/students/StudentTable'
import { StudentForm, type StudentFormData } from '@/components/students/StudentForm'
import { SearchBar } from '@/components/shared/SearchBar'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import type { Student } from '@/types/database'

export default function StudentsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [accessLinkStudent, setAccessLinkStudent] = useState<Student | null>(null)
  const [accessLinkHours, setAccessLinkHours] = useState('24')
  const [accessLinkValue, setAccessLinkValue] = useState('')
  const [accessLinkExpiresAt, setAccessLinkExpiresAt] = useState('')
  const [accessLinkLoading, setAccessLinkLoading] = useState(false)
  const [accessLinkError, setAccessLinkError] = useState('')
  const [accessLinkCopied, setAccessLinkCopied] = useState(false)

  const { students, loading, createStudent, updateStudent, deleteStudent } = useStudents({
    status: statusFilter,
    level: levelFilter,
    search,
  })

  // Debounced search via useMemo filtering (already handled by hook, but also local filter for instant feedback)
  const filteredStudents = useMemo(() => {
    if (!search) return students
    const q = search.toLowerCase()
    return students.filter(
      s => s.full_name.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)
    )
  }, [students, search])

  const handleCreate = async (data: StudentFormData) => {
    await createStudent(data)
  }

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setFormOpen(true)
  }

  const handleUpdate = async (data: StudentFormData) => {
    if (!editingStudent) return
    await updateStudent(editingStudent.id, data)
    setEditingStudent(null)
  }

  const handleDelete = async () => {
    if (!deletingStudent) return
    setDeleteLoading(true)
    try {
      await deleteStudent(deletingStudent.id)
      setDeletingStudent(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleOpenAccessLinkDialog = (student: Student) => {
    setAccessLinkStudent(student)
    setAccessLinkHours('24')
    setAccessLinkValue('')
    setAccessLinkExpiresAt('')
    setAccessLinkError('')
    setAccessLinkCopied(false)
  }

  const handleGenerateAccessLink = async () => {
    if (!accessLinkStudent) return

    const parsedHours = Number(accessLinkHours)
    const expiresInHours = Number.isFinite(parsedHours)
      ? Math.min(Math.max(Math.floor(parsedHours), 1), 24 * 30)
      : 24

    setAccessLinkLoading(true)
    setAccessLinkError('')
    setAccessLinkCopied(false)

    try {
      const response = await fetch(`/api/students/${accessLinkStudent.id}/access-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresInHours }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || 'No se pudo generar el link de acceso.')
      }

      setAccessLinkValue(payload.url)
      setAccessLinkExpiresAt(payload.expiresAt)
    } catch (err) {
      setAccessLinkError(err instanceof Error ? err.message : 'No se pudo generar el link de acceso.')
    } finally {
      setAccessLinkLoading(false)
    }
  }

  const handleCopyAccessLink = async () => {
    if (!accessLinkValue) return
    await navigator.clipboard.writeText(accessLinkValue)
    setAccessLinkCopied(true)
    setTimeout(() => setAccessLinkCopied(false), 2000)
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-heading text-2xl text-neutral-800 lg:text-3xl">Estudiantes</h1>
        <Button
          onClick={() => { setEditingStudent(null); setFormOpen(true) }}
          className="btn-primary gap-2"
        >
          <Plus className="h-4 w-4" strokeWidth={1.75} />
          Nuevo Estudiante
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre o email..."
          />
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
            </SelectContent>
          </Select>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Nivel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los niveles</SelectItem>
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
        <TableSkeleton rows={5} />
      ) : filteredStudents.length === 0 ? (
        <div className="card-base">
          <EmptyState
            icon={Users}
            title={search || statusFilter !== 'all' || levelFilter !== 'all'
              ? 'No se encontraron estudiantes'
              : 'Aún no tienes estudiantes'
            }
            description={search || statusFilter !== 'all' || levelFilter !== 'all'
              ? 'Intenta con otros filtros de búsqueda.'
              : 'Agrega tu primer estudiante para comenzar.'
            }
            actionLabel={!search && statusFilter === 'all' && levelFilter === 'all' ? 'Agregar tu primer estudiante' : undefined}
            onAction={!search && statusFilter === 'all' && levelFilter === 'all' ? () => { setEditingStudent(null); setFormOpen(true) } : undefined}
          />
        </div>
      ) : (
        <StudentTable
          students={filteredStudents}
          onEdit={handleEdit}
          onDelete={setDeletingStudent}
          onGenerateAccessLink={handleOpenAccessLinkDialog}
        />
      )}

      {/* Student Form Modal */}
      <StudentForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingStudent(null) }}
        onSubmit={editingStudent ? handleUpdate : handleCreate}
        student={editingStudent}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingStudent}
        onClose={() => setDeletingStudent(null)}
        onConfirm={handleDelete}
        title="Eliminar estudiante"
        description={`¿Estás seguro de que quieres eliminar a ${deletingStudent?.full_name}? Esta acción no se puede deshacer y se eliminarán todos sus datos asociados.`}
        confirmLabel="Eliminar"
        loading={deleteLoading}
        variant="danger"
      />

      <Dialog open={!!accessLinkStudent} onOpenChange={(open) => !open && setAccessLinkStudent(null)}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Link de acceso para estudiante</DialogTitle>
            <DialogDescription>
              Genera un link de acceso para {accessLinkStudent?.full_name}. El estudiante podra entrar sin registrarse.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="access-link-hours">Expiracion (horas)</Label>
              <Input
                id="access-link-hours"
                type="number"
                min={1}
                max={24 * 30}
                value={accessLinkHours}
                onChange={(event) => setAccessLinkHours(event.target.value)}
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-neutral-500">Minimo 1 hora, maximo 720 horas (30 dias).</p>
            </div>

            <Button onClick={handleGenerateAccessLink} disabled={accessLinkLoading} className="btn-primary">
              {accessLinkLoading ? 'Generando...' : 'Generar link'}
            </Button>

            {accessLinkError && (
              <p className="rounded-md bg-error-light px-3 py-2 text-sm text-error">{accessLinkError}</p>
            )}

            {accessLinkValue && (
              <div className="space-y-2 rounded-md border border-neutral-200 p-3">
                <Label htmlFor="access-link-value">Link generado</Label>
                <Input id="access-link-value" readOnly value={accessLinkValue} />
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-neutral-500">
                    Expira: {new Date(accessLinkExpiresAt).toLocaleString('es-PA')}
                  </p>
                  <Button variant="outline" onClick={handleCopyAccessLink} className="btn-secondary">
                    {accessLinkCopied ? 'Copiado' : 'Copiar link'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" className="btn-secondary" onClick={() => setAccessLinkStudent(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
