import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get tutor
    const { data: tutor } = await supabase
      .from('tutors')
      .select('id')
      .eq('auth_id', user.id)
      .single()
    if (!tutor) {
      return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })
    }

    const { lessonId } = await request.json()
    if (!lessonId) {
      return NextResponse.json({ error: 'lessonId is required' }, { status: 400 })
    }

    // Fetch lesson with sections
    const { data: lesson } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single()

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    const { data: sections } = await supabase
      .from('lesson_sections')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('order_index')

    // Format sections content
    const formattedSections = (sections || []).map((s: { type: string; title: string; content: Record<string, unknown> }) => {
      let content = ''
      const c = s.content

      if (s.type === 'vocabulary' && c.words) {
        const words = c.words as { word: string; translation: string; example?: string }[]
        content = words.map(w => `- ${w.word}: ${w.translation}${w.example ? ` (Example: ${w.example})` : ''}`).join('\n')
      } else if (s.type === 'grammar') {
        content = `Explanation: ${c.explanation || ''}\nFormula: ${c.formula || ''}\nExamples: ${((c.examples as { sentence: string }[]) || []).map(e => e.sentence).join(', ')}`
      } else if (s.type === 'exercise') {
        content = `Instructions: ${c.instructions || ''}\nQuestions: ${((c.questions as { question: string }[]) || []).map(q => q.question).join(', ')}`
      } else if (s.type === 'pronunciation') {
        const words = c.words as { word: string; tips?: string }[]
        content = (words || []).map(w => `- ${w.word}${w.tips ? `: ${w.tips}` : ''}`).join('\n')
      } else if (s.type === 'reading' || s.type === 'intro' || s.type === 'custom') {
        content = (c.html_content as string) || ''
      }

      return `[${s.type.toUpperCase()}] ${s.title}\n${content}`
    }).join('\n\n')

    // Call Anthropic Claude API
    const anthropic = new Anthropic()

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `You are an English teacher's assistant. Based on the following lesson content, generate a class summary that the teacher can share with students after the lesson.

LESSON: ${lesson.title}
LEVEL: ${lesson.level || 'Not specified'}

CONTENT:
${formattedSections}

Generate:
1. A brief, friendly summary of what was covered in class (2-3 paragraphs, in English)
2. Key points to remember (5-8 bullet points)
3. 3-5 practical examples with explanations

Format your response as JSON:
{
  "content": "The summary text...",
  "key_points": ["point 1", "point 2", ...],
  "examples": [
    { "sentence": "example sentence", "explanation": "why this is important" }
  ]
}`
        }
      ],
    })

    // Parse response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    let parsed: { content: string; key_points: string[]; examples: { sentence: string; explanation: string }[] }
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { content: responseText, key_points: [], examples: [] }
    } catch {
      parsed = { content: responseText, key_points: [], examples: [] }
    }

    // Save to lesson_summaries
    const { data: summary, error: saveError } = await supabase
      .from('lesson_summaries')
      .upsert({
        lesson_id: lessonId,
        tutor_id: tutor.id,
        content: parsed.content,
        key_points: parsed.key_points,
        examples: parsed.examples,
        is_edited: false,
      }, { onConflict: 'lesson_id,tutor_id' })
      .select()
      .single()

    // If upsert with composite conflict doesn't work, try insert then update
    if (saveError) {
      // Check if exists
      const { data: existing } = await supabase
        .from('lesson_summaries')
        .select('id')
        .eq('lesson_id', lessonId)
        .eq('tutor_id', tutor.id)
        .single()

      if (existing) {
        const { data: updated } = await supabase
          .from('lesson_summaries')
          .update({
            content: parsed.content,
            key_points: parsed.key_points,
            examples: parsed.examples,
            is_edited: false,
          })
          .eq('id', existing.id)
          .select()
          .single()

        return NextResponse.json({ summary: updated })
      } else {
        const { data: inserted } = await supabase
          .from('lesson_summaries')
          .insert({
            lesson_id: lessonId,
            tutor_id: tutor.id,
            content: parsed.content,
            key_points: parsed.key_points,
            examples: parsed.examples,
          })
          .select()
          .single()

        return NextResponse.json({ summary: inserted })
      }
    }

    return NextResponse.json({ summary })
  } catch (err) {
    console.error('AI Summary error:', err)
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
  }
}
