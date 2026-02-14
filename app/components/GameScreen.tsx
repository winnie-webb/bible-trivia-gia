'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase, Room, RoomPlayer, Question } from '@/lib/supabase'
import { recordGameComplete, updateStreak, checkAndAwardAchievements } from '@/lib/localStorage'
import { Scissors, Timer, Zap, Heart } from 'lucide-react'
import AchievementToast from './AchievementToast'

type Props = {
  room: Room
  playerId: string
}

type PowerUp = {
  key: string
  icon: any
  name: string
  description: string
}

const POWER_UPS: PowerUp[] = [
  { key: 'fifty_fifty', icon: Scissors, name: '50/50', description: 'Remove 2 wrong answers' },
  { key: 'extra_time', icon: Timer, name: '+10s', description: 'Add 10 seconds' },
  { key: 'double_points', icon: Zap, name: '2x', description: 'Double points' },
]

export default function GameScreen({ room: initialRoom, playerId }: Props) {
  const roomId = initialRoom.id

  const [localRoom, setLocalRoom] = useState<Room>(initialRoom)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [timeLeft, setTimeLeft] = useState(initialRoom.time_limit)
  const [players, setPlayers] = useState<RoomPlayer[]>([])
  const [nextQuestionIn, setNextQuestionIn] = useState<number | null>(null)
  const [usedPowerUps, setUsedPowerUps] = useState<Set<string>>(new Set())
  const [hiddenOptions, setHiddenOptions] = useState<Set<number>>(new Set())
  const [doublePointsActive, setDoublePointsActive] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [incorrectCount, setIncorrectCount] = useState(0)
  const [fastestAnswer, setFastestAnswer] = useState<number | null>(null)
  const [newAchievements, setNewAchievements] = useState<string[]>([])

  // Only 3 refs — the bare minimum needed inside interval callbacks
  const hasAnsweredRef = useRef(false)
  const isAdvancingRef = useRef(false)
  const questionNumRef = useRef(initialRoom.current_question)

  // ── Load initial question on mount ──
  useEffect(() => {
    loadQuestion(initialRoom.current_question)
    loadPlayers()
  }, [])

  // ── Poll room state every 1 second ──
  useEffect(() => {
    const poll = setInterval(async () => {
      // Fetch latest room
      const { data: room, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single()

      if (error || !room) {
        console.error('Poll: room fetch error', error)
        return
      }

      // Update room state (for rendering)
      setLocalRoom(room)

      // Game finished?
      if (room.status === 'finished') {
        loadPlayers()
        return
      }

      // Question changed? → load new question + reset
      if (room.current_question !== questionNumRef.current) {
        console.log('Poll: question changed', questionNumRef.current, '→', room.current_question)
        questionNumRef.current = room.current_question
        hasAnsweredRef.current = false
        isAdvancingRef.current = false
        setHasAnswered(false)
        setSelectedAnswer(null)
        setNextQuestionIn(null)
        setUsedPowerUps(new Set())
        setHiddenOptions(new Set())
        setDoublePointsActive(false)
        await loadQuestion(room.current_question)
      }

      // Refresh scoreboard
      loadPlayers()

      // Owner: check if all players answered → advance (skip if already in transition)
      if (hasAnsweredRef.current && !isAdvancingRef.current && !room.showing_results && room.owner_id === playerId) {
        const allDone = await areAllAnswered(room.current_question)
        if (allDone) {
          doAdvance(room)
        }
      }
    }, 1000)

    return () => clearInterval(poll)
  }, [])

  // ── Between-question countdown (all clients, driven by DB timestamp) ──
  useEffect(() => {
    if (!localRoom.showing_results || !localRoom.question_start_time) {
      setNextQuestionIn(null)
      return
    }

    const target = new Date(localRoom.question_start_time).getTime()

    const calcCountdown = () => {
      const left = Math.max(0, Math.ceil((target - Date.now()) / 1000))
      setNextQuestionIn(left > 0 ? left : null)
    }

    calcCountdown()
    const tick = setInterval(calcCountdown, 1000)
    return () => clearInterval(tick)
  }, [localRoom.showing_results, localRoom.question_start_time])

  // ── Timer: 1-second countdown ──
  useEffect(() => {
    if (!currentQuestion || !localRoom.question_end_time) return

    const endTime = new Date(localRoom.question_end_time).getTime()

    // Run once immediately
    const calcLeft = () => Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
    setTimeLeft(calcLeft())

    const tick = setInterval(() => {
      const left = calcLeft()
      setTimeLeft(left)

      if (left === 0 && !hasAnsweredRef.current) {
        console.log('Timer expired → auto-submit')
        hasAnsweredRef.current = true
        setHasAnswered(true)
        doAutoSubmit()
      }
    }, 1000)

    return () => clearInterval(tick)
  }, [currentQuestion, localRoom.question_end_time])

  // ── Data helpers ──

  const loadQuestion = async (questionNumber: number) => {
    const { data, error } = await supabase
      .from('game_state')
      .select('*')
      .eq('room_id', roomId)
      .single()

    if (error) {
      console.error('loadQuestion error:', error)
      return
    }
    if (data) {
      setCurrentQuestion(data.questions[questionNumber])
    }

    // Check if this player already answered (page refresh mid-game)
    const { data: existing } = await supabase
      .from('player_answers')
      .select('answer_index')
      .eq('room_id', roomId)
      .eq('question_number', questionNumber)
      .eq('player_id', playerId)
      .maybeSingle()

    if (existing) {
      setHasAnswered(true)
      hasAnsweredRef.current = true
      setSelectedAnswer(existing.answer_index)
    }
  }

  const loadPlayers = async () => {
    const { data } = await supabase
      .from('room_players')
      .select('*')
      .eq('room_id', roomId)
      .order('score', { ascending: false })
    if (data) setPlayers(data)
  }

  const areAllAnswered = async (questionNumber: number): Promise<boolean> => {
    const { data: pl } = await supabase
      .from('room_players')
      .select('id')
      .eq('room_id', roomId)

    const { data: ans } = await supabase
      .from('player_answers')
      .select('id')
      .eq('room_id', roomId)
      .eq('question_number', questionNumber)

    const allDone = !!(pl && ans && ans.length >= pl.length)
    if (allDone) console.log('All players answered:', ans!.length, '/', pl!.length)
    return allDone
  }

  // ── Auto-submit (timer expired) ──
  const doAutoSubmit = async () => {
    const qn = questionNumRef.current
    console.log('Auto-submitting for question', qn)

    const { error } = await supabase.from('player_answers').insert({
      room_id: roomId,
      question_number: qn,
      player_id: playerId,
      answer_index: -1,
      time_taken: initialRoom.time_limit,
      is_correct: false,
      points_earned: 0
    })

    if (error) {
      console.error('Auto-submit INSERT error:', error)
    } else {
      console.log('Auto-submit succeeded for question', qn)
    }
  }

  // ── Submit answer (player clicked) ──
  const submitAnswer = async (answerIndex: number) => {
    if (hasAnsweredRef.current || !currentQuestion) return
    hasAnsweredRef.current = true
    setHasAnswered(true)
    setSelectedAnswer(answerIndex)

    const isCorrect = answerIndex === currentQuestion.correct_index
    const timeBonus = Math.floor((timeLeft / localRoom.time_limit) * 100)
    let points = isCorrect ? 1000 + timeBonus : 0
    if (doublePointsActive && isCorrect) points *= 2

    if (isCorrect) {
      setCorrectCount(prev => prev + 1)
      updateStreak(true)
    } else {
      setIncorrectCount(prev => prev + 1)
      updateStreak(false)
    }

    const answerTime = localRoom.time_limit - timeLeft
    if (isCorrect && (fastestAnswer === null || answerTime < fastestAnswer)) {
      setFastestAnswer(answerTime)
    }

    const achievements = checkAndAwardAchievements()
    if (achievements.length > 0) {
      setNewAchievements(prev => [...prev, ...achievements])
    }

    const { error } = await supabase.from('player_answers').insert({
      room_id: roomId,
      question_number: questionNumRef.current,
      player_id: playerId,
      answer_index: answerIndex,
      time_taken: answerTime,
      is_correct: isCorrect,
      points_earned: points
    })

    if (error) {
      console.error('submitAnswer INSERT error:', error)
      return
    }

    console.log('Answer submitted for question', questionNumRef.current)

    // Owner: immediately check if all done (don't wait for next poll)
    if (localRoom.owner_id === playerId && !isAdvancingRef.current) {
      const allDone = await areAllAnswered(questionNumRef.current)
      if (allDone) doAdvance(localRoom)
    }
  }

  // ── Advance to next question (owner only) ──
  const doAdvance = async (room: Room) => {
    if (isAdvancingRef.current) return
    isAdvancingRef.current = true
    console.log('Advancing from question', room.current_question)

    // Score update (best-effort, don't block on failure)
    try {
      const { data: answers } = await supabase
        .from('player_answers')
        .select('*')
        .eq('room_id', roomId)
        .eq('question_number', room.current_question)

      if (answers) {
        for (const a of answers) {
          if (a.is_correct && a.points_earned > 0) {
            // Try RPC first, fall back to direct update
            const { error } = await supabase.rpc('increment_player_score', {
              p_room_id: roomId,
              p_player_id: a.player_id,
              p_points: a.points_earned,
            })
            if (error) {
              console.warn('RPC failed, using direct update:', error.message)
              const { data: pl } = await supabase
                .from('room_players')
                .select('score')
                .eq('room_id', roomId)
                .eq('player_id', a.player_id)
                .single()
              if (pl) {
                await supabase
                  .from('room_players')
                  .update({ score: pl.score + a.points_earned })
                  .eq('room_id', roomId)
                  .eq('player_id', a.player_id)
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('Score processing error (continuing anyway):', e)
    }

    await loadPlayers()

    // Write transition state to DB so ALL clients see the countdown
    const nextQuestionAt = new Date(Date.now() + 5000)
    await supabase.from('rooms').update({
      showing_results: true,
      question_start_time: nextQuestionAt.toISOString(),
    }).eq('id', roomId)

    // Wait 5 seconds
    await new Promise(r => setTimeout(r, 5000))

    // Move to next question or finish
    const next = room.current_question + 1
    if (next >= room.question_count) {
      console.log('Game finished!')
      const { error } = await supabase
        .from('rooms')
        .update({ status: 'finished', showing_results: false })
        .eq('id', roomId)
      if (error) console.error('Finish game error:', error)
    } else {
      const start = new Date()
      const end = new Date(start.getTime() + room.time_limit * 1000)
      console.log('DB update: advancing to question', next)
      const { error } = await supabase
        .from('rooms')
        .update({
          current_question: next,
          showing_results: false,
          question_start_time: start.toISOString(),
          question_end_time: end.toISOString(),
        })
        .eq('id', roomId)
      if (error) console.error('Advance question error:', error)
    }

    // Note: isAdvancingRef is reset by the poll when it detects the question change
  }

  // ── Power-ups ──
  const usePowerUp = (powerUpKey: string) => {
    if (usedPowerUps.has(powerUpKey) || hasAnswered) return
    setUsedPowerUps(prev => new Set(prev).add(powerUpKey))

    switch (powerUpKey) {
      case 'fifty_fifty':
        if (!currentQuestion) return
        const correctIndex = currentQuestion.correct_index
        const wrongIndices = [0, 1, 2, 3].filter(i => i !== correctIndex)
        const toHide = wrongIndices.sort(() => Math.random() - 0.5).slice(0, 2)
        setHiddenOptions(new Set(toHide))
        break
      case 'extra_time':
        setTimeLeft(prev => prev + 10)
        break
      case 'double_points':
        setDoublePointsActive(true)
        break
    }
  }

  // ════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════

  if (localRoom.status === 'finished') {
    const currentPlayer = players.find(p => p.player_id === playerId)
    const isWinner = currentPlayer && currentPlayer.score === Math.max(...players.map(p => p.score))
    recordGameComplete(!!isWinner, correctCount, correctCount + incorrectCount, fastestAnswer || undefined)

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 text-6xl opacity-10 animate-pulse">✝️</div>
          <div className="absolute top-32 right-20 text-4xl opacity-15 animate-bounce">📖</div>
          <div className="absolute bottom-20 left-1/4 text-5xl opacity-10 animate-pulse">✨</div>
        </div>

        <div className="bg-surface backdrop-blur-sm rounded-2xl p-8 max-w-2xl w-full border border-border shadow-2xl relative z-10">
          <Heart className="w-16 h-16 text-primary fill-primary mx-auto mb-4 animate-pulse" />
          <h1 className="text-4xl font-bold text-primary text-center mb-8">Game Over!</h1>

          <div className="space-y-4 mb-8">
            {players.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-xl ${
                  index === 0 ? 'bg-primary/20 border border-primary' : 'bg-glass'
                } ${player.player_id === playerId ? 'ring-2 ring-ring' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-primary">#{index + 1}</span>
                  <span className="text-lg text-foreground font-medium">
                    {player.player_name}
                    {player.player_id === playerId && ' (You)'}
                  </span>
                </div>
                <span className="text-2xl font-bold text-highlight">{player.score}</span>
              </div>
            ))}
          </div>

          <div className="bg-surface rounded-xl p-6 mb-6 border border-border">
            <h3 className="text-xl font-bold text-foreground mb-4">Your Stats</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-success">{correctCount}</p>
                <p className="text-sm text-muted">Correct</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-error">{incorrectCount}</p>
                <p className="text-sm text-muted">Incorrect</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-highlight">
                  {((correctCount / (correctCount + incorrectCount)) * 100 || 0).toFixed(0)}%
                </p>
                <p className="text-sm text-muted">Accuracy</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-primary hover:bg-primary-hover text-foreground font-bold py-3 rounded-xl transition shadow-lg hover:scale-105"
          >
            Back to Home
          </button>
        </div>

        <div className="fixed top-4 right-4 space-y-2">
          {newAchievements.map((key, index) => (
            <AchievementToast
              key={key}
              achievementKey={key}
              onClose={() => setNewAchievements(prev => prev.filter(k => k !== key))}
              delay={index * 500}
            />
          ))}
        </div>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-surface backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center border border-border shadow-xl">
          <Heart className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-foreground mb-4">Loading...</h2>
          <p className="text-muted">Preparing your questions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 text-5xl opacity-10 animate-pulse">✝️</div>
        <div className="absolute top-40 right-32 text-3xl opacity-10 animate-bounce">📖</div>
        <div className="absolute bottom-32 left-1/3 text-4xl opacity-10 animate-pulse">✨</div>
        <div className="absolute bottom-20 right-1/4 text-3xl opacity-10">🕊️</div>
      </div>

      <div className="max-w-4xl mx-auto py-8 relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="bg-surface backdrop-blur-sm rounded-xl px-6 py-3 border border-border shadow-lg">
            <span className="text-foreground font-bold">
              Question {localRoom.current_question + 1} / {localRoom.question_count}
            </span>
          </div>

          <div className="bg-surface backdrop-blur-sm rounded-xl px-6 py-3 flex items-center gap-2 border border-border shadow-lg">
            <Heart className={`w-5 h-5 ${timeLeft <= 5 ? 'text-error fill-error animate-pulse' : 'text-primary fill-primary'}`} />
            <span className={`text-2xl font-bold ${timeLeft <= 5 ? 'text-error' : 'text-foreground'}`}>
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Status message after answering */}
        {hasAnswered && (
          <div className="text-center mb-4">
            <span className="bg-surface backdrop-blur-sm rounded-xl px-6 py-2 text-foreground font-bold border border-border shadow-lg inline-block">
              {nextQuestionIn
                ? localRoom.current_question + 1 >= localRoom.question_count
                  ? `Game ending in ${nextQuestionIn}s...`
                  : `Next question in ${nextQuestionIn}s...`
                : 'Waiting for other players...'}
            </span>
          </div>
        )}

        {/* Power-ups */}
        {!hasAnswered && (
          <div className="flex justify-center gap-3 mb-6">
            {POWER_UPS.map((powerUp) => {
              const Icon = powerUp.icon
              const used = usedPowerUps.has(powerUp.key)
              return (
                <button
                  key={powerUp.key}
                  onClick={() => usePowerUp(powerUp.key)}
                  disabled={used}
                  className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl transition border shadow-lg ${
                    used
                      ? 'bg-muted/30 border-border cursor-not-allowed opacity-50'
                      : 'bg-primary border-ring hover:bg-primary-hover hover:scale-105'
                  }`}
                  title={powerUp.description}
                >
                  <Icon className="w-6 h-6 text-white" />
                  <span className="text-xs text-white font-bold">{powerUp.name}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Question */}
        <div className="bg-surface backdrop-blur-sm rounded-2xl p-8 mb-6 border border-border shadow-xl">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
            ✝️ {currentQuestion.question}
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {currentQuestion.options.map((option, index) => {
              const isHidden = hiddenOptions.has(index)
              if (isHidden) return <div key={index} className="h-20"></div>

              return (
                <button
                  key={index}
                  onClick={() => {
                    if (!hasAnswered) submitAnswer(index)
                  }}
                  disabled={hasAnswered}
                  className={`p-6 rounded-xl text-left text-lg font-medium transition border shadow-lg ${
                    hasAnswered
                      ? selectedAnswer === index
                        ? index === currentQuestion.correct_index
                          ? 'bg-success text-background border-success'
                          : 'bg-error text-background border-error'
                        : index === currentQuestion.correct_index
                        ? 'bg-success text-background border-success'
                        : 'bg-surface text-muted border-border'
                      : 'bg-glass hover:bg-glass-hover text-foreground border-border hover:border-ring hover:scale-105'
                  } disabled:cursor-not-allowed`}
                >
                  {option}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Achievement Toasts */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {newAchievements.map((key, index) => (
          <AchievementToast
            key={key}
            achievementKey={key}
            onClose={() => setNewAchievements(prev => prev.filter(k => k !== key))}
            delay={index * 500}
          />
        ))}
      </div>
    </div>
  )
}
