'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { PronunciationButton } from './PronunciationButton'
import { cn } from '@/lib/utils'
import type {
  LessonSection,
  VocabularyWord,
  GrammarExample,
  ExerciseQuestion,
  PronunciationWord,
} from '@/types/database'

interface PresentationViewProps {
  title: string
  sections: LessonSection[]
}

export function PresentationView({ title, sections }: PresentationViewProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState<'left' | 'right'>('right')
  const [isAnimating, setIsAnimating] = useState(false)

  const goTo = useCallback((index: number) => {
    if (index < 0 || index >= sections.length || isAnimating) return
    setDirection(index > currentIndex ? 'right' : 'left')
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentIndex(index)
      setIsAnimating(false)
    }, 300)
  }, [currentIndex, sections.length, isAnimating])

  const goNext = useCallback(() => goTo(currentIndex + 1), [goTo, currentIndex])
  const goPrev = useCallback(() => goTo(currentIndex - 1), [goTo, currentIndex])

  const handleExit = useCallback(() => {
    router.back()
  }, [router])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev() }
      if (e.key === 'Escape') handleExit()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goNext, goPrev, handleExit])

  if (sections.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-primary-800 to-primary-900">
        <p className="text-white/50 text-lg">Esta lección no tiene secciones.</p>
      </div>
    )
  }

  const section = sections[currentIndex]

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-gradient-to-br from-primary-800 to-primary-900">
      {/* Exit button */}
      <button
        onClick={handleExit}
        className="absolute right-4 top-4 z-50 rounded-full bg-white/10 p-2 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
      >
        <X className="h-5 w-5" strokeWidth={1.75} />
      </button>

      {/* Section title indicator */}
      <div className="absolute left-6 top-5 z-40">
        <p className="text-xs font-medium uppercase tracking-wider text-white/30">{title}</p>
      </div>

      {/* Navigation arrows */}
      {currentIndex > 0 && (
        <button
          onClick={goPrev}
          className="absolute left-4 top-1/2 z-40 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white/60 transition-all hover:bg-white/20 hover:text-white"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={1.75} />
        </button>
      )}
      {currentIndex < sections.length - 1 && (
        <button
          onClick={goNext}
          className="absolute right-4 top-1/2 z-40 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white/60 transition-all hover:bg-white/20 hover:text-white"
        >
          <ChevronRight className="h-6 w-6" strokeWidth={1.75} />
        </button>
      )}

      {/* Section content */}
      <div
        className={cn(
          'flex-1 flex items-center justify-center p-8 transition-all duration-300',
          isAnimating && direction === 'right' && 'translate-x-[-100%] opacity-0',
          isAnimating && direction === 'left' && 'translate-x-[100%] opacity-0',
        )}
      >
        <div className="w-full max-w-4xl animate-fade-in">
          <SectionSlide section={section} />
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center justify-center gap-2 py-4">
        {sections.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={cn(
              'h-2 rounded-full transition-all duration-200',
              i === currentIndex ? 'w-8 bg-accent-400' : 'w-2 bg-white/20 hover:bg-white/40'
            )}
          />
        ))}
      </div>
    </div>
  )
}

// ============================================
// Section Slides
// ============================================
function SectionSlide({ section }: { section: LessonSection }) {
  switch (section.type) {
    case 'vocabulary':
      return <VocabSlide section={section} />
    case 'grammar':
      return <GrammarSlide section={section} />
    case 'exercise':
      return <ExerciseSlide section={section} />
    case 'pronunciation':
      return <PronunciationSlide section={section} />
    default:
      return <TextSlide section={section} />
  }
}

// --- TEXT SLIDE (intro, reading, custom) ---
function TextSlide({ section }: { section: LessonSection }) {
  const content = section.content as { html_content: string; image_url?: string }
  return (
    <div className="text-center">
      <h2 className="font-heading text-4xl text-white lg:text-5xl">{section.title}</h2>
      {content.html_content && (
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/80 whitespace-pre-wrap lg:text-xl">
          {content.html_content}
        </p>
      )}
    </div>
  )
}

// --- VOCABULARY SLIDE ---
function VocabSlide({ section }: { section: LessonSection }) {
  const content = section.content as { words: VocabularyWord[] }
  const words = (content.words || []).filter(w => w.word)

  return (
    <div>
      <h2 className="font-heading text-3xl text-white text-center mb-8">{section.title}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {words.map((word, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl bg-white/10 p-5 backdrop-blur-sm">
            <PronunciationButton word={word.word} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="text-2xl font-bold text-white">{word.word}</p>
              <p className="text-sm text-accent-400">{word.phonetic}</p>
              <p className="mt-1 text-base text-white/70">{word.translation}</p>
              {word.example && (
                <p className="mt-2 text-sm italic text-white/50">&ldquo;{word.example}&rdquo;</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- GRAMMAR SLIDE ---
function GrammarSlide({ section }: { section: LessonSection }) {
  const content = section.content as { explanation: string; formula: string; examples: GrammarExample[] }

  return (
    <div className="text-center">
      <h2 className="font-heading text-3xl text-white mb-6">{section.title}</h2>

      {content.formula && (
        <div className="mx-auto mb-8 max-w-xl rounded-xl bg-accent-500/20 px-8 py-5">
          <p className="text-xl font-semibold text-accent-300 lg:text-2xl">{content.formula}</p>
        </div>
      )}

      {content.explanation && (
        <p className="mx-auto mb-8 max-w-2xl text-lg text-white/80 leading-relaxed">{content.explanation}</p>
      )}

      {content.examples?.filter(e => e.sentence).map((ex, i) => {
        // Highlight the specified part
        const parts = ex.highlight
          ? ex.sentence.split(new RegExp(`(${ex.highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
          : [ex.sentence]

        return (
          <p key={i} className="text-lg text-white/70 mt-3">
            &ldquo;{parts.map((part, j) =>
              part.toLowerCase() === ex.highlight?.toLowerCase()
                ? <span key={j} className="font-bold text-accent-400">{part}</span>
                : part
            )}&rdquo;
          </p>
        )
      })}
    </div>
  )
}

// --- EXERCISE SLIDE ---
function ExerciseSlide({ section }: { section: LessonSection }) {
  const content = section.content as { instructions: string; questions: ExerciseQuestion[] }
  const questions = (content.questions || []).filter(q => q.question || q.sentence)
  const [qIndex, setQIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)

  const currentQ = questions[qIndex]

  if (questions.length === 0) return <TextSlide section={section} />

  return (
    <div className="text-center">
      <h2 className="font-heading text-3xl text-white mb-4">{section.title}</h2>
      {content.instructions && <p className="text-lg text-white/60 mb-8">{content.instructions}</p>}

      <div className="mx-auto max-w-xl rounded-xl bg-white/10 p-8 backdrop-blur-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-white/30 mb-4">
          Pregunta {qIndex + 1} de {questions.length}
        </p>
        <p className="text-2xl text-white mb-6">{currentQ?.sentence || currentQ?.question}</p>

        {currentQ?.options && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {currentQ.options.map((opt, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-lg border-2 px-4 py-3 text-left text-white transition-colors cursor-pointer',
                  revealed && opt === currentQ.answer
                    ? 'border-accent-400 bg-accent-500/20'
                    : 'border-white/20 hover:border-white/40'
                )}
              >
                {opt}
              </div>
            ))}
          </div>
        )}

        {revealed ? (
          <div className="rounded-lg bg-accent-500/20 px-4 py-3 mb-4">
            <p className="text-accent-300 font-semibold">{currentQ?.answer}</p>
          </div>
        ) : (
          <button
            onClick={() => setRevealed(true)}
            className="flex items-center gap-2 mx-auto rounded-full bg-white/10 px-6 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/20 hover:text-white mb-4"
          >
            <Eye className="h-4 w-4" strokeWidth={1.75} />
            Revelar respuesta
          </button>
        )}

        <div className="flex justify-center gap-3">
          <button
            onClick={() => { setQIndex(Math.max(0, qIndex - 1)); setRevealed(false) }}
            disabled={qIndex === 0}
            className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/60 disabled:opacity-30 hover:bg-white/20"
          >
            Anterior
          </button>
          <button
            onClick={() => { setQIndex(Math.min(questions.length - 1, qIndex + 1)); setRevealed(false) }}
            disabled={qIndex === questions.length - 1}
            className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/60 disabled:opacity-30 hover:bg-white/20"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  )
}

// --- PRONUNCIATION SLIDE ---
function PronunciationSlide({ section }: { section: LessonSection }) {
  const content = section.content as { words: PronunciationWord[] }
  const words = (content.words || []).filter(w => w.word)
  const [wordIndex, setWordIndex] = useState(0)

  const currentWord = words[wordIndex]
  if (!currentWord) return <TextSlide section={section} />

  return (
    <div className="text-center">
      <h2 className="font-heading text-2xl text-white/60 mb-8">{section.title}</h2>

      <p className="text-5xl font-bold text-white lg:text-6xl">{currentWord.word}</p>
      <p className="mt-3 text-xl text-accent-400">{currentWord.phonetic}</p>

      <div className="mt-8">
        <PronunciationButton word={currentWord.word} size="lg" className="mx-auto" />
      </div>

      {currentWord.tips && (
        <p className="mx-auto mt-8 max-w-md text-base text-white/50">{currentWord.tips}</p>
      )}

      {words.length > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={() => setWordIndex(Math.max(0, wordIndex - 1))}
            disabled={wordIndex === 0}
            className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/60 disabled:opacity-30 hover:bg-white/20"
          >
            Anterior
          </button>
          <span className="text-sm text-white/30">{wordIndex + 1} / {words.length}</span>
          <button
            onClick={() => setWordIndex(Math.min(words.length - 1, wordIndex + 1))}
            disabled={wordIndex === words.length - 1}
            className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/60 disabled:opacity-30 hover:bg-white/20"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}
