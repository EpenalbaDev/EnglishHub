export interface Tutor {
  id: string
  auth_id: string
  email: string
  full_name: string
  phone: string | null
  avatar_url: string | null
  business_name: string | null
  timezone: string
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type SaaSPlan = 'trial' | 'starter' | 'pro'
export type AccountStatus = 'active' | 'suspended'

export interface AdminRole {
  id: string
  user_id: string
  role: 'super_admin'
  created_at: string
}

export interface TutorSubscription {
  id: string
  tutor_id: string
  plan: SaaSPlan
  status: AccountStatus
  trial_ends_at: string | null
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
  updated_at: string
}

export interface Student {
  id: string
  tutor_id: string
  auth_id: string | null
  full_name: string
  email: string | null
  phone: string | null
  avatar_url: string | null
  status: 'active' | 'inactive' | 'trial'
  level: 'beginner' | 'elementary' | 'intermediate' | 'upper_intermediate' | 'advanced' | null
  notes: string | null
  monthly_rate: number | null
  enrollment_date: string
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  tutor_id: string
  student_id: string
  amount: number
  currency: string
  payment_date: string
  period_start: string | null
  period_end: string | null
  method: 'cash' | 'transfer' | 'yappy' | 'nequi' | 'card' | 'other' | null
  status: 'paid' | 'pending' | 'overdue' | 'cancelled'
  notes: string | null
  receipt_url: string | null
  created_at: string
  updated_at: string
}

// Join types
export interface PaymentWithStudent extends Payment {
  student: Pick<Student, 'id' | 'full_name' | 'email'>
}

export interface StudentWithPayments extends Student {
  payments: Payment[]
  last_payment?: Payment
}

// ============================================
// LESSONS
// ============================================

export interface Lesson {
  id: string
  tutor_id: string
  title: string
  description: string | null
  category: string | null
  level: Student['level']
  tags: string[] | null
  cover_image_url: string | null
  is_published: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export type SectionType = 'intro' | 'vocabulary' | 'grammar' | 'exercise' | 'pronunciation' | 'reading' | 'custom'

export interface LessonSection {
  id: string
  lesson_id: string
  title: string
  type: SectionType
  content: SectionContent
  order_index: number
  created_at: string
  updated_at: string
}

// Content types per section
export interface VocabularyWord {
  word: string
  translation: string
  phonetic: string
  example: string
  image_url?: string
}

export interface GrammarExample {
  sentence: string
  highlight: string
}

export interface ExerciseQuestion {
  type: 'fill_blank' | 'multiple_choice' | 'true_false' | 'matching'
  question: string
  sentence?: string
  answer: string
  options?: string[]
  pairs?: Record<string, string>
}

export interface PronunciationWord {
  word: string
  phonetic: string
  audio_url?: string
  tips: string
}

export type SectionContent =
  | { words: VocabularyWord[] }
  | { explanation: string; formula: string; examples: GrammarExample[] }
  | { instructions: string; questions: ExerciseQuestion[] }
  | { words: PronunciationWord[] }
  | { html_content: string; image_url?: string }

export interface LessonWithSections extends Lesson {
  sections: LessonSection[]
}

// ============================================
// ASSIGNMENTS
// ============================================

export interface Assignment {
  id: string
  tutor_id: string
  lesson_id: string | null
  title: string
  description: string | null
  public_token: string
  is_active: boolean
  audience: 'all_active_students' | 'selected_students'
  time_limit_minutes: number | null
  due_date: string | null
  available_until: string | null
  created_at: string
  updated_at: string
}

export type ExerciseType = 'multiple_choice' | 'fill_blank' | 'true_false' | 'matching' | 'free_text' | 'pronunciation'

export interface AssignmentExercise {
  id: string
  assignment_id: string
  type: ExerciseType
  question: string
  options: string[] | null
  correct_answer: string
  points: number
  order_index: number
  created_at: string
}

export interface AssignmentSubmission {
  id: string
  assignment_id: string
  student_id: string | null
  student_name: string | null
  student_email: string | null
  answers: Record<string, string>
  score: number | null
  max_score: number | null
  is_guest_submission: boolean
  started_at: string | null
  submitted_at: string
}

export interface AssignmentRecipient {
  assignment_id: string
  student_id: string
  assigned_at: string
  status: 'assigned' | 'completed'
}

export interface LessonSummary {
  id: string
  lesson_id: string
  tutor_id: string
  content: string
  key_points: string[] | null
  examples: { sentence: string; explanation: string }[] | null
  is_edited: boolean
  share_token: string
  created_at: string
  updated_at: string
}

// Joins
export interface AssignmentWithExercises extends Assignment {
  exercises: AssignmentExercise[]
}

export interface AssignmentWithResults extends Assignment {
  exercises: AssignmentExercise[]
  submissions: AssignmentSubmission[]
}

// ============================================
// SCHEDULED CLASSES
// ============================================

export interface ScheduledClass {
  id: string
  tutor_id: string
  student_id: string | null
  lesson_id: string | null
  title: string
  start_time: string
  end_time: string
  location: string | null
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  notes: string | null
  recurrence_rule: string | null
  created_at: string
  updated_at: string
}

export interface ScheduledClassWithDetails extends ScheduledClass {
  student: Pick<Student, 'id' | 'full_name' | 'email'> | null
  lesson: Pick<Lesson, 'id' | 'title'> | null
}
