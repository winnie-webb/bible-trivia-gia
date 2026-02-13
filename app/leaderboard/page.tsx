'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getProfile } from '@/lib/localStorage'
import { Trophy, Home, Medal, Award, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

export const dynamic = 'force-dynamic'

type LeaderboardEntry = {
  rank: number
  username: string
  totalWins: number
  totalGames: number
  accuracy: number
  winRate: number
  isCurrentUser: boolean
}

export default function LeaderboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [selectedTab, setSelectedTab] = useState<'wins' | 'accuracy' | 'games'>('wins')

  useEffect(() => {
    const userProfile = getProfile()
    if (!userProfile) {
      router.push('/')
      return
    }
    setProfile(userProfile)
    loadLeaderboard()
  }, [selectedTab])

  const loadLeaderboard = () => {
    // In a real app, this would fetch from Supabase or a global database
    // For now, we'll create mock data showing the current user among others
    
    const mockUsers: LeaderboardEntry[] = [
      {
        rank: 1,
        username: 'BiblicalScholar',
        totalWins: 156,
        totalGames: 200,
        accuracy: 94,
        winRate: 78,
        isCurrentUser: false
      },
      {
        rank: 2,
        username: 'ProphetKing',
        totalWins: 142,
        totalGames: 185,
        accuracy: 91,
        winRate: 77,
        isCurrentUser: false
      },
      {
        rank: 3,
        username: 'ScriptureExpert',
        totalWins: 128,
        totalGames: 170,
        accuracy: 89,
        winRate: 75,
        isCurrentUser: false
      },
    ]

    if (profile) {
      const userWinRate = profile.totalGames > 0 ? (profile.totalWins / profile.totalGames) * 100 : 0
      const userAccuracy = profile.totalQuestions > 0 ? (profile.totalCorrect / profile.totalQuestions) * 100 : 0

      // Insert current user in appropriate position
      let userRank = mockUsers.length + 1
      for (let i = 0; i < mockUsers.length; i++) {
        if (selectedTab === 'wins' && profile.totalWins > mockUsers[i].totalWins) {
          userRank = i + 1
          break
        } else if (selectedTab === 'accuracy' && userAccuracy > mockUsers[i].accuracy) {
          userRank = i + 1
          break
        } else if (selectedTab === 'games' && profile.totalGames > mockUsers[i].totalGames) {
          userRank = i + 1
          break
        }
      }

      const userEntry: LeaderboardEntry = {
        rank: userRank,
        username: profile.username,
        totalWins: profile.totalWins,
        totalGames: profile.totalGames,
        accuracy: Math.round(userAccuracy),
        winRate: Math.round(userWinRate),
        isCurrentUser: true
      }

      if (userRank <= mockUsers.length) {
        mockUsers.splice(userRank - 1, 0, userEntry)
      } else {
        mockUsers.push(userEntry)
      }

      // Adjust ranks
      mockUsers.forEach((entry, index) => {
        entry.rank = index + 1
      })
    }

    setLeaderboard(mockUsers)
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-8 h-8 text-yellow-400" />
      case 2:
        return <Medal className="w-8 h-8 text-gray-300" />
      case 3:
        return <Medal className="w-8 h-8 text-orange-400" />
      default:
        return <span className="text-xl font-bold text-white">#{rank}</span>
    }
  }

  const getSortValue = (entry: LeaderboardEntry) => {
    switch (selectedTab) {
      case 'wins':
        return entry.totalWins
      case 'accuracy':
        return entry.accuracy
      case 'games':
        return entry.totalGames
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            <Trophy className="w-10 h-10 text-yellow-400" />
            Leaderboard
          </h1>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-white transition"
          >
            <Home className="w-5 h-5" />
            Home
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSelectedTab('wins')}
            className={`flex-1 py-3 rounded-lg font-semibold transition ${
              selectedTab === 'wins'
                ? 'bg-yellow-500 text-gray-900'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Trophy className="w-5 h-5 inline-block mr-2" />
            Most Wins
          </button>
          <button
            onClick={() => setSelectedTab('accuracy')}
            className={`flex-1 py-3 rounded-lg font-semibold transition ${
              selectedTab === 'accuracy'
                ? 'bg-green-500 text-white'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Award className="w-5 h-5 inline-block mr-2" />
            Best Accuracy
          </button>
          <button
            onClick={() => setSelectedTab('games')}
            className={`flex-1 py-3 rounded-lg font-semibold transition ${
              selectedTab === 'games'
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Zap className="w-5 h-5 inline-block mr-2" />
            Most Games
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-500/20 border border-blue-400 rounded-lg p-4 mb-6">
          <p className="text-white text-sm">
            <strong>Note:</strong> This is a local leaderboard. In the full version, this would show global rankings from all players.
          </p>
        </div>

        {/* Leaderboard */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <motion.div
                key={entry.username}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  entry.isCurrentUser
                    ? 'bg-blue-500/30 border-2 border-blue-400'
                    : entry.rank === 1
                    ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border-2 border-yellow-400'
                    : 'bg-white/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 flex items-center justify-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">
                      {entry.username}
                      {entry.isCurrentUser && (
                        <span className="ml-2 text-xs bg-blue-500 px-2 py-1 rounded">YOU</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-300">
                      {entry.totalGames} games • {entry.winRate}% win rate
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-yellow-400">
                    {getSortValue(entry)}
                    {selectedTab === 'accuracy' && '%'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {selectedTab === 'wins' && 'wins'}
                    {selectedTab === 'accuracy' && 'accuracy'}
                    {selectedTab === 'games' && 'games'}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats Summary */}
        {profile && (
          <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Your Global Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-400">{profile.totalWins}</p>
                <p className="text-sm text-gray-300">Total Wins</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-400">
                  {profile.totalQuestions > 0
                    ? Math.round((profile.totalCorrect / profile.totalQuestions) * 100)
                    : 0}%
                </p>
                <p className="text-sm text-gray-300">Accuracy</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-400">{profile.totalGames}</p>
                <p className="text-sm text-gray-300">Games Played</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-400">{profile.bestStreak}</p>
                <p className="text-sm text-gray-300">Best Streak</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}