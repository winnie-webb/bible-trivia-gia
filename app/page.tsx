'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getProfile, initializeProfile } from '@/lib/localStorage'
import { Heart, Users, Trophy, User, Sparkles } from 'lucide-react'
import PremiumLoveLetter from '@/app/components/PremiumLoveLetter'
import ValentineExperience from '@/app/components/ValentineExperience'

export const dynamic = 'force-dynamic'

function HomeContent() {
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl opacity-10 animate-pulse">✝️</div>
        <div className="absolute top-32 right-20 text-4xl opacity-15 animate-bounce">📖</div>
        <div className="absolute bottom-20 left-1/4 text-5xl opacity-10 animate-pulse">✨</div>
        <div className="absolute bottom-40 right-1/3 text-4xl opacity-15 animate-bounce">🕊️</div>
      </div>
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center">
          <div className="relative inline-block">
            <Heart className="mx-auto h-16 w-16 text-primary fill-primary animate-pulse" />
            <Sparkles className="absolute -top-1 -right-1 h-6 w-6 text-highlight" />
          </div>
          <h1 className="mt-4 text-4xl font-bold text-primary">Gia Trivia ✝️</h1>
          <p className="mt-2 text-muted font-medium">Test your biblical knowledge together!</p>
          
          {hasProfile && (
            <div className="flex justify-center gap-3 mt-4">
              <button
                onClick={() => router.push('/profile')}
                className="flex items-center gap-2 bg-glass hover:bg-glass-hover border border-border px-4 py-2 rounded-full text-foreground transition font-semibold"
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              <button
                onClick={() => router.push('/leaderboard')}
                className="flex items-center gap-2 bg-glass hover:bg-glass-hover border border-border px-4 py-2 rounded-full text-foreground transition font-semibold"
              >
                <Trophy className="w-4 h-4" />
                Leaderboard
              </button>
              <button
                onClick={() => router.push('/daily-challenge')}
                className="flex items-center gap-2 bg-glass hover:bg-glass-hover border border-border px-4 py-2 rounded-full text-foreground transition font-semibold"
              >
                <Heart className="w-4 h-4" />
                Daily
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface backdrop-blur-sm rounded-2xl p-4 text-center border border-border shadow-lg">
            <Users className="mx-auto h-8 w-8 text-primary mb-2" />
            <p className="text-foreground font-bold">Play Together</p>
            <p className="text-muted text-sm">Up to 10 players</p>
          </div>
          <div className="bg-surface backdrop-blur-sm rounded-2xl p-4 text-center border border-border shadow-lg">
            <Heart className="mx-auto h-8 w-8 text-primary fill-primary mb-2" />
            <p className="text-foreground font-bold">Real-time Fun</p>
            <p className="text-muted text-sm">Live scoring</p>
          </div>
        </div>

        {/* Player Name */}
        <div className="bg-surface backdrop-blur-sm rounded-2xl p-6 space-y-4 border border-border shadow-xl">
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring font-medium"
            maxLength={20}
          />

          {/* Create Room */}
          <button
            onClick={createRoom}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-foreground font-bold py-3 px-4 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:scale-105"
          >
            {loading ? 'Creating...' : '✝️ Create New Room'}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-surface text-muted font-semibold">or</span>
            </div>
          </div>

          {/* Join Room */}
          <div id="join-section">
            <input
              type="text"
              placeholder="Enter room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring uppercase font-bold tracking-wider"
              maxLength={6}
            />
            {roomCode && (
              <p className="text-sm text-primary mt-1 font-semibold">
                Ready to join room {roomCode}!
              </p>
            )}
          </div>

          <button
            onClick={() => joinRoom()}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-foreground font-bold py-3 px-4 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:scale-105"
          >
            {loading ? 'Joining...' : 'Join Room'}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-muted text-sm font-medium">
            ✝️ Questions cover both Old and New Testament ✝️
          </p>
          <p className="text-muted/70 text-xs italic">
            "Love the Lord your God with all your heart" — Matthew 22:37
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <PremiumLoveLetter>
      <ValentineExperience>
        <Suspense fallback={
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-primary text-xl font-semibold">Loading...</div>
          </div>
        }>
          <HomeContent />
        </Suspense>
      </ValentineExperience>
    </PremiumLoveLetter>
  )
}