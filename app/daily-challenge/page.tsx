'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getProfile } from '@/lib/localStorage'
import { Calendar, Trophy, Home, Play } from 'lucide-react'
import { motion } from 'framer-motion'

export const dynamic = 'force-dynamic'

type DailyChallenge = {
  date: string
  difficulty: string
  category: string
  questionCount: number
  completed: boolean
  score?: number
  topScore: number
  participantCount: number
}

export default function DailyChallengePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [todayChallenge, setTodayChallenge] = useState<DailyChallenge | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userProfile = getProfile()
    if (!userProfile) {
      router.push('/')
      return
    }
    setProfile(userProfile)
    loadDailyChallenge()
  }, [])

  const loadDailyChallenge = async () => {
    // For now, generate a mock daily challenge
    // In production, this would fetch from Supabase
    const today = new Date().toISOString().split('T')[0]
    
    const mockChallenge: DailyChallenge = {
      date: today,
      difficulty: 'mixed',
      category: 'Mixed',
      questionCount: 10,
      completed: false,
      topScore: 8540,
      participantCount: 127
    }

    // Check if completed today (from localStorage)
    const completedChallenges = JSON.parse(localStorage.getItem('dailyChallenges') || '{}')
    if (completedChallenges[today]) {
      mockChallenge.completed = true
      mockChallenge.score = completedChallenges[today].score
    }

    setTodayChallenge(mockChallenge)
    setLoading(false)
  }

  const startChallenge = () => {
    // Create a special daily challenge room
    router.push('/daily-challenge/play')
  }

  if (loading || !todayChallenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading challenge...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            <Calendar className="w-10 h-10 text-yellow-400" />
            Daily Challenge
          </h1>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-white transition"
          >
            <Home className="w-5 h-5" />
            Home
          </button>
        </div>

        {/* Today's Challenge Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-400/50 rounded-lg p-8 mb-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {new Date(todayChallenge.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </h2>
              <p className="text-gray-300">
                📖 {todayChallenge.category} • {todayChallenge.difficulty} difficulty • {todayChallenge.questionCount} questions
              </p>
            </div>
            {todayChallenge.completed && (
              <div className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold">
                ✓ Completed
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{todayChallenge.topScore}</p>
              <p className="text-sm text-gray-300">Top Score Today</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <Calendar className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{todayChallenge.participantCount}</p>
              <p className="text-sm text-gray-300">Participants</p>
            </div>
            {todayChallenge.completed && todayChallenge.score !== undefined && (
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <Trophy className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{todayChallenge.score}</p>
                <p className="text-sm text-gray-300">Your Score</p>
              </div>
            )}
          </div>

          {!todayChallenge.completed ? (
            <button
              onClick={startChallenge}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Play className="w-6 h-6" />
              Start Today's Challenge
            </button>
          ) : (
            <div className="text-center">
              <p className="text-white text-lg mb-2">
                Great job! You've completed today's challenge.
              </p>
              <p className="text-gray-300">Come back tomorrow for a new challenge!</p>
            </div>
          )}
        </motion.div>

        {/* Info Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">How Daily Challenges Work</h3>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 mt-1">•</span>
              <span>A new challenge is available every day at midnight</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 mt-1">•</span>
              <span>Everyone gets the same questions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 mt-1">•</span>
              <span>You can only attempt the challenge once per day</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 mt-1">•</span>
              <span>Compete for the top score on the global leaderboard</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 mt-1">•</span>
              <span>Build your streak by completing consecutive daily challenges</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}