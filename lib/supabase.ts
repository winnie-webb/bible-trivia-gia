import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Room = {
  id: string
  code: string
  owner_id: string
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed'
  question_count: number
  time_limit: number
  status: 'waiting' | 'active' | 'finished'
  current_question: number
  created_at: string
  category?: string
  power_ups_enabled?: boolean
}

export type RoomPlayer = {
  id: string
  room_id: string
  player_id: string
  player_name: string
  score: number
  ready: boolean
  joined_at: string
}

export type Question = {
  question: string
  options: string[]
  correct_index: number
  difficulty: string
  category: string
}

export type GameState = {
  id: string
  room_id: string
  questions: Question[]
  answers: Record<string, any>
  updated_at: string
}