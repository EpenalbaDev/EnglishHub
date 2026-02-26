'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Play,
  Check,
  Loader2,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  FileText,
  BookOpen,
  BookMarked,
  PenTool,
  Mic,
  BookOpenCheck,
  Wrench,
  GripVertical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { createClient } from '@/lib/supabase/client'
import { useLessonSections } from '@/hooks/useLessonSections'
import { SectionEditor } from './SectionEditor'
import { SectionPreview } from './SectionPreview'
import { LessonSummaryPanel } from './LessonSummary'
import { cn } from '@/lib/utils'
import type { Lesson, SectionType, SectionContent, LessonSection } from '@/types/database'

const sectionTypes: { type: SectionType; label: string; icon: typeof FileText }[] = [
  { type: 'intro', label: 'Introducción', icon: FileText },
  { type: 'vocabulary', label: 'Vocabulario', icon: BookOpen },
  { type: 'grammar', label: 'Gramática', icon: BookMarked },
  { type: 'exercise', label: 'Ejercicio', icon: PenTool },
  { type: 'pronunciation', label: 'Pronunciación', icon: Mic },
  { type: 'reading', label: 'Lectura', icon: BookOpenCheck },
  { type: 'custom', label: 'Personalizado', icon: Wrench },
]

const sectionIconMap: Record<SectionType, typeof FileText> = Object.fromEntries(
  sectionTypes.map(s => [s.type, s.icon])
) as Record<SectionType, typeof FileText>

interface LessonBuilderProps {
  lessonId: string
}

export function LessonBuilder({ lessonId }: LessonBuilderProps) {
  const router = useRouter()
  const supabase = createClient()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [lessonSaving, setLessonSaving] = useState(false)
  const [lessonSaved, setLessonSaved] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { sections, saving: sectionSaving, lastSaved, addSection, autoSaveSection, deleteSection, reorderSections } = useLessonSections(lessonId)

  const selectedSection = sections.find(s => s.id === selectedSectionId) || null

  // Fetch lesson
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('lessons').select('*').eq('id', lessonId).single()
      if (data) setLesson(data as Lesson)
      setLoading(false)
    }
    fetch()
  }, [lessonId, supabase])

  // Auto-select first section
  useEffect(() => {
    if (!selectedSectionId && sections.length > 0) {
      setSelectedSectionId(sections[0].id)
    }
  }, [sections, selectedSectionId])

  // Auto-save lesson metadata
  const autoSaveLesson = useCallback((data: Partial<Lesson>) => {
    setLesson(prev => prev ? { ...prev, ...data } : null)
    setLessonSaved(false)

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setLessonSaving(true)

    saveTimerRef.current = setTimeout(async () => {
      await supabase.from('lessons').update(data).eq('id', lessonId)
      setLessonSaving(false)
      setLessonSaved(true)
      setTimeout(() => setLessonSaved(false), 2000)
    }, 3000)
  }, [lessonId, supabase])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  const handleAddSection = async (type: SectionType) => {
    const typeInfo = sectionTypes.find(s => s.type === type)
    const newSection = await addSection(type, typeInfo?.label || 'Nueva sección')
    setSelectedSectionId(newSection.id)
  }

  const handleSectionContentChange = (content: SectionContent, title?: string) => {
    if (!selectedSectionId) return
    const update: Partial<LessonSection> = { content }
    if (title !== undefined) update.title = title
    autoSaveSection(selectedSectionId, update)
  }

  const handleDeleteSection = async (id: string) => {
    await deleteSection(id)
    if (selectedSectionId === id) {
      setSelectedSectionId(sections.find(s => s.id !== id)?.id || null)
    }
  }

  const handleMoveSection = async (id: string, direction: 'up' | 'down') => {
    const idx = sections.findIndex(s => s.id === id)
    if (direction === 'up' && idx <= 0) return
    if (direction === 'down' && idx >= sections.length - 1) return

    const newOrder = [...sections.map(s => s.id)]
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    ;[newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]]
    await reorderSections(newOrder)
  }

  const handlePublish = async () => {
    await supabase.from('lessons').update({ is_published: true }).eq('id', lessonId)
    setLesson(prev => prev ? { ...prev, is_published: true } : null)
  }

  const handleSaveDraft = async () => {
    if (!lesson) return
    setLessonSaving(true)
    await supabase.from('lessons').update({
      title: lesson.title,
      description: lesson.description,
      category: lesson.category,
      level: lesson.level,
    }).eq('id', lessonId)
    setLessonSaving(false)
    setLessonSaved(true)
    setTimeout(() => setLessonSaved(false), 2000)
  }

  if (loading || !lesson) {
    return <div className="flex h-64 items-center justify-center text-neutral-400">Cargando...</div>
  }

  return (
    <div className="flex h-[calc(100vh-56px)] lg:h-screen flex-col">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3">
        <Link href="/lessons" className="text-neutral-500 hover:text-neutral-700 transition-colors">
          <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
        </Link>

        <Input
          value={lesson.title}
          onChange={(e) => autoSaveLesson({ title: e.target.value })}
          className="input-base max-w-[240px] font-heading text-lg border-none shadow-none focus:ring-0 px-2"
          placeholder="Título de la lección"
        />

        <Select value={lesson.category || ''} onValueChange={(val) => autoSaveLesson({ category: val })}>
          <SelectTrigger className="w-[130px] h-9 text-xs">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grammar">Gramática</SelectItem>
            <SelectItem value="vocabulary">Vocabulario</SelectItem>
            <SelectItem value="conversation">Conversación</SelectItem>
            <SelectItem value="reading">Lectura</SelectItem>
            <SelectItem value="writing">Escritura</SelectItem>
          </SelectContent>
        </Select>

        <Select value={lesson.level || ''} onValueChange={(val) => autoSaveLesson({ level: val as Lesson['level'] })}>
          <SelectTrigger className="w-[130px] h-9 text-xs">
            <SelectValue placeholder="Nivel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="elementary">Elementary</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="upper_intermediate">Upper Int.</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        {/* Save indicator */}
        <span className="text-xs text-neutral-400">
          {sectionSaving || lessonSaving ? (
            <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Guardando...</span>
          ) : lessonSaved || lastSaved ? (
            <span className="flex items-center gap-1 text-success"><Check className="h-3 w-3" /> Guardado</span>
          ) : null}
        </span>

        <Button variant="outline" onClick={handleSaveDraft} className="btn-secondary h-9 gap-1.5 text-xs">
          <Save className="h-3.5 w-3.5" strokeWidth={1.75} />
          Guardar
        </Button>

        {!lesson.is_published ? (
          <Button onClick={handlePublish} className="btn-primary h-9 text-xs">Publicar</Button>
        ) : (
          <span className="badge-success">Publicada</span>
        )}

        {sections.length > 0 && (
          <Button onClick={() => router.push(`/lessons/${lessonId}/present`)} className="btn-accent h-9 gap-1.5 text-xs">
            <Play className="h-3.5 w-3.5" strokeWidth={1.75} />
            Presentar
          </Button>
        )}
      </div>

      {/* 3-Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel — Sections List */}
        <div className="w-[240px] shrink-0 border-r border-neutral-200 bg-neutral-50 overflow-y-auto hidden md:block">
          <div className="p-3">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-neutral-400 px-2">Secciones</p>
            <div className="space-y-1">
              {sections.map((section) => {
                const Icon = sectionIconMap[section.type] || FileText
                return (
                  <div
                    key={section.id}
                    className={cn(
                      'group flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer transition-colors',
                      selectedSectionId === section.id
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    )}
                    onClick={() => setSelectedSectionId(section.id)}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                    <span className="flex-1 truncate text-xs">{section.title || 'Sin título'}</span>
                    <div className="hidden group-hover:flex items-center gap-0.5">
                      <button onClick={(e) => { e.stopPropagation(); handleMoveSection(section.id, 'up') }} className="p-0.5 text-neutral-400 hover:text-neutral-600">
                        <ChevronUp className="h-3 w-3" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleMoveSection(section.id, 'down') }} className="p-0.5 text-neutral-400 hover:text-neutral-600">
                        <ChevronDown className="h-3 w-3" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id) }} className="p-0.5 text-neutral-400 hover:text-error">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Add Section */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="btn-secondary w-full mt-3 gap-2 text-xs h-9">
                  <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Agregar sección
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px]">
                {sectionTypes.map((st) => (
                  <DropdownMenuItem key={st.type} onClick={() => handleAddSection(st.type)}>
                    <st.icon className="mr-2 h-4 w-4" strokeWidth={1.75} />
                    {st.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Center Panel — Section Editor */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Mobile: section selector */}
          <div className="mb-4 md:hidden">
            <Select value={selectedSectionId || ''} onValueChange={setSelectedSectionId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar sección" /></SelectTrigger>
              <SelectContent>
                {sections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.title || 'Sin título'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="btn-secondary w-full mt-2 gap-2 text-xs h-9">
                  <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Agregar sección
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px]">
                {sectionTypes.map((st) => (
                  <DropdownMenuItem key={st.type} onClick={() => handleAddSection(st.type)}>
                    <st.icon className="mr-2 h-4 w-4" strokeWidth={1.75} />
                    {st.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {selectedSection ? (
            <SectionEditor
              section={selectedSection}
              onChange={handleSectionContentChange}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <BookOpen className="h-12 w-12 text-neutral-300" strokeWidth={1.5} />
              <p className="mt-3 text-sm text-neutral-500">Agrega una sección para comenzar</p>
            </div>
          )}
        </div>

        {/* Right Panel — Preview */}
        <div className="w-[320px] shrink-0 border-l border-neutral-200 bg-neutral-50 overflow-y-auto hidden lg:block">
          <div className="p-4">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-neutral-400">Vista previa</p>
            {selectedSection ? (
              <SectionPreview section={selectedSection} />
            ) : (
              <div className="flex h-[300px] items-center justify-center rounded-lg bg-neutral-100 text-sm text-neutral-400">
                Selecciona una sección
              </div>
            )}

            {/* AI Summary Panel */}
            <LessonSummaryPanel lessonId={lessonId} />
          </div>
        </div>
      </div>
    </div>
  )
}
