'use client'

import { useState, useEffect, useCallback } from 'react'
import { speak as speakFn, stopSpeaking, isSpeechSupported } from '@/lib/speech/pronunciation'

export function usePronunciation() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    setIsSupported(isSpeechSupported())
  }, [])

  const speak = useCallback(async (text: string) => {
    if (!isSupported) return
    setIsSpeaking(true)
    try {
      await speakFn(text)
    } catch {
      // Ignore speech errors
    } finally {
      setIsSpeaking(false)
    }
  }, [isSupported])

  const stop = useCallback(() => {
    stopSpeaking()
    setIsSpeaking(false)
  }, [])

  return { isSpeaking, isSupported, speak, stop }
}
