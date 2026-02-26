'use client'

import { Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePronunciation } from '@/hooks/usePronunciation'

interface PronunciationButtonProps {
  word: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
}

const iconSizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
}

export function PronunciationButton({ word, size = 'md', className }: PronunciationButtonProps) {
  const { isSpeaking, isSupported, speak } = usePronunciation()

  if (!isSupported) return null

  return (
    <button
      onClick={(e) => { e.stopPropagation(); speak(word) }}
      className={cn(
        'relative flex items-center justify-center rounded-full bg-primary-600 text-white transition-all duration-150 hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2',
        sizeMap[size],
        isSpeaking && 'animate-pulse',
        className
      )}
      title={`Pronunciar "${word}"`}
    >
      {isSpeaking && (
        <>
          <span className="absolute inset-0 animate-ping rounded-full bg-primary-400 opacity-30" />
          <span className="absolute inset-[-4px] animate-pulse rounded-full border-2 border-primary-300 opacity-40" />
        </>
      )}
      <Volume2 className={cn(iconSizeMap[size], 'relative z-10')} strokeWidth={1.75} />
    </button>
  )
}
