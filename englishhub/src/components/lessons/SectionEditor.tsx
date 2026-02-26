'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PronunciationButton } from './PronunciationButton'
import type {
  LessonSection,
  SectionContent,
  VocabularyWord,
  GrammarExample,
  ExerciseQuestion,
  PronunciationWord,
} from '@/types/database'

interface SectionEditorProps {
  section: LessonSection
  onChange: (content: SectionContent, title?: string) => void
}

export function SectionEditor({ section, onChange }: SectionEditorProps) {
  switch (section.type) {
    case 'vocabulary':
      return <VocabularyEditor section={section} onChange={onChange} />
    case 'grammar':
      return <GrammarEditor section={section} onChange={onChange} />
    case 'exercise':
      return <ExerciseEditor section={section} onChange={onChange} />
    case 'pronunciation':
      return <PronunciationEditor section={section} onChange={onChange} />
    default:
      return <TextEditor section={section} onChange={onChange} />
  }
}

// ============================================
// VOCABULARY EDITOR
// ============================================
function VocabularyEditor({ section, onChange }: SectionEditorProps) {
  const content = section.content as { words: VocabularyWord[] }
  const words = content.words || []

  const updateWord = (index: number, field: keyof VocabularyWord, value: string) => {
    const updated = [...words]
    updated[index] = { ...updated[index], [field]: value }
    onChange({ words: updated })
  }

  const addWord = () => {
    onChange({ words: [...words, { word: '', translation: '', phonetic: '', example: '' }] })
  }

  const removeWord = (index: number) => {
    onChange({ words: words.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <Label className="text-sm font-medium text-neutral-700">Título de la sección</Label>
        <Input
          value={section.title}
          onChange={(e) => onChange(section.content, e.target.value)}
          className="mt-1 input-base"
          placeholder="Ej: New Vocabulary"
        />
      </div>

      {words.map((word, i) => (
        <div key={i} className="rounded-lg border border-neutral-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">Palabra {i + 1}</span>
            <div className="flex items-center gap-2">
              {word.word && <PronunciationButton word={word.word} size="sm" />}
              <Button variant="ghost" size="sm" onClick={() => removeWord(i)} className="h-7 w-7 p-0 text-neutral-400 hover:text-error">
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-xs text-neutral-500">Word</Label>
              <Input value={word.word} onChange={(e) => updateWord(i, 'word', e.target.value)} className="mt-1 input-base" placeholder="accomplish" />
            </div>
            <div>
              <Label className="text-xs text-neutral-500">Translation</Label>
              <Input value={word.translation} onChange={(e) => updateWord(i, 'translation', e.target.value)} className="mt-1 input-base" placeholder="lograr" />
            </div>
            <div>
              <Label className="text-xs text-neutral-500">Phonetic</Label>
              <Input value={word.phonetic} onChange={(e) => updateWord(i, 'phonetic', e.target.value)} className="mt-1 input-base" placeholder="/əˈkɑːm.plɪʃ/" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-neutral-500">Example sentence</Label>
            <Input value={word.example} onChange={(e) => updateWord(i, 'example', e.target.value)} className="mt-1 input-base" placeholder="She accomplished her goal." />
          </div>
        </div>
      ))}

      <Button variant="outline" onClick={addWord} className="btn-secondary gap-2 w-full">
        <Plus className="h-4 w-4" strokeWidth={1.75} />
        Agregar palabra
      </Button>
    </div>
  )
}

// ============================================
// GRAMMAR EDITOR
// ============================================
function GrammarEditor({ section, onChange }: SectionEditorProps) {
  const content = section.content as { explanation: string; formula: string; examples: GrammarExample[] }

  const updateField = (field: string, value: string) => {
    onChange({ ...content, [field]: value })
  }

  const updateExample = (index: number, field: keyof GrammarExample, value: string) => {
    const updated = [...(content.examples || [])]
    updated[index] = { ...updated[index], [field]: value }
    onChange({ ...content, examples: updated })
  }

  const addExample = () => {
    onChange({ ...content, examples: [...(content.examples || []), { sentence: '', highlight: '' }] })
  }

  const removeExample = (index: number) => {
    onChange({ ...content, examples: content.examples.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium text-neutral-700">Título de la sección</Label>
        <Input value={section.title} onChange={(e) => onChange(section.content, e.target.value)} className="mt-1 input-base" placeholder="Ej: Present Perfect" />
      </div>
      <div>
        <Label className="text-sm font-medium text-neutral-700">Fórmula</Label>
        <Input value={content.formula || ''} onChange={(e) => updateField('formula', e.target.value)} className="mt-1 input-base" placeholder="Subject + have/has + past participle" />
      </div>
      <div>
        <Label className="text-sm font-medium text-neutral-700">Explicación</Label>
        <Textarea value={content.explanation || ''} onChange={(e) => updateField('explanation', e.target.value)} className="mt-1 input-base min-h-[120px]" placeholder="Explicación de la regla gramatical..." />
      </div>

      <div>
        <Label className="text-sm font-medium text-neutral-700">Ejemplos</Label>
        <div className="mt-2 space-y-3">
          {(content.examples || []).map((ex, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="flex-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Input value={ex.sentence} onChange={(e) => updateExample(i, 'sentence', e.target.value)} className="input-base" placeholder="I have visited Paris." />
                <Input value={ex.highlight} onChange={(e) => updateExample(i, 'highlight', e.target.value)} className="input-base" placeholder="have visited" />
              </div>
              <Button variant="ghost" size="sm" onClick={() => removeExample(i)} className="h-9 w-9 p-0 text-neutral-400 hover:text-error shrink-0">
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              </Button>
            </div>
          ))}
        </div>
        <Button variant="outline" onClick={addExample} className="btn-secondary gap-2 w-full mt-3">
          <Plus className="h-4 w-4" strokeWidth={1.75} />
          Agregar ejemplo
        </Button>
      </div>
    </div>
  )
}

// ============================================
// EXERCISE EDITOR
// ============================================
function ExerciseEditor({ section, onChange }: SectionEditorProps) {
  const content = section.content as { instructions: string; questions: ExerciseQuestion[] }
  const questions = content.questions || []

  const updateQuestion = (index: number, field: string, value: unknown) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    onChange({ ...content, questions: updated })
  }

  const addQuestion = () => {
    onChange({
      ...content,
      questions: [...questions, { type: 'fill_blank' as const, question: '', answer: '' }],
    })
  }

  const removeQuestion = (index: number) => {
    onChange({ ...content, questions: questions.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium text-neutral-700">Título de la sección</Label>
        <Input value={section.title} onChange={(e) => onChange(section.content, e.target.value)} className="mt-1 input-base" placeholder="Ej: Practice Exercises" />
      </div>
      <div>
        <Label className="text-sm font-medium text-neutral-700">Instrucciones</Label>
        <Textarea value={content.instructions || ''} onChange={(e) => onChange({ ...content, instructions: e.target.value })} className="mt-1 input-base min-h-[60px]" placeholder="Fill in the blanks with the correct form..." />
      </div>

      {questions.map((q, i) => (
        <div key={i} className="rounded-lg border border-neutral-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">Pregunta {i + 1}</span>
            <Button variant="ghost" size="sm" onClick={() => removeQuestion(i)} className="h-7 w-7 p-0 text-neutral-400 hover:text-error">
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-neutral-500">Tipo</Label>
              <Select value={q.type} onValueChange={(val) => updateQuestion(i, 'type', val)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fill_blank">Fill in the blank</SelectItem>
                  <SelectItem value="multiple_choice">Multiple choice</SelectItem>
                  <SelectItem value="true_false">True / False</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-neutral-500">Respuesta correcta</Label>
              <Input value={q.answer} onChange={(e) => updateQuestion(i, 'answer', e.target.value)} className="mt-1 input-base" placeholder="has gone" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-neutral-500">{q.type === 'fill_blank' ? 'Oración (usa ___ para el blank)' : 'Pregunta'}</Label>
            <Input value={q.question || q.sentence || ''} onChange={(e) => updateQuestion(i, q.type === 'fill_blank' ? 'sentence' : 'question', e.target.value)} className="mt-1 input-base" placeholder={q.type === 'fill_blank' ? 'She ___ (go) to the store.' : 'What is the correct form?'} />
          </div>
          {q.type === 'multiple_choice' && (
            <div>
              <Label className="text-xs text-neutral-500">Opciones (separadas por coma)</Label>
              <Input value={(q.options || []).join(', ')} onChange={(e) => updateQuestion(i, 'options', e.target.value.split(',').map(s => s.trim()))} className="mt-1 input-base" placeholder="has gone, went, goes" />
            </div>
          )}
        </div>
      ))}

      <Button variant="outline" onClick={addQuestion} className="btn-secondary gap-2 w-full">
        <Plus className="h-4 w-4" strokeWidth={1.75} />
        Agregar pregunta
      </Button>
    </div>
  )
}

// ============================================
// PRONUNCIATION EDITOR
// ============================================
function PronunciationEditor({ section, onChange }: SectionEditorProps) {
  const content = section.content as { words: PronunciationWord[] }
  const words = content.words || []

  const updateWord = (index: number, field: keyof PronunciationWord, value: string) => {
    const updated = [...words]
    updated[index] = { ...updated[index], [field]: value }
    onChange({ words: updated })
  }

  const addWord = () => {
    onChange({ words: [...words, { word: '', phonetic: '', tips: '' }] })
  }

  const removeWord = (index: number) => {
    onChange({ words: words.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium text-neutral-700">Título de la sección</Label>
        <Input value={section.title} onChange={(e) => onChange(section.content, e.target.value)} className="mt-1 input-base" placeholder="Ej: Pronunciation Practice" />
      </div>

      {words.map((word, i) => (
        <div key={i} className="rounded-lg border border-neutral-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">Palabra {i + 1}</span>
            <div className="flex items-center gap-2">
              {word.word && <PronunciationButton word={word.word} size="sm" />}
              <Button variant="ghost" size="sm" onClick={() => removeWord(i)} className="h-7 w-7 p-0 text-neutral-400 hover:text-error">
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-neutral-500">Word</Label>
              <Input value={word.word} onChange={(e) => updateWord(i, 'word', e.target.value)} className="mt-1 input-base" placeholder="through" />
            </div>
            <div>
              <Label className="text-xs text-neutral-500">Phonetic</Label>
              <Input value={word.phonetic} onChange={(e) => updateWord(i, 'phonetic', e.target.value)} className="mt-1 input-base" placeholder="/θruː/" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-neutral-500">Tips</Label>
            <Input value={word.tips} onChange={(e) => updateWord(i, 'tips', e.target.value)} className="mt-1 input-base" placeholder="Tongue between teeth for 'th'" />
          </div>
        </div>
      ))}

      <Button variant="outline" onClick={addWord} className="btn-secondary gap-2 w-full">
        <Plus className="h-4 w-4" strokeWidth={1.75} />
        Agregar palabra
      </Button>
    </div>
  )
}

// ============================================
// TEXT EDITOR (intro, reading, custom)
// ============================================
function TextEditor({ section, onChange }: SectionEditorProps) {
  const content = section.content as { html_content: string; image_url?: string }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium text-neutral-700">Título de la sección</Label>
        <Input value={section.title} onChange={(e) => onChange(section.content, e.target.value)} className="mt-1 input-base" placeholder="Título..." />
      </div>
      <div>
        <Label className="text-sm font-medium text-neutral-700">Contenido</Label>
        <Textarea
          value={content.html_content || ''}
          onChange={(e) => onChange({ ...content, html_content: e.target.value })}
          className="mt-1 input-base min-h-[200px]"
          placeholder="Escribe el contenido de la sección..."
        />
      </div>
    </div>
  )
}
