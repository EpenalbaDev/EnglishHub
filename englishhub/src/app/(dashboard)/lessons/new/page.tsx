'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LessonBuilder } from '@/components/lessons/LessonBuilder'

export default function NewLessonPage() {
  const router = useRouter()
  const [lessonId, setLessonId] = useState<string | null>(null)

  useEffect(() => {
    const create = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: tutor } = await supabase
        .from('tutors')
        .select('id')
        .eq('auth_id', user.id)
        .single()

      if (!tutor) return

      const { data: lesson } = await supabase
        .from('lessons')
        .insert({ tutor_id: tutor.id, title: 'Sin título' })
        .select()
        .single()

      if (lesson) {
        // Redirect to the edit page
        router.replace(`/lessons/${lesson.id}`)
      }
    }
    create()
  }, [router])

  return (
    <div className="flex h-64 items-center justify-center text-neutral-400">
      Creando lección...
    </div>
  )
}
