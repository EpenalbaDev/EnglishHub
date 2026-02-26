'use client'

import { useState, useMemo } from 'react'
import { Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
    </div>
  )
}
