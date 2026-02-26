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
import { MoreHorizontal, Pencil, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { PaymentWithStudent, Payment } from '@/types/database'

const statusBadge: Record<string, string> = {
  paid: 'badge-success',
  pending: 'badge-warning',
  overdue: 'badge-error',
  cancelled: 'badge-info',
}
const statusLabel: Record<string, string> = {
  paid: 'Pagado',
  pending: 'Pendiente',
  overdue: 'Vencido',
  cancelled: 'Cancelado',
}
const methodLabel: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  yappy: 'Yappy',
  nequi: 'Nequi',
  card: 'Tarjeta',
  other: 'Otro',
}

interface PaymentTableProps {
  payments: PaymentWithStudent[]
  onEdit: (payment: PaymentWithStudent) => void
  onCancel: (payment: PaymentWithStudent) => void
}

export function PaymentTable({ payments, onEdit, onCancel }: PaymentTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-100">
      <Table>
        <TableHeader>
          <TableRow className="bg-neutral-50 hover:bg-neutral-50">
            <TableHead className="text-xs uppercase tracking-wider text-neutral-500">Estudiante</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-neutral-500">Monto</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-neutral-500">Fecha</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-neutral-500 hidden md:table-cell">Período</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-neutral-500 hidden sm:table-cell">Método</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-neutral-500">Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id} className="group transition-colors hover:bg-neutral-50/50">
              <TableCell className="font-medium text-neutral-800">
                {payment.student?.full_name || '—'}
              </TableCell>
              <TableCell className="text-sm font-medium text-neutral-800">
                {formatCurrency(payment.amount)}
              </TableCell>
              <TableCell className="text-sm text-neutral-600">
                {formatDate(payment.payment_date)}
              </TableCell>
              <TableCell className="text-sm text-neutral-600 hidden md:table-cell">
                {payment.period_start && payment.period_end
                  ? `${formatDate(payment.period_start)} — ${formatDate(payment.period_end)}`
                  : '—'}
              </TableCell>
              <TableCell className="text-sm text-neutral-600 hidden sm:table-cell">
                {payment.method ? methodLabel[payment.method] || payment.method : '—'}
              </TableCell>
              <TableCell>
                <span className={statusBadge[payment.status]}>
                  {statusLabel[payment.status]}
                </span>
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
                    <DropdownMenuItem onClick={() => onEdit(payment)}>
                      <Pencil className="mr-2 h-4 w-4" strokeWidth={1.75} />
                      Editar
                    </DropdownMenuItem>
                    {payment.status !== 'cancelled' && (
                      <DropdownMenuItem
                        onClick={() => onCancel(payment)}
                        className="text-error focus:text-error"
                      >
                        <XCircle className="mr-2 h-4 w-4" strokeWidth={1.75} />
                        Cancelar pago
                      </DropdownMenuItem>
                    )}
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
