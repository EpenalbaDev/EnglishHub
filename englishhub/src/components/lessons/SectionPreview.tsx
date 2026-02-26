'use client'

import { PronunciationButton } from './PronunciationButton'
import type {
  LessonSection,
  VocabularyWord,
  GrammarExample,
  ExerciseQuestion,
  PronunciationWord,
} from '@/types/database'

interface SectionPreviewProps {
  section: LessonSection
}

export function SectionPreview({ section }: SectionPreviewProps) {
  return (
    <div className="rounded-lg bg-gradient-to-br from-primary-800 to-primary-900 p-6 text-white min-h-[300px]">
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-white/40">{section.type}</p>
      <h3 className="font-heading text-xl mb-4">{section.title || 'Sin título'}</h3>

      {section.type === 'vocabulary' && <VocabPreview content={section.content as { words: VocabularyWord[] }} />}
      {section.type === 'grammar' && <GrammarPreview content={section.content as { explanation: string; formula: string; examples: GrammarExample[] }} />}
      {section.type === 'exercise' && <ExercisePreview content={section.content as { instructions: string; questions: ExerciseQuestion[] }} />}
      {section.type === 'pronunciation' && <PronunPreview content={section.content as { words: PronunciationWord[] }} />}
      {['intro', 'reading', 'custom'].includes(section.type) && <TextPreview content={section.content as { html_content: string }} />}
    </div>
  )
}

function VocabPreview({ content }: { content: { words: VocabularyWord[] } }) {
  const words = (content.words || []).filter(w => w.word)
  if (words.length === 0) return <EmptyPreview />

  return (
    <div className="grid grid-cols-1 gap-3">
      {words.map((w, i) => (
        <div key={i} className="flex items-center gap-3 rounded-md bg-white/10 p-3">
          <PronunciationButton word={w.word} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base">{w.word}</p>
            <p className="text-xs text-accent-400">{w.phonetic}</p>
            <p className="text-xs text-white/60">{w.translation}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function GrammarPreview({ content }: { content: { explanation: string; formula: string; examples: GrammarExample[] } }) {
  if (!content.formula && !content.explanation) return <EmptyPreview />

  return (
    <div className="space-y-3">
      {content.formula && (
        <div className="rounded-md bg-accent-500/20 px-4 py-3 text-center">
          <p className="text-sm font-semibold text-accent-300">{content.formula}</p>
        </div>
      )}
      {content.explanation && (
        <p className="text-sm text-white/80">{content.explanation}</p>
      )}
      {content.examples?.filter(e => e.sentence).map((ex, i) => (
        <p key={i} className="text-sm italic text-white/70">
          &ldquo;{ex.sentence}&rdquo;
        </p>
      ))}
    </div>
  )
}

function ExercisePreview({ content }: { content: { instructions: string; questions: ExerciseQuestion[] } }) {
  const questions = (content.questions || []).filter(q => q.question || q.sentence)
  if (questions.length === 0 && !content.instructions) return <EmptyPreview />

  return (
    <div className="space-y-3">
      {content.instructions && <p className="text-sm text-white/80">{content.instructions}</p>}
      {questions.map((q, i) => (
        <div key={i} className="rounded-md bg-white/10 p-3">
          <p className="text-sm">{q.sentence || q.question}</p>
        </div>
      ))}
    </div>
  )
}

function PronunPreview({ content }: { content: { words: PronunciationWord[] } }) {
  const words = (content.words || []).filter(w => w.word)
  if (words.length === 0) return <EmptyPreview />

  return (
    <div className="flex flex-col items-center gap-4">
      {words.slice(0, 1).map((w, i) => (
        <div key={i} className="text-center">
          <p className="text-3xl font-bold">{w.word}</p>
          <p className="mt-1 text-accent-400">{w.phonetic}</p>
          <PronunciationButton word={w.word} size="lg" className="mx-auto mt-3" />
          {w.tips && <p className="mt-3 text-sm text-white/60">{w.tips}</p>}
        </div>
      ))}
    </div>
  )
}

function TextPreview({ content }: { content: { html_content: string } }) {
  if (!content.html_content) return <EmptyPreview />
  return <p className="text-sm text-white/80 whitespace-pre-wrap">{content.html_content}</p>
}

function EmptyPreview() {
  return <p className="text-sm text-white/30 text-center py-8">Vista previa aparecerá aquí</p>
}
