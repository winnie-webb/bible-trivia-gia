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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground text-xl">Loading profile...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">No Profile Found</h2>
          <p className="text-muted mb-6">Please create a profile by playing a game first.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-primary hover:bg-primary-hover text-foreground font-bold py-3 px-6 rounded-lg transition"
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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-foreground">Profile</h1>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 bg-glass hover:bg-glass-hover px-4 py-2 rounded-lg text-foreground transition"
          >
            <Home className="w-5 h-5" />
            Home
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Profile Card */}
          <div className="md:col-span-1 bg-glass backdrop-blur-sm rounded-lg p-6">
            <div className="text-center">
              <div className="w-24 h-24 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center text-4xl font-bold text-foreground">
                {profile.username[0].toUpperCase()}
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">{profile.username}</h2>
              <p className="text-muted">
                Member since {new Date(profile.createdAt).toLocaleDateString()}
              </p>
              
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center justify-center gap-2 text-highlight">
                  <Award className="w-5 h-5" />
                  <span className="text-lg font-semibold">
                    {unlockedAchievements.length} / {ACHIEVEMENTS.length}
                  </span>
                </div>
                <p className="text-muted text-sm mt-1">Achievements Unlocked</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div className="bg-glass backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-6 h-6 text-highlight" />
                <span className="text-muted">Total Wins</span>
              </div>
              <p className="text-4xl font-bold text-foreground">{profile.totalWins}</p>
              <p className="text-sm text-muted mt-1">{winRate}% win rate</p>
            </div>

            <div className="bg-glass backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-6 h-6 text-success" />
                <span className="text-muted">Accuracy</span>
              </div>
              <p className="text-4xl font-bold text-foreground">{accuracy}%</p>
              <p className="text-sm text-muted mt-1">{profile.totalCorrect} correct</p>
            </div>

            <div className="bg-glass backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6 text-soft" />
                <span className="text-muted">Games Played</span>
              </div>
              <p className="text-4xl font-bold text-foreground">{profile.totalGames}</p>
            </div>

            <div className="bg-glass backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-6 h-6 text-primary" />
                <span className="text-muted">Fastest Answer</span>
              </div>
              <p className="text-4xl font-bold text-foreground">
                {profile.fastestAnswer ? `${profile.fastestAnswer.toFixed(2)}s` : 'N/A'}
              </p>
            </div>

            <div className="bg-glass backdrop-blur-sm rounded-lg p-6 col-span-2">
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-6 h-6 text-highlight" />
                <span className="text-muted">Streak Records</span>
              </div>
              <div className="flex justify-around mt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{profile.currentStreak}</p>
                  <p className="text-sm text-muted">Current</p>
                </div>
                <div className="h-12 w-px bg-border"></div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{profile.bestStreak}</p>
                  <p className="text-sm text-muted">Best Ever</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="bg-glass backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Award className="w-6 h-6 text-highlight" />
            Achievements
          </h2>

          {/* Unlocked Achievements */}
          {unlockedAchievements.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-success mb-4">Unlocked ({unlockedAchievements.length})</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {unlockedAchievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.key}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-success/10 border border-success/30 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{achievement.icon}</span>
                      <div>
                        <h4 className="font-bold text-foreground">{achievement.name}</h4>
                        <p className="text-xs text-muted">{achievement.description}</p>
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
              <h3 className="text-lg font-semibold text-muted mb-4">Locked ({lockedAchievements.length})</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {lockedAchievements.map((achievement) => (
                  <div
                    key={achievement.key}
                    className="bg-glass border border-border rounded-lg p-4 opacity-60"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Lock className="w-8 h-8 text-muted" />
                      <div>
                        <h4 className="font-bold text-muted">{achievement.name}</h4>
                        <p className="text-xs text-muted">{achievement.description}</p>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted">
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