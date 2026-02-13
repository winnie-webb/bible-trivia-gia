'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getProfile, ACHIEVEMENTS, getUnlockedAchievements, getLockedAchievements } from '@/lib/localStorage'
import { Trophy, Target, Zap, Award, TrendingUp, Home, Lock } from 'lucide-react'
import { motion } from 'framer-motion'

export const dynamic = 'force-dynamic'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [unlockedAchievements, setUnlockedAchievements] = useState<any[]>([])
  const [lockedAchievements, setLockedAchievements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userProfile = getProfile()
    if (!userProfile) {
      router.push('/')
      return
    }
    setProfile(userProfile)
    setUnlockedAchievements(getUnlockedAchievements())
    setLockedAchievements(getLockedAchievements())
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">No Profile Found</h2>
          <p className="text-gray-300 mb-6">Please create a profile by playing a game first.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  const winRate = profile.totalGames > 0 ? ((profile.totalWins / profile.totalGames) * 100).toFixed(1) : '0'
  const accuracy = profile.totalQuestions > 0 ? ((profile.totalCorrect / profile.totalQuestions) * 100).toFixed(1) : '0'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-white">Profile</h1>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-white transition"
          >
            <Home className="w-5 h-5" />
            Home
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Profile Card */}
          <div className="md:col-span-1 bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl font-bold text-white">
                {profile.username[0].toUpperCase()}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{profile.username}</h2>
              <p className="text-gray-400">
                Member since {new Date(profile.createdAt).toLocaleDateString()}
              </p>
              
              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="flex items-center justify-center gap-2 text-yellow-400">
                  <Award className="w-5 h-5" />
                  <span className="text-lg font-semibold">
                    {unlockedAchievements.length} / {ACHIEVEMENTS.length}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-1">Achievements Unlocked</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <span className="text-gray-300">Total Wins</span>
              </div>
              <p className="text-4xl font-bold text-white">{profile.totalWins}</p>
              <p className="text-sm text-gray-400 mt-1">{winRate}% win rate</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-6 h-6 text-green-400" />
                <span className="text-gray-300">Accuracy</span>
              </div>
              <p className="text-4xl font-bold text-white">{accuracy}%</p>
              <p className="text-sm text-gray-400 mt-1">{profile.totalCorrect} correct</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6 text-blue-400" />
                <span className="text-gray-300">Games Played</span>
              </div>
              <p className="text-4xl font-bold text-white">{profile.totalGames}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-6 h-6 text-purple-400" />
                <span className="text-gray-300">Fastest Answer</span>
              </div>
              <p className="text-4xl font-bold text-white">
                {profile.fastestAnswer ? `${profile.fastestAnswer.toFixed(2)}s` : 'N/A'}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 col-span-2">
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-6 h-6 text-orange-400" />
                <span className="text-gray-300">Streak Records</span>
              </div>
              <div className="flex justify-around mt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{profile.currentStreak}</p>
                  <p className="text-sm text-gray-400">Current</p>
                </div>
                <div className="h-12 w-px bg-white/20"></div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{profile.bestStreak}</p>
                  <p className="text-sm text-gray-400">Best Ever</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Award className="w-6 h-6 text-yellow-400" />
            Achievements
          </h2>

          {/* Unlocked Achievements */}
          {unlockedAchievements.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-green-400 mb-4">Unlocked ({unlockedAchievements.length})</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {unlockedAchievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.key}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gradient-to-br from-green-500/20 to-blue-500/20 border-2 border-green-400/50 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{achievement.icon}</span>
                      <div>
                        <h4 className="font-bold text-white">{achievement.name}</h4>
                        <p className="text-xs text-gray-300">{achievement.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Locked Achievements */}
          {lockedAchievements.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-400 mb-4">Locked ({lockedAchievements.length})</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {lockedAchievements.map((achievement) => (
                  <div
                    key={achievement.key}
                    className="bg-white/5 border-2 border-white/10 rounded-lg p-4 opacity-60"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Lock className="w-8 h-8 text-gray-500" />
                      <div>
                        <h4 className="font-bold text-gray-300">{achievement.name}</h4>
                        <p className="text-xs text-gray-400">{achievement.description}</p>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Requirement: {achievement.requirementValue} {achievement.requirementType.replace('_', ' ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}