'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getProfile, initializeProfile } from '@/lib/localStorage'
import { Heart, Users, Trophy, User, Sparkles } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasProfile, setHasProfile] = useState(false)

  // Check for existing profile and room code in URL
  useEffect(() => {
    const profile = getProfile()
    if (profile) {
      setPlayerName(profile.username)
      setHasProfile(true)
    }

    const joinCode = searchParams.get('join')
    if (joinCode) {
      setRoomCode(joinCode.toUpperCase())
      setTimeout(() => {
        document.getElementById('join-section')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [searchParams])

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const createRoom = async () => {
    if (!playerName.trim()) {
      alert('Please enter your name')
      return
    }

    setLoading(true)
    try {
      // Initialize or get profile
      let profile = getProfile()
      if (!profile || profile.username !== playerName) {
        profile = initializeProfile(playerName)
      }

      const code = generateRoomCode()
      const playerId = profile.userId

      const { data: room, error } = await supabase
        .from('rooms')
        .insert({
          code,
          owner_id: playerId,
          difficulty: 'mixed',
          question_count: 10,
          time_limit: 30,
          status: 'waiting'
        })
        .select()
        .single()

      if (error) throw error

      await supabase.from('room_players').insert({
        room_id: room.id,
        player_id: playerId,
        player_name: playerName,
        ready: true
      })

      localStorage.setItem('playerId', playerId)
      localStorage.setItem('playerName', playerName)
      router.push(`/room/${code}`)
    } catch (error) {
      console.error('Error creating room:', error)
      alert('Failed to create room')
    } finally {
      setLoading(false)
    }
  }

  const joinRoom = async (code?: string) => {
    const codeToUse = code || roomCode
    
    if (!playerName.trim() || !codeToUse.trim()) {
      alert('Please enter your name and room code')
      return
    }

    setLoading(true)
    try {
      // Initialize or get profile
      let profile = getProfile()
      if (!profile || profile.username !== playerName) {
        profile = initializeProfile(playerName)
      }

      const { data: room, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', codeToUse.toUpperCase())
        .single()

      if (error || !room) {
        alert('Room not found')
        setLoading(false)
        return
      }

      if (room.status !== 'waiting') {
        alert('Game already started or finished')
        setLoading(false)
        return
      }

      const playerId = profile.userId

      await supabase.from('room_players').insert({
        room_id: room.id,
        player_id: playerId,
        player_name: playerName,
        ready: false
      })

      localStorage.setItem('playerId', playerId)
      localStorage.setItem('playerName', playerName)
      router.push(`/room/${codeToUse.toUpperCase()}`)
    } catch (error) {
      console.error('Error joining room:', error)
      alert('Failed to join room')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-rose-300 to-red-200 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating hearts decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl opacity-20 animate-pulse">💕</div>
        <div className="absolute top-32 right-20 text-4xl opacity-30 animate-bounce">💝</div>
        <div className="absolute bottom-20 left-1/4 text-5xl opacity-25 animate-pulse">💖</div>
        <div className="absolute bottom-40 right-1/3 text-4xl opacity-20 animate-bounce">💗</div>
      </div>
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center">
          <div className="relative inline-block">
            <Heart className="mx-auto h-16 w-16 text-rose-600 fill-rose-600 animate-pulse" />
            <Sparkles className="absolute -top-1 -right-1 h-6 w-6 text-pink-500" />
          </div>
          <h1 className="mt-4 text-4xl font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-red-600 bg-clip-text text-transparent">Bible Trivia for My Love 💕</h1>
          <p className="mt-2 text-rose-800 font-medium">A special Valentine's gift - Learn God's Word together! ✝️</p>
          
          {hasProfile && (
            <div className="flex justify-center gap-3 mt-4">
              <button
                onClick={() => router.push('/profile')}
                className="flex items-center gap-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400 px-4 py-2 rounded-full text-rose-700 transition font-semibold"
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              <button
                onClick={() => router.push('/leaderboard')}
                className="flex items-center gap-2 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-400 px-4 py-2 rounded-full text-pink-700 transition font-semibold"
              >
                <Trophy className="w-4 h-4" />
                Leaderboard
              </button>
              <button
                onClick={() => router.push('/daily-challenge')}
                className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400 px-4 py-2 rounded-full text-red-700 transition font-semibold"
              >
                <Heart className="w-4 h-4" />
                Daily
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center border-2 border-pink-300 shadow-lg">
            <Users className="mx-auto h-8 w-8 text-rose-600 mb-2" />
            <p className="text-rose-700 font-bold">Play Together</p>
            <p className="text-rose-600 text-sm">Up to 10 players 💑</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center border-2 border-pink-300 shadow-lg">
            <Heart className="mx-auto h-8 w-8 text-pink-600 fill-pink-600 mb-2" />
            <p className="text-pink-700 font-bold">Real-time Fun</p>
            <p className="text-pink-600 text-sm">Live scoring 💖</p>
          </div>
        </div>

        {/* Player Name */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 space-y-4 border-2 border-pink-300 shadow-xl">
          <input
            type="text"
            placeholder="💝 Enter your name, my love"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full px-4 py-3 bg-rose-50 border-2 border-pink-300 rounded-xl text-rose-900 placeholder-rose-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 font-medium"
            maxLength={20}
          />

          {/* Create Room */}
          <button
            onClick={createRoom}
            disabled={loading}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105"
          >
            {loading ? '💕 Creating...' : '💖 Create New Room'}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-pink-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white/90 text-rose-600 font-semibold">💕 or 💕</span>
            </div>
          </div>

          {/* Join Room */}
          <div id="join-section">
            <input
              type="text"
              placeholder="💌 Enter room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 bg-rose-50 border-2 border-pink-300 rounded-xl text-rose-900 placeholder-rose-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 uppercase font-bold tracking-wider font-medium"
              maxLength={6}
            />
            {roomCode && (
              <p className="text-sm text-rose-600 mt-1 font-semibold">
                💝 Ready to join room {roomCode}!
              </p>
            )}
          </div>

          <button
            onClick={() => joinRoom()}
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold py-3 px-4 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105"
          >
            {loading ? '💗 Joining...' : '💗 Join Room'}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-rose-700 text-sm font-medium">
            ✝️ Questions cover both Old and New Testament ✝️
          </p>
          <p className="text-pink-600 text-xs italic">
            "Love the Lord your God with all your heart" - Matthew 22:37 💕
          </p>
        </div>
      </div>
    </div>
  )
}