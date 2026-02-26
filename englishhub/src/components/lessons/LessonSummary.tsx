'use client'

import { useState, useEffect } from 'react'
import {
  Sparkles,
  RefreshCw,
  Save,
  Copy,
  Share2,
  Link as LinkIcon,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import type { LessonSummary as LessonSummaryType } from '@/types/database'

interface LessonSummaryProps {
  lessonId: string
}

export function LessonSummaryPanel({ lessonId }: LessonSummaryProps) {
  const supabase = createClient()
  const [summary, setSummary] = useState<LessonSummaryType | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('lesson_summaries')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        setSummary(data as LessonSummaryType)
        setEditedContent(data.content)
        setExpanded(true)
      }
      setLoading(false)
    }
    fetch()
  }, [lessonId, supabase])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId }),
      })
      const data = await res.json()
      if (data.summary) {
        setSummary(data.summary as LessonSummaryType)
        setEditedContent(data.summary.content)
        setExpanded(true)
        setIsEditing(false)
      }
    } catch (err) {
      console.error('Generate error:', err)
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!summary) return
    setSaving(true)
    await supabase
      .from('lesson_summaries')
      .update({ content: editedContent, is_edited: true })
      .eq('id', summary.id)
    setSummary({ ...summary, content: editedContent, is_edited: true })
    setIsEditing(false)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleCopy = async () => {
    if (!summary) return
    const text = [
      summary.content,
      '',
      '📌 Key Points:',
      ...(summary.key_points || []).map(p => `• ${p}`),
      '',
      '📝 Examples:',
      ...(summary.examples || []).map(e => `• ${e.sentence} — ${e.explanation}`),
    ].join('\n')

    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShareWhatsApp = () => {
    if (!summary) return
    const url = `${window.location.origin}/summary/${summary.share_token}`
    const text = encodeURIComponent(`📚 Resumen de clase\n${url}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const handleShareLink = async () => {
    if (!summary) return
    const url = `${window.location.origin}/summary/${summary.share_token}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return null

  return (
    <div className="card-base mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent-500" strokeWidth={1.75} />
          <span className="font-semibold text-neutral-700">Resumen AI de clase</span>
          {summary && <span className="badge-success text-[10px]">Generado</span>}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-neutral-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-neutral-400" />
        )}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {!summary ? (
            <div className="text-center py-6">
              <p className="text-sm text-neutral-500 mb-4">
                Genera un resumen automático de esta lección para compartir con tus estudiantes.
              </p>
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="btn-accent gap-2"
              >
                {generating ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generando...</>
                ) : (
                  <><Sparkles className="h-4 w-4" strokeWidth={1.75} /> Generar resumen</>
                )}
              </Button>
            </div>
          ) : (
            <>
              {/* Content */}
              {isEditing ? (
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={8}
                  className="text-sm"
                />
              ) : (
                <div className="rounded-lg bg-neutral-50 p-4 text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
                  {summary.content}
                </div>
              )}

              {/* Key Points */}
              {summary.key_points && summary.key_points.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-neutral-400 mb-2">Key Points</p>
                  <ul className="space-y-1.5">
                    {summary.key_points.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-neutral-600">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Examples */}
              {summary.examples && summary.examples.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-neutral-400 mb-2">Examples</p>
                  <div className="space-y-2">
                    {summary.examples.map((ex, i) => (
                      <div key={i} className="rounded-lg border border-neutral-100 p-3">
                        <p className="text-sm font-medium text-neutral-700">&ldquo;{ex.sentence}&rdquo;</p>
                        <p className="mt-1 text-xs text-neutral-500">{ex.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
                <Button
                  onClick={handleGenerate}
                  variant="outline"
                  className="btn-secondary gap-2 text-xs"
                  disabled={generating}
                >
                  {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.75} />}
                  Regenerar
                </Button>

                {isEditing ? (
                  <Button onClick={handleSave} className="btn-primary gap-2 text-xs" disabled={saving}>
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" strokeWidth={1.75} />}
                    {saved ? 'Guardado' : 'Guardar cambios'}
                  </Button>
                ) : (
                  <Button onClick={() => setIsEditing(true)} variant="outline" className="btn-secondary gap-2 text-xs">
                    Editar
                  </Button>
                )}

                <div className="flex-1" />

                <Button onClick={handleCopy} variant="outline" className="btn-secondary gap-2 text-xs">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />}
                  {copied ? 'Copiado' : 'Copiar'}
                </Button>

                <Button onClick={handleShareLink} variant="outline" className="btn-secondary gap-2 text-xs">
                  <LinkIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Link
                </Button>

                <Button onClick={handleShareWhatsApp} className="btn-primary gap-2 text-xs">
                  <Share2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                  WhatsApp
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
