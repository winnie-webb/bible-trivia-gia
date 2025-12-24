'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getProfile, initializeProfile } from '@/lib/localStorage'
import { BookOpen, Users, Trophy, User } from 'lucide-react'

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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <BookOpen className="mx-auto h-16 w-16 text-yellow-400" />
          <h1 className="mt-4 text-4xl font-bold text-white">Bible Trivia</h1>
          <p className="mt-2 text-gray-300">Test your biblical knowledge with friends!</p>
          
          {hasProfile && (
            <div className="flex justify-center gap-3 mt-4">
              <button
                onClick={() => router.push('/profile')}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-white transition"
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              <button
                onClick={() => router.push('/leaderboard')}
                className="flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400 px-4 py-2 rounded-lg text-white transition"
              >
                <Trophy className="w-4 h-4" />
                Leaderboard
              </button>
              <button
                onClick={() => router.push('/daily-challenge')}
                className="flex items-center gap-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-400 px-4 py-2 rounded-lg text-white transition"
              >
                <Trophy className="w-4 h-4" />
                Daily
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <Users className="mx-auto h-8 w-8 text-blue-400 mb-2" />
            <p className="text-white font-semibold">Multiplayer</p>
            <p className="text-gray-300 text-sm">Up to 10 players</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <Trophy className="mx-auto h-8 w-8 text-yellow-400 mb-2" />
            <p className="text-white font-semibold">Real-time</p>
            <p className="text-gray-300 text-sm">Live scoring</p>
          </div>
        </div>

        {/* Player Name */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 space-y-4">
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            maxLength={20}
          />

          {/* Create Room */}
          <button
            onClick={createRoom}
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create New Room'}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-gray-300">or</span>
            </div>
          </div>

          {/* Join Room */}
          <div id="join-section">
            <input
              type="text"
              placeholder="Enter room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 uppercase"
              maxLength={6}
            />
            {roomCode && (
              <p className="text-sm text-yellow-400 mt-1">
                Ready to join room {roomCode}!
              </p>
            )}
          </div>

          <button
            onClick={() => joinRoom()}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Joining...' : 'Join Room'}
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-sm">
          Questions cover both Old and New Testament
        </p>
      </div>
    </div>
  )
}