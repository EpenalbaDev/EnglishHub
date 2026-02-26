'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, CreditCard, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, getInitials, formatCurrency, formatDate } from '@/lib/utils'
import type { Student } from '@/types/database'
import Link from 'next/link'

const statusBadge: Record<Student['status'], string> = {
  active: 'badge-success',
  inactive: 'badge-error',
  trial: 'badge-warning',
}

const statusLabel: Record<Student['status'], string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  trial: 'Trial',
}

const levelLabel: Record<string, string> = {
  beginner: 'Beginner',
  elementary: 'Elementary',
  intermediate: 'Intermediate',
  upper_intermediate: 'Upper Int.',
  advanced: 'Advanced',
}

const avatarColors: Record<Student['status'], string> = {
  active: 'bg-primary-100 text-primary-700',
  inactive: 'bg-neutral-100 text-neutral-500',
  trial: 'bg-accent-100 text-accent-700',
}

interface StudentTableProps {
  students: Student[]
  onEdit: (student: Student) => void
  onDelete: (student: Student) => void
}

export function StudentTable({ students, onEdit, onDelete }: StudentTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-100">
      <Table>
        <TableHeader>
          <TableRow className="bg-neutral-50 hover:bg-neutral-50">
            <TableHead className="text-xs uppercase tracking-wider text-neutral-500">Nombre</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-neutral-500">Email</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-neutral-500">Nivel</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-neutral-500">Status</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-neutral-500">Tarifa</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-neutral-500 hidden lg:table-cell">Inscripción</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student, i) => (
            <TableRow
              key={student.id}
              className="group cursor-pointer transition-colors hover:bg-neutral-50/50"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <TableCell>
                <Link href={`/students/${student.id}`} className="flex items-center gap-3">
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold', avatarColors[student.status])}>
                    {getInitials(student.full_name)}
                  </div>
                  <span className="font-medium text-neutral-800">{student.full_name}</span>
                </Link>
              </TableCell>
              <TableCell className="text-sm text-neutral-600">
                {student.email || '—'}
              </TableCell>
              <TableCell>
                {student.level ? (
                  <span className="badge-info">{levelLabel[student.level]}</span>
                ) : (
                  <span className="text-sm text-neutral-400">—</span>
                )}
              </TableCell>
              <TableCell>
                <span className={statusBadge[student.status]}>
                  {statusLabel[student.status]}
                </span>
              </TableCell>
              <TableCell className="text-sm text-neutral-700">
                {student.monthly_rate ? formatCurrency(student.monthly_rate) : '—'}
              </TableCell>
              <TableCell className="text-sm text-neutral-500 hidden lg:table-cell">
                {formatDate(student.enrollment_date)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(student)}>
                      <Pencil className="mr-2 h-4 w-4" strokeWidth={1.75} />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/students/${student.id}?tab=payments`}>
                        <CreditCard className="mr-2 h-4 w-4" strokeWidth={1.75} />
                        Ver pagos
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(student)}
                      className="text-error focus:text-error"
                    >
                      <Trash2 className="mr-2 h-4 w-4" strokeWidth={1.75} />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
