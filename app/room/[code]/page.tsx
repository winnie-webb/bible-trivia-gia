'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, Room, RoomPlayer } from '@/lib/supabase'
import { Users, Settings, Play, Copy, Check } from 'lucide-react'
import GameScreen from '@/app/components/GameScreen'

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<RoomPlayer[]>([])
  const [playerId, setPlayerId] = useState('')
  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  const isOwner = room?.owner_id === playerId

  useEffect(() => {
    const id = localStorage.getItem('playerId')
    if (!id) {
      router.push('/')
      return
    }
    setPlayerId(id)
    loadRoom()
  }, [])

  useEffect(() => {
    if (!room) return

    // Subscribe to room changes
    const roomChannel = supabase
      .channel(`room:${room.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` }, (payload) => {
        setRoom(payload.new as Room)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${room.id}` }, () => {
        loadPlayers()
      })
      .subscribe()

    loadPlayers()

    return () => {
      supabase.removeChannel(roomChannel)
    }
  }, [room?.id])

  const loadRoom = async () => {
    console.log('Loading room with code:', code)
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', code)
      .single()

    console.log('Room data:', data)
    console.log('Room error:', error)

    if (error || !data) {
      console.error('Failed to load room:', error)
      alert(`Room not found: ${error?.message || 'Unknown error'}`)
      router.push('/')
      return
    }

    setRoom(data)
    setInitialLoading(false)
  }

  const loadPlayers = async () => {
    if (!room) return

    const { data } = await supabase
      .from('room_players')
      .select('*')
      .eq('room_id', room.id)
      .order('joined_at', { ascending: true })

    if (data) setPlayers(data)
  }

  const updateSettings = async (field: string, value: any) => {
    if (!isOwner || !room) return

    await supabase
      .from('rooms')
      .update({ [field]: value })
      .eq('id', room.id)
  }

  const toggleReady = async () => {
    if (!room) return

    const player = players.find(p => p.player_id === playerId)
    if (!player) return

    await supabase
      .from('room_players')
      .update({ ready: !player.ready })
      .eq('id', player.id)
  }

  const startGame = async () => {
    if (!isOwner || !room || players.length < 2) return

    setLoading(true)
    try {
      // Generate questions
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          difficulty: room.difficulty,
          count: room.question_count
        })
      })

      const { questions } = await response.json()

      // Save questions to game state
      await supabase.from('game_state').insert({
        room_id: room.id,
        questions,
        answers: {}
      })

      // Update room status
      await supabase
        .from('rooms')
        .update({ status: 'active', current_question: 0 })
        .eq('id', room.id)
    } catch (error) {
      console.error('Error starting game:', error)
      alert('Failed to start game')
    } finally {
      setLoading(false)
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyLink = () => {
    const link = `${window.location.origin}?join=${code}`
    navigator.clipboard.writeText(link)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  // Loading state
  if (initialLoading) {
    console.log('Showing initial loading state')
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading room...</div>
      </div>
    )
  }

  if (!room) {
    console.log('No room found, returning null')
    return null
  }

  console.log('Room status:', room.status)
  if (room.status === 'active' || room.status === 'finished') {
    console.log('Showing GameScreen')
    return <GameScreen room={room} playerId={playerId} />
  }

  console.log('Showing lobby')
  const allReady = players.every(p => p.ready || p.player_id === room.owner_id)
  const canStart = isOwner && players.length >= 2 && allReady

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">Game Lobby</h1>
            <div className="flex gap-2">
              <button
                onClick={copyCode}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-white transition"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span className="font-mono font-bold">{code}</span>
              </button>
              <button
                onClick={copyLink}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg text-white transition"
              >
                {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span className="hidden sm:inline">Copy Link</span>
              </button>
            </div>
          </div>
          <p className="text-gray-300">Share the code or link with friends to join!</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Settings */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Game Settings
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Category</label>
                <select
                  value={room.category || 'mixed'}
                  onChange={(e) => updateSettings('category', e.target.value)}
                  disabled={!isOwner}
                  className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50"
                >
                  <option value="mixed">📖 Mixed (All Categories)</option>
                  <option value="old_testament">📜 Old Testament</option>
                  <option value="new_testament">✝️ New Testament</option>
                  <option value="prophets">🔮 Prophets</option>
                  <option value="parables">📚 Parables</option>
                  <option value="miracles">✨ Miracles</option>
                  <option value="kings">👑 Kings & Queens</option>
                  <option value="women">👸 Women of the Bible</option>
                  <option value="geography">🗺️ Geography</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Difficulty</label>
                <select
                  value={room.difficulty}
                  onChange={(e) => updateSettings('difficulty', e.target.value)}
                  disabled={!isOwner}
                  className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Number of Questions</label>
                <select
                  value={room.question_count}
                  onChange={(e) => updateSettings('question_count', parseInt(e.target.value))}
                  disabled={!isOwner}
                  className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50"
                >
                  <option value="5">5 Questions</option>
                  <option value="10">10 Questions</option>
                  <option value="15">15 Questions</option>
                  <option value="20">20 Questions</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Time per Question</label>
                <select
                  value={room.time_limit}
                  onChange={(e) => updateSettings('time_limit', parseInt(e.target.value))}
                  disabled={!isOwner}
                  className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50"
                >
                  <option value="15">15 seconds</option>
                  <option value="30">30 seconds</option>
                  <option value="45">45 seconds</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-gray-300">
                  <input
                    type="checkbox"
                    checked={room.power_ups_enabled || false}
                    onChange={(e) => updateSettings('power_ups_enabled', e.target.checked)}
                    disabled={!isOwner}
                    className="w-5 h-5 rounded"
                  />
                  Enable Power-ups
                </label>
                <p className="text-xs text-gray-400 mt-1 ml-7">
                  50/50, Extra Time, Double Points
                </p>
              </div>
            </div>
          </div>

          {/* Players */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Players ({players.length})
            </h2>

            <div className="space-y-3 mb-6">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-white/10 rounded-lg p-3"
                >
                  <span className="text-white font-medium">
                    {player.player_name}
                    {player.player_id === room.owner_id && (
                      <span className="ml-2 text-xs bg-yellow-500 text-gray-900 px-2 py-1 rounded">
                        HOST
                      </span>
                    )}
                  </span>
                  {player.ready || player.player_id === room.owner_id ? (
                    <span className="text-green-400 text-sm font-semibold">✓ Ready</span>
                  ) : (
                    <span className="text-gray-400 text-sm">Waiting...</span>
                  )}
                </div>
              ))}
            </div>

            {/* Ready/Start Button */}
            {isOwner ? (
              <button
                onClick={startGame}
                disabled={!canStart || loading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:cursor-not-allowed"
              >
                <Play className="w-5 h-5" />
                {loading ? 'Starting...' : canStart ? 'Start Game' : 'Waiting for players...'}
              </button>
            ) : (
              <button
                onClick={toggleReady}
                className={`w-full font-bold py-3 px-4 rounded-lg transition ${
                  players.find(p => p.player_id === playerId)?.ready
                    ? 'bg-gray-500 hover:bg-gray-600'
                    : 'bg-green-500 hover:bg-green-600'
                } text-white`}
              >
                {players.find(p => p.player_id === playerId)?.ready ? 'Not Ready' : 'Ready'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}