'use client'

import { useState, useMemo } from 'react'
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCalendar } from '@/hooks/useCalendar'
import { ClassForm } from '@/components/calendar/ClassForm'
import { PostClassActions } from '@/components/calendar/PostClassActions'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { cn } from '@/lib/utils'
import type { ScheduledClass, ScheduledClassWithDetails } from '@/types/database'

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7) // 7am to 9pm
const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const statusColors: Record<string, string> = {
  scheduled: 'bg-primary-100 border-primary-300 text-primary-800',
  completed: 'bg-success-light border-green-300 text-green-800',
  cancelled: 'bg-neutral-100 border-neutral-300 text-neutral-500',
  no_show: 'bg-error-light border-red-300 text-red-800',
}

const statusLabels: Record<string, string> = {
  scheduled: 'Programada',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No asistió',
}

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export default function CalendarPage() {
  const {
    classes,
    loading,
    currentView,
    currentDate,
    navigateNext,
    navigatePrev,
    goToToday,
    setView,
    createClass,
    updateClass,
    completeClass,
    cancelClass,
    deleteClass,
  } = useCalendar()

  const [formOpen, setFormOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<ScheduledClassWithDetails | null>(null)
  const [defaultDate, setDefaultDate] = useState<Date | undefined>()
  const [postClassOpen, setPostClassOpen] = useState(false)
  const [completedClass, setCompletedClass] = useState<ScheduledClassWithDetails | null>(null)
  const [deletingClass, setDeletingClass] = useState<ScheduledClassWithDetails | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const handleNewClass = (date?: Date) => {
    setEditingClass(null)
    setDefaultDate(date)
    setFormOpen(true)
  }

  const handleEditClass = (cls: ScheduledClassWithDetails) => {
    setEditingClass(cls)
    setFormOpen(true)
  }

  const handleSaveClass = async (data: Partial<ScheduledClass> & Pick<ScheduledClass, 'title' | 'start_time' | 'end_time'>) => {
    if (editingClass) {
      await updateClass(editingClass.id, data)
    } else {
      await createClass(data)
    }
  }

  const handleCompleteClass = async (cls: ScheduledClassWithDetails) => {
    await completeClass(cls.id)
    setCompletedClass(cls)
    setPostClassOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingClass) return
    setDeleteLoading(true)
    try {
      await deleteClass(deletingClass.id)
      setDeletingClass(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  const getWeekLabel = () => {
    const weekStart = startOfWeek(currentDate)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const startMonth = MONTHS[weekStart.getMonth()]
    const endMonth = MONTHS[weekEnd.getMonth()]
    if (startMonth === endMonth) {
      return `${weekStart.getDate()} - ${weekEnd.getDate()} ${startMonth} ${weekStart.getFullYear()}`
    }
    return `${weekStart.getDate()} ${startMonth} - ${weekEnd.getDate()} ${endMonth} ${weekStart.getFullYear()}`
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-heading text-2xl text-neutral-800 lg:text-3xl">Agenda</h1>
        <Button onClick={() => handleNewClass()} className="btn-primary gap-2">
          <Plus className="h-4 w-4" strokeWidth={1.75} />
          Nueva Clase
        </Button>
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* View toggle */}
        <div className="flex rounded-lg border border-neutral-200 p-0.5">
          <button
            onClick={() => setView('week')}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              currentView === 'week' ? 'bg-primary-600 text-white' : 'text-neutral-600 hover:bg-neutral-50'
            )}
          >
            Semana
          </button>
          <button
            onClick={() => setView('month')}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              currentView === 'month' ? 'bg-primary-600 text-white' : 'text-neutral-600 hover:bg-neutral-50'
            )}
          >
            Mes
          </button>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={navigatePrev} className="btn-secondary h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday} className="btn-secondary h-8 text-xs">
            Hoy
          </Button>
          <Button variant="outline" size="sm" onClick={navigateNext} className="btn-secondary h-8 w-8 p-0">
            <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
          </Button>
        </div>

        <span className="text-sm font-medium text-neutral-700">
          {currentView === 'week' ? getWeekLabel() : `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
        </span>
      </div>

      {/* Calendar View */}
      {loading ? (
        <div className="flex h-96 items-center justify-center text-neutral-400">Cargando...</div>
      ) : currentView === 'week' ? (
        <WeekView
          currentDate={currentDate}
          classes={classes}
          onNewClass={handleNewClass}
          onEditClass={handleEditClass}
          onCompleteClass={handleCompleteClass}
          onCancelClass={(c) => cancelClass(c.id)}
          onDeleteClass={(c) => setDeletingClass(c)}
        />
      ) : (
        <MonthView
          currentDate={currentDate}
          classes={classes}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          onNewClass={handleNewClass}
          onEditClass={handleEditClass}
          onCompleteClass={handleCompleteClass}
          onCancelClass={(c) => cancelClass(c.id)}
          onDeleteClass={(c) => setDeletingClass(c)}
        />
      )}

      {/* Modals */}
      <ClassForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveClass}
        initialData={editingClass}
        defaultDate={defaultDate}
      />

      <PostClassActions
        open={postClassOpen}
        onClose={() => setPostClassOpen(false)}
        classData={completedClass}
      />

      <ConfirmDialog
        open={!!deletingClass}
        onClose={() => setDeletingClass(null)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar clase"
        description={`¿Eliminar "${deletingClass?.title}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        loading={deleteLoading}
        variant="danger"
      />
    </div>
  )
}

// ========================
// WEEK VIEW
// ========================
function WeekView({
  currentDate,
  classes,
  onNewClass,
  onEditClass,
  onCompleteClass,
  onCancelClass,
  onDeleteClass,
}: {
  currentDate: Date
  classes: ScheduledClassWithDetails[]
  onNewClass: (date?: Date) => void
  onEditClass: (c: ScheduledClassWithDetails) => void
  onCompleteClass: (c: ScheduledClassWithDetails) => void
  onCancelClass: (c: ScheduledClassWithDetails) => void
  onDeleteClass: (c: ScheduledClassWithDetails) => void
}) {
  const weekStart = startOfWeek(currentDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })

  const getClassesForDayHour = (day: Date, hour: number) => {
    return classes.filter(c => {
      const start = new Date(c.start_time)
      return start.getFullYear() === day.getFullYear() &&
        start.getMonth() === day.getMonth() &&
        start.getDate() === day.getDate() &&
        start.getHours() === hour
    })
  }

  return (
    <div className="card-base overflow-hidden p-0">
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Header — Day names */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-neutral-200 bg-neutral-50">
            <div className="p-2" />
            {weekDays.map((day, i) => {
              const isToday = day.getTime() === today.getTime()
              return (
                <div
                  key={i}
                  className={cn(
                    'border-l border-neutral-200 p-2 text-center',
                    isToday && 'bg-primary-50'
                  )}
                >
                  <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">{DAYS[i]}</p>
                  <p className={cn(
                    'mt-0.5 text-lg font-semibold',
                    isToday ? 'text-primary-600' : 'text-neutral-700'
                  )}>
                    {day.getDate()}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Time grid */}
          <div className="max-h-[600px] overflow-y-auto">
            {HOURS.map(hour => (
              <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-neutral-100">
                <div className="flex items-start justify-end p-1 pr-2 text-xs text-neutral-400">
                  {hour}:00
                </div>
                {weekDays.map((day, dayIdx) => {
                  const dayClasses = getClassesForDayHour(day, hour)
                  const isToday = day.getTime() === today.getTime()
                  return (
                    <div
                      key={dayIdx}
                      className={cn(
                        'relative min-h-[48px] border-l border-neutral-100 cursor-pointer hover:bg-neutral-50/50 transition-colors',
                        isToday && 'bg-primary-50/30'
                      )}
                      onClick={() => {
                        const d = new Date(day)
                        d.setHours(hour, 0, 0, 0)
                        onNewClass(d)
                      }}
                    >
                      {dayClasses.map(cls => {
                        const start = new Date(cls.start_time)
                        const end = new Date(cls.end_time)
                        const durationMins = (end.getTime() - start.getTime()) / 60000
                        const heightPx = Math.max(36, (durationMins / 60) * 48)

                        return (
                          <div
                            key={cls.id}
                            className={cn(
                              'absolute inset-x-1 rounded-md border px-1.5 py-1 text-xs cursor-pointer z-10',
                              statusColors[cls.status]
                            )}
                            style={{ height: `${heightPx}px` }}
                            onClick={(e) => {
                              e.stopPropagation()
                              onEditClass(cls)
                            }}
                          >
                            <p className="font-medium truncate">{cls.title}</p>
                            {cls.student && (
                              <p className="truncate opacity-70">{cls.student.full_name}</p>
                            )}
                            <ClassContextMenu
                              cls={cls}
                              onEdit={onEditClass}
                              onComplete={onCompleteClass}
                              onCancel={onCancelClass}
                              onDelete={onDeleteClass}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ========================
// MONTH VIEW
// ========================
function MonthView({
  currentDate,
  classes,
  selectedDay,
  onSelectDay,
  onNewClass,
  onEditClass,
  onCompleteClass,
  onCancelClass,
  onDeleteClass,
}: {
  currentDate: Date
  classes: ScheduledClassWithDetails[]
  selectedDay: Date | null
  onSelectDay: (d: Date | null) => void
  onNewClass: (date?: Date) => void
  onEditClass: (c: ScheduledClassWithDetails) => void
  onCompleteClass: (c: ScheduledClassWithDetails) => void
  onCancelClass: (c: ScheduledClassWithDetails) => void
  onDeleteClass: (c: ScheduledClassWithDetails) => void
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const calStart = startOfWeek(monthStart)

  // Generate 6 weeks of days
  const calDays: Date[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(calStart)
    d.setDate(d.getDate() + i)
    calDays.push(d)
  }

  const getClassesForDay = (day: Date) => {
    return classes.filter(c => {
      const start = new Date(c.start_time)
      return start.getFullYear() === day.getFullYear() &&
        start.getMonth() === day.getMonth() &&
        start.getDate() === day.getDate()
    })
  }

  const selectedDayClasses = selectedDay ? getClassesForDay(selectedDay) : []

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Calendar grid */}
      <div className="lg:col-span-2 card-base p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(day => (
            <div key={day} className="p-2 text-center text-xs font-medium uppercase tracking-wider text-neutral-400">
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {calDays.map((day, i) => {
            const isCurrentMonth = day.getMonth() === currentDate.getMonth()
            const isToday = day.getTime() === today.getTime()
            const isSelected = selectedDay && day.getTime() === selectedDay.getTime()
            const dayClasses = getClassesForDay(day)

            return (
              <button
                key={i}
                onClick={() => onSelectDay(day)}
                className={cn(
                  'relative h-20 border border-neutral-100 p-1.5 text-left transition-colors hover:bg-neutral-50',
                  !isCurrentMonth && 'opacity-40',
                  isSelected && 'bg-primary-50 border-primary-300',
                  isToday && !isSelected && 'bg-accent-50/30'
                )}
              >
                <span className={cn(
                  'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                  isToday ? 'bg-primary-600 text-white' : 'text-neutral-700'
                )}>
                  {day.getDate()}
                </span>
                {dayClasses.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {dayClasses.slice(0, 2).map(cls => (
                      <div
                        key={cls.id}
                        className={cn(
                          'rounded px-1 py-0.5 text-[10px] font-medium truncate',
                          cls.status === 'scheduled' && 'bg-primary-100 text-primary-700',
                          cls.status === 'completed' && 'bg-green-100 text-green-700',
                          cls.status === 'cancelled' && 'bg-neutral-100 text-neutral-500',
                          cls.status === 'no_show' && 'bg-red-100 text-red-700',
                        )}
                      >
                        {new Date(cls.start_time).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })} {cls.title}
                      </div>
                    ))}
                    {dayClasses.length > 2 && (
                      <p className="text-[10px] text-neutral-400">+{dayClasses.length - 2} más</p>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Day detail panel */}
      <div className="card-base">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-neutral-700">
            {selectedDay
              ? selectedDay.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })
              : 'Selecciona un día'}
          </h3>
          {selectedDay && (
            <Button
              size="sm"
              className="btn-primary gap-1.5 text-xs h-8"
              onClick={() => {
                const d = new Date(selectedDay)
                d.setHours(9, 0, 0, 0)
                onNewClass(d)
              }}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
              Clase
            </Button>
          )}
        </div>

        {!selectedDay ? (
          <p className="py-8 text-center text-sm text-neutral-400">
            Haz clic en un día para ver las clases
          </p>
        ) : selectedDayClasses.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-400">
            Sin clases este día
          </p>
        ) : (
          <div className="space-y-3">
            {selectedDayClasses.map(cls => (
              <DayClassCard
                key={cls.id}
                cls={cls}
                onEdit={onEditClass}
                onComplete={onCompleteClass}
                onCancel={onCancelClass}
                onDelete={onDeleteClass}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DayClassCard({
  cls,
  onEdit,
  onComplete,
  onCancel,
  onDelete,
}: {
  cls: ScheduledClassWithDetails
  onEdit: (c: ScheduledClassWithDetails) => void
  onComplete: (c: ScheduledClassWithDetails) => void
  onCancel: (c: ScheduledClassWithDetails) => void
  onDelete: (c: ScheduledClassWithDetails) => void
}) {
  const start = new Date(cls.start_time)
  const end = new Date(cls.end_time)
  const timeStr = `${start.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`

  return (
    <div className={cn('rounded-lg border p-3', statusColors[cls.status])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold">{cls.title}</p>
          <div className="mt-1 space-y-0.5 text-xs opacity-80">
            <p className="flex items-center gap-1">
              <Clock className="h-3 w-3" strokeWidth={1.75} />
              {timeStr}
            </p>
            {cls.student && (
              <p className="flex items-center gap-1">
                <User className="h-3 w-3" strokeWidth={1.75} />
                {cls.student.full_name}
              </p>
            )}
            {cls.location && (
              <p className="flex items-center gap-1">
                <MapPin className="h-3 w-3" strokeWidth={1.75} />
                {cls.location}
              </p>
            )}
          </div>
          <span className="mt-2 inline-block text-[10px] font-medium uppercase tracking-wider opacity-60">
            {statusLabels[cls.status]}
          </span>
        </div>
        <ClassContextMenu
          cls={cls}
          onEdit={onEdit}
          onComplete={onComplete}
          onCancel={onCancel}
          onDelete={onDelete}
        />
      </div>
    </div>
  )
}

function ClassContextMenu({
  cls,
  onEdit,
  onComplete,
  onCancel,
  onDelete,
}: {
  cls: ScheduledClassWithDetails
  onEdit: (c: ScheduledClassWithDetails) => void
  onComplete: (c: ScheduledClassWithDetails) => void
  onCancel: (c: ScheduledClassWithDetails) => void
  onDelete: (c: ScheduledClassWithDetails) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <button className="rounded p-1 opacity-60 hover:opacity-100 hover:bg-black/5 transition-colors">
          <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={() => onEdit(cls)}>
          <Pencil className="mr-2 h-4 w-4" strokeWidth={1.75} />
          Editar
        </DropdownMenuItem>
        {cls.status === 'scheduled' && (
          <>
            <DropdownMenuItem onClick={() => onComplete(cls)}>
              <CheckCircle className="mr-2 h-4 w-4 text-success" strokeWidth={1.75} />
              Marcar completada
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCancel(cls)}>
              <XCircle className="mr-2 h-4 w-4 text-warning" strokeWidth={1.75} />
              Cancelar
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onDelete(cls)} className="text-error focus:text-error">
          <Trash2 className="mr-2 h-4 w-4" strokeWidth={1.75} />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
