'use client'

import { useState } from 'react'
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  GripVertical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ExerciseType } from '@/types/database'

export interface ExerciseData {
  id?: string
  type: ExerciseType
  question: string
  options: string[] | null
  correct_answer: string
  points: number
  order_index: number
}

interface ExerciseEditorProps {
  exercise: ExerciseData
  index: number
  total: number
  onChange: (data: ExerciseData) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

const exerciseTypeLabels: Record<ExerciseType, string> = {
  multiple_choice: 'Opción múltiple',
  fill_blank: 'Completar espacio',
  true_false: 'Verdadero/Falso',
  matching: 'Emparejar',
  free_text: 'Texto libre',
  pronunciation: 'Pronunciación',
}

export function ExerciseEditor({
  exercise,
  index,
  total,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: ExerciseEditorProps) {
  const updateField = <K extends keyof ExerciseData>(key: K, value: ExerciseData[K]) => {
    onChange({ ...exercise, [key]: value })
  }

  const handleTypeChange = (type: ExerciseType) => {
    const defaults: Partial<ExerciseData> = { type, question: exercise.question, points: exercise.points, order_index: exercise.order_index }
    switch (type) {
      case 'multiple_choice':
        onChange({ ...defaults, options: ['', '', '', ''], correct_answer: '' } as ExerciseData)
        break
      case 'fill_blank':
        onChange({ ...defaults, options: null, correct_answer: '' } as ExerciseData)
        break
      case 'true_false':
        onChange({ ...defaults, options: null, correct_answer: 'true' } as ExerciseData)
        break
      case 'matching':
        onChange({ ...defaults, options: ['', ''], correct_answer: JSON.stringify({ '': '' }) } as ExerciseData)
        break
      case 'free_text':
        onChange({ ...defaults, options: null, correct_answer: '' } as ExerciseData)
        break
      case 'pronunciation':
        onChange({ ...defaults, options: null, correct_answer: '' } as ExerciseData)
        break
    }
  }

  return (
    <div className="card-base space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-neutral-300" strokeWidth={1.75} />
        <span className="text-xs font-medium text-neutral-400">#{index + 1}</span>
        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-30"
          >
            <ChevronUp className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-30"
          >
            <ChevronDown className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <button
            onClick={onDelete}
            className="rounded p-1 text-neutral-400 hover:bg-error-light hover:text-error"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Type + Points */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Label className="text-xs">Tipo de ejercicio</Label>
          <Select value={exercise.type} onValueChange={(v) => handleTypeChange(v as ExerciseType)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(exerciseTypeLabels).map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-24">
          <Label className="text-xs">Puntos</Label>
          <Input
            type="number"
            min={1}
            value={exercise.points}
            onChange={(e) => updateField('points', parseInt(e.target.value) || 1)}
            className="mt-1"
          />
        </div>
      </div>

      {/* Question */}
      <div>
        <Label className="text-xs">
          {exercise.type === 'fill_blank' ? 'Frase (usa ___ para el espacio)' :
           exercise.type === 'pronunciation' ? 'Palabra o frase a pronunciar' :
           exercise.type === 'true_false' ? 'Afirmación' :
           'Pregunta'}
        </Label>
        <Input
          value={exercise.question}
          onChange={(e) => updateField('question', e.target.value)}
          placeholder={
            exercise.type === 'fill_blank' ? 'She ___ to school every day.' :
            exercise.type === 'pronunciation' ? 'thought, through, though' :
            exercise.type === 'true_false' ? 'The past tense of "go" is "goed".' :
            'Escribe la pregunta...'
          }
          className="mt-1"
        />
      </div>

      {/* Type-specific fields */}
      {exercise.type === 'multiple_choice' && (
        <MultipleChoiceFields exercise={exercise} onChange={onChange} />
      )}
      {exercise.type === 'fill_blank' && (
        <FillBlankFields exercise={exercise} onChange={onChange} />
      )}
      {exercise.type === 'true_false' && (
        <TrueFalseFields exercise={exercise} onChange={onChange} />
      )}
      {exercise.type === 'matching' && (
        <MatchingFields exercise={exercise} onChange={onChange} />
      )}
      {exercise.type === 'free_text' && (
        <FreeTextField exercise={exercise} onChange={onChange} />
      )}
      {exercise.type === 'pronunciation' && (
        <PronunciationFields exercise={exercise} onChange={onChange} />
      )}
    </div>
  )
}

function MultipleChoiceFields({ exercise, onChange }: { exercise: ExerciseData; onChange: (d: ExerciseData) => void }) {
  const options = exercise.options || ['', '', '', '']

  const updateOption = (idx: number, value: string) => {
    const newOpts = [...options]
    newOpts[idx] = value
    onChange({ ...exercise, options: newOpts })
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs">Opciones (marca la correcta)</Label>
      {options.map((opt, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            type="radio"
            name={`correct-${exercise.order_index}`}
            checked={exercise.correct_answer === opt && opt !== ''}
            onChange={() => onChange({ ...exercise, correct_answer: opt })}
            className="h-4 w-4 text-primary-600"
          />
          <Input
            value={opt}
            onChange={(e) => updateOption(idx, e.target.value)}
            placeholder={`Opción ${idx + 1}`}
            className="flex-1"
          />
        </div>
      ))}
    </div>
  )
}

function FillBlankFields({ exercise, onChange }: { exercise: ExerciseData; onChange: (d: ExerciseData) => void }) {
  return (
    <div>
      <Label className="text-xs">Respuesta correcta</Label>
      <Input
        value={exercise.correct_answer}
        onChange={(e) => onChange({ ...exercise, correct_answer: e.target.value })}
        placeholder="goes"
        className="mt-1"
      />
      <p className="mt-1 text-xs text-neutral-400">Se comparará sin distinguir mayúsculas/minúsculas</p>
    </div>
  )
}

function TrueFalseFields({ exercise, onChange }: { exercise: ExerciseData; onChange: (d: ExerciseData) => void }) {
  return (
    <div className="flex gap-3">
      <Button
        type="button"
        variant={exercise.correct_answer === 'true' ? 'default' : 'outline'}
        className={exercise.correct_answer === 'true' ? 'btn-primary' : 'btn-secondary'}
        onClick={() => onChange({ ...exercise, correct_answer: 'true' })}
      >
        True
      </Button>
      <Button
        type="button"
        variant={exercise.correct_answer === 'false' ? 'default' : 'outline'}
        className={exercise.correct_answer === 'false' ? 'btn-primary' : 'btn-secondary'}
        onClick={() => onChange({ ...exercise, correct_answer: 'false' })}
      >
        False
      </Button>
    </div>
  )
}

function MatchingFields({ exercise, onChange }: { exercise: ExerciseData; onChange: (d: ExerciseData) => void }) {
  let pairs: Record<string, string> = {}
  try {
    pairs = typeof exercise.correct_answer === 'string'
      ? JSON.parse(exercise.correct_answer)
      : exercise.correct_answer || {}
  } catch {
    pairs = {}
  }

  const entries = Object.entries(pairs)
  if (entries.length === 0) entries.push(['', ''])

  const updatePair = (idx: number, side: 'key' | 'value', val: string) => {
    const newEntries = [...entries]
    if (side === 'key') {
      newEntries[idx] = [val, newEntries[idx][1]]
    } else {
      newEntries[idx] = [newEntries[idx][0], val]
    }
    const newPairs = Object.fromEntries(newEntries)
    onChange({ ...exercise, correct_answer: JSON.stringify(newPairs) })
  }

  const addPair = () => {
    const newPairs = { ...pairs, '': '' }
    onChange({ ...exercise, correct_answer: JSON.stringify(newPairs) })
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs">Pares (izquierda → derecha)</Label>
      {entries.map(([key, value], idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Input
            value={key}
            onChange={(e) => updatePair(idx, 'key', e.target.value)}
            placeholder="Término"
            className="flex-1"
          />
          <span className="text-neutral-400">→</span>
          <Input
            value={value}
            onChange={(e) => updatePair(idx, 'value', e.target.value)}
            placeholder="Definición"
            className="flex-1"
          />
        </div>
      ))}
      <Button type="button" variant="outline" className="btn-secondary text-xs" onClick={addPair}>
        + Agregar par
      </Button>
    </div>
  )
}

function FreeTextField({ exercise, onChange }: { exercise: ExerciseData; onChange: (d: ExerciseData) => void }) {
  return (
    <div>
      <Label className="text-xs">Respuesta sugerida (referencia para corrección manual)</Label>
      <Textarea
        value={exercise.correct_answer}
        onChange={(e) => onChange({ ...exercise, correct_answer: e.target.value })}
        placeholder="Respuesta de referencia..."
        className="mt-1"
        rows={3}
      />
      <p className="mt-1 text-xs text-neutral-400">Los ejercicios de texto libre requieren corrección manual</p>
    </div>
  )
}

function PronunciationFields({ exercise, onChange }: { exercise: ExerciseData; onChange: (d: ExerciseData) => void }) {
  return (
    <div>
      <Label className="text-xs">Pronunciación correcta (fonética, opcional)</Label>
      <Input
        value={exercise.correct_answer}
        onChange={(e) => onChange({ ...exercise, correct_answer: e.target.value })}
        placeholder="/θɔːt/"
        className="mt-1"
      />
    </div>
  )
}
