import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { Shield, Users, UserCheck, UserX } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/super-admin'
import { withLocalePath } from '@/i18n/routing'
import { StatsCard } from '@/components/shared/StatsCard'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { updateTutorSubscriptionAction } from './actions'

type SubscriptionRow = {
  id: string
  plan: 'trial' | 'starter' | 'pro'
  status: 'active' | 'suspended'
  created_at: string
  tutor: {
    id: string
    full_name: string
    email: string
    created_at: string
  } | null
}

export default async function SuperAdminPage() {
  const supabase = await createClient()
  const locale = await getLocale()
  const { data: { user } } = await supabase.auth.getUser()

  const canAccess = await isSuperAdmin(supabase, user?.id)
  if (!canAccess) {
    redirect(withLocalePath('/', locale))
  }

  const [subscriptionsRes, trialRes, starterRes, proRes, suspendedRes] = await Promise.all([
    supabase
      .from('tutor_subscriptions')
      .select('id, plan, status, created_at, tutor:tutors(id, full_name, email, created_at)')
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('tutor_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('plan', 'trial'),
    supabase
      .from('tutor_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('plan', 'starter'),
    supabase
      .from('tutor_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('plan', 'pro'),
    supabase
      .from('tutor_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'suspended'),
  ])

  const rows = (subscriptionsRes.data ?? []) as SubscriptionRow[]
  const totalAccounts = rows.length
  const trialCount = trialRes.count ?? 0
  const starterCount = starterRes.count ?? 0
  const proCount = proRes.count ?? 0
  const suspendedCount = suspendedRes.count ?? 0

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="font-heading text-2xl text-neutral-800 lg:text-3xl">Super Admin</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Gestiona cuentas de tutores y sus planes comerciales.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Cuentas" value={totalAccounts} icon={Users} color="primary" />
        <StatsCard title="En trial" value={trialCount} icon={Shield} color="info" />
        <StatsCard title="Starter / Pro" value={`${starterCount} / ${proCount}`} icon={UserCheck} color="accent" />
        <StatsCard title="Suspendidas" value={suspendedCount} icon={UserX} color="warning" />
      </div>

      <div className="card-base">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-neutral-800">Cuentas creadas</h2>
          <p className="text-xs text-neutral-500">
            Puedes actualizar plan y estado de cada cuenta.
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tutor</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Creada</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium text-neutral-700">
                  {row.tutor?.full_name || 'Sin nombre'}
                </TableCell>
                <TableCell className="text-neutral-600">
                  {row.tutor?.email || 'Sin email'}
                </TableCell>
                <TableCell className="capitalize">{row.plan}</TableCell>
                <TableCell>
                  <span className={row.status === 'active' ? 'badge-success' : 'badge-error'}>
                    {row.status}
                  </span>
                </TableCell>
                <TableCell className="text-neutral-500">
                  {new Date(row.tutor?.created_at || row.created_at).toLocaleDateString('es')}
                </TableCell>
                <TableCell className="text-right">
                  <form action={updateTutorSubscriptionAction} className="flex items-center justify-end gap-2">
                    <input type="hidden" name="subscriptionId" value={row.id} />
                    <select
                      name="plan"
                      defaultValue={row.plan}
                      aria-label="Seleccionar plan"
                      className="input-base h-9 w-[110px] py-1.5 text-xs capitalize"
                    >
                      <option value="trial">trial</option>
                      <option value="starter">starter</option>
                      <option value="pro">pro</option>
                    </select>
                    <select
                      name="status"
                      defaultValue={row.status}
                      aria-label="Seleccionar estado de cuenta"
                      className="input-base h-9 w-[120px] py-1.5 text-xs"
                    >
                      <option value="active">active</option>
                      <option value="suspended">suspended</option>
                    </select>
                    <button type="submit" className="btn-secondary px-3 py-2 text-xs">
                      Guardar
                    </button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
