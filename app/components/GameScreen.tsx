'use client'

import { useEffect, useState } from 'react'
import { supabase, Room, RoomPlayer, Question } from '@/lib/supabase'
import { recordGameComplete, updateStreak, checkAndAwardAchievements } from '@/lib/localStorage'
import { Trophy, Clock, Scissors, Timer, Zap, SkipForward } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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

export default function GameScreen({ room, playerId }: Props) {
  const [gameState, setGameState] = useState<any>(null)
  const [players, setPlayers] = useState<RoomPlayer[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [timeLeft, setTimeLeft] = useState(room.time_limit)
  const [showResults, setShowResults] = useState(false)
  const [questionResults, setQuestionResults] = useState<any>(null)
  const [usedPowerUps, setUsedPowerUps] = useState<Set<string>>(new Set())
  const [hiddenOptions, setHiddenOptions] = useState<Set<number>>(new Set())
  const [doublePointsActive, setDoublePointsActive] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [incorrectCount, setIncorrectCount] = useState(0)
  const [fastestAnswer, setFastestAnswer] = useState<number | null>(null)
  const [newAchievements, setNewAchievements] = useState<string[]>([])

  useEffect(() => {
    loadGameState()
    loadPlayers()

    const channel = supabase
      .channel(`game:${room.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` }, (payload) => {
        const updatedRoom = payload.new as Room
        if (updatedRoom.current_question !== room.current_question) {
          setHasAnswered(false)
          setSelectedAnswer(null)
          setShowResults(false)
          setTimeLeft(room.time_limit)
          setUsedPowerUps(new Set())
          setHiddenOptions(new Set())
          setDoublePointsActive(false)
          loadGameState()
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${room.id}` }, () => {
        loadPlayers()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_answers', filter: `room_id=eq.${room.id}` }, () => {
        checkAllAnswered()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [room.current_question])

  useEffect(() => {
    if (hasAnswered || showResults || !currentQuestion) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          if (!hasAnswered) {
            submitAnswer(-1, 0)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [hasAnswered, showResults, currentQuestion])

  const loadGameState = async () => {
    const { data } = await supabase
      .from('game_state')
      .select('*')
      .eq('room_id', room.id)
      .single()

    if (data) {
      setGameState(data)
      setCurrentQuestion(data.questions[room.current_question])
    }
  }

  const loadPlayers = async () => {
    const { data } = await supabase
      .from('room_players')
      .select('*')
      .eq('room_id', room.id)
      .order('score', { ascending: false })

    if (data) setPlayers(data)
  }

  const checkAllAnswered = async () => {
    const { data } = await supabase
      .from('player_answers')
      .select('*')
      .eq('room_id', room.id)
      .eq('question_number', room.current_question)

    if (data && data.length === players.length) {
      showQuestionResults(data)
    }
  }

  const showQuestionResults = async (answers: any[]) => {
    setQuestionResults(answers)
    setShowResults(true)

    // Update player scores
    for (const answer of answers) {
      if (answer.is_correct) {
        await supabase.rpc('increment_score', {
          p_room_id: room.id,
          p_player_id: answer.player_id,
          p_points: answer.points_earned
        })
      }
    }

    // Move to next question after 5 seconds
    setTimeout(async () => {
      if (room.owner_id === playerId) {
        const nextQuestion = room.current_question + 1
        if (nextQuestion >= room.question_count) {
          await supabase
            .from('rooms')
            .update({ status: 'finished' })
            .eq('id', room.id)
        } else {
          await supabase
            .from('rooms')
            .update({ current_question: nextQuestion })
            .eq('id', room.id)
        }
      }
    }, 5000)
  }

  const submitAnswer = async (answerIndex: number, timeTaken: number) => {
    if (hasAnswered || !currentQuestion) return

    setHasAnswered(true)
    setSelectedAnswer(answerIndex)

    const isCorrect = answerIndex === currentQuestion.correct_index
    const timeBonus = Math.floor((timeLeft / room.time_limit) * 100)
    let points = isCorrect ? 1000 + timeBonus : 0
    
    if (doublePointsActive && isCorrect) {
      points *= 2
    }

    // Update local stats
    if (isCorrect) {
      setCorrectCount(prev => prev + 1)
      updateStreak(true)
    } else {
      setIncorrectCount(prev => prev + 1)
      updateStreak(false)
    }

    const answerTime = room.time_limit - timeLeft
    if (isCorrect && (fastestAnswer === null || answerTime < fastestAnswer)) {
      setFastestAnswer(answerTime)
    }

    // Check for new achievements
    const achievements = checkAndAwardAchievements()
    if (achievements.length > 0) {
      setNewAchievements(prev => [...prev, ...achievements])
    }

    await supabase.from('player_answers').insert({
      room_id: room.id,
      question_number: room.current_question,
      player_id: playerId,
      answer_index: answerIndex,
      time_taken: timeTaken,
      is_correct: isCorrect,
      points_earned: points
    })

    checkAllAnswered()
  }

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

  if (room.status === 'finished') {
    // Record game completion
    const currentPlayer = players.find(p => p.player_id === playerId)
    const isWinner = currentPlayer && currentPlayer.score === Math.max(...players.map(p => p.score))
    recordGameComplete(!!isWinner, correctCount, correctCount + incorrectCount, fastestAnswer || undefined)

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/10 backdrop-blur-sm rounded-lg p-8 max-w-2xl w-full"
        >
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white text-center mb-8">Game Over!</h1>

          <div className="space-y-4 mb-8">
            {players.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  index === 0 ? 'bg-yellow-500/30 border-2 border-yellow-400' : 'bg-white/10'
                } ${player.player_id === playerId ? 'ring-2 ring-blue-400' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-white">#{index + 1}</span>
                  <span className="text-lg text-white font-medium">
                    {player.player_name}
                    {player.player_id === playerId && ' (You)'}
                  </span>
                </div>
                <span className="text-2xl font-bold text-yellow-400">{player.score}</span>
              </motion.div>
            ))}
          </div>

          {/* Personal Stats */}
          <div className="bg-white/5 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-4">Your Stats</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-400">{correctCount}</p>
                <p className="text-sm text-gray-400">Correct</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-400">{incorrectCount}</p>
                <p className="text-sm text-gray-400">Incorrect</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">
                  {((correctCount / (correctCount + incorrectCount)) * 100 || 0).toFixed(0)}%
                </p>
                <p className="text-sm text-gray-400">Accuracy</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition"
          >
            Back to Home
          </button>
        </motion.div>

        {/* Achievement Toasts */}
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

  if (!currentQuestion) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3">
            <span className="text-white font-semibold">
              Question {room.current_question + 1} / {room.question_count}
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            <span className={`text-2xl font-bold ${timeLeft <= 5 ? 'text-red-400' : 'text-white'}`}>
              {timeLeft}s
            </span>
          </div>
        </div>

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
                  className={`flex flex-col items-center gap-1 px-4 py-3 rounded-lg transition ${
                    used
                      ? 'bg-gray-500 cursor-not-allowed opacity-50'
                      : 'bg-purple-500 hover:bg-purple-600'
                  }`}
                  title={powerUp.description}
                >
                  <Icon className="w-6 h-6 text-white" />
                  <span className="text-xs text-white font-semibold">{powerUp.name}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Question */}
        <AnimatePresence mode="wait">
          {!showResults ? (
            <motion.div
              key="question"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-8 mb-6"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">
                {currentQuestion.question}
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, index) => {
                  const isHidden = hiddenOptions.has(index)
                  if (isHidden) return <div key={index} className="h-20"></div>

                  return (
                    <button
                      key={index}
                      onClick={() => {
                        if (!hasAnswered) {
                          submitAnswer(index, room.time_limit - timeLeft)
                        }
                      }}
                      disabled={hasAnswered}
                      className={`p-6 rounded-lg text-left text-lg font-medium transition ${
                        hasAnswered
                          ? selectedAnswer === index
                            ? index === currentQuestion.correct_index
                              ? 'bg-green-500 text-white'
                              : 'bg-red-500 text-white'
                            : index === currentQuestion.correct_index
                            ? 'bg-green-500 text-white'
                            : 'bg-white/20 text-gray-300'
                          : 'bg-white/20 hover:bg-white/30 text-white'
                      } disabled:cursor-not-allowed`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-8 mb-6"
            >
              <h2 className="text-2xl font-bold text-white mb-4 text-center">
                Correct Answer: {currentQuestion.options[currentQuestion.correct_index]}
              </h2>
              <p className="text-gray-300 text-center mb-4">Moving to next question...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Leaderboard */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Leaderboard
          </h3>
          <div className="space-y-2">
            {players.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  player.player_id === playerId ? 'bg-blue-500/30' : 'bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold">#{index + 1}</span>
                  <span className="text-white">{player.player_name}</span>
                </div>
                <span className="text-yellow-400 font-bold">{player.score}</span>
              </div>
            ))}
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

export default function GameScreen({ room, playerId }: Props) {
  const [gameState, setGameState] = useState<any>(null)
  const [players, setPlayers] = useState<RoomPlayer[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [timeLeft, setTimeLeft] = useState(room.time_limit)
  const [showResults, setShowResults] = useState(false)
  const [questionResults, setQuestionResults] = useState<any>(null)

  useEffect(() => {
    loadGameState()
    loadPlayers()

    const channel = supabase
      .channel(`game:${room.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` }, (payload) => {
        const updatedRoom = payload.new as Room
        if (updatedRoom.current_question !== room.current_question) {
          setHasAnswered(false)
          setSelectedAnswer(null)
          setShowResults(false)
          setTimeLeft(room.time_limit)
          loadGameState()
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${room.id}` }, () => {
        loadPlayers()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_answers', filter: `room_id=eq.${room.id}` }, () => {
        checkAllAnswered()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [room.current_question])

  useEffect(() => {
    if (hasAnswered || showResults || !currentQuestion) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          if (!hasAnswered) {
            submitAnswer(-1, 0) // Auto-submit wrong answer
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [hasAnswered, showResults, currentQuestion])

  const loadGameState = async () => {
    const { data } = await supabase
      .from('game_state')
      .select('*')
      .eq('room_id', room.id)
      .single()

    if (data) {
      setGameState(data)
      setCurrentQuestion(data.questions[room.current_question])
    }
  }

  const loadPlayers = async () => {
    const { data } = await supabase
      .from('room_players')
      .select('*')
      .eq('room_id', room.id)
      .order('score', { ascending: false })

    if (data) setPlayers(data)
  }

  const checkAllAnswered = async () => {
    const { data } = await supabase
      .from('player_answers')
      .select('*')
      .eq('room_id', room.id)
      .eq('question_number', room.current_question)

    if (data && data.length === players.length) {
      showQuestionResults(data)
    }
  }

  const showQuestionResults = async (answers: any[]) => {
    setQuestionResults(answers)
    setShowResults(true)

    // Update player scores
    for (const answer of answers) {
      if (answer.is_correct) {
        await supabase.rpc('increment_score', {
          p_room_id: room.id,
          p_player_id: answer.player_id,
          p_points: answer.points_earned
        })
      }
    }

    // Move to next question after 5 seconds
    setTimeout(async () => {
      if (room.owner_id === playerId) {
        const nextQuestion = room.current_question + 1
        if (nextQuestion >= room.question_count) {
          await supabase
            .from('rooms')
            .update({ status: 'finished' })
            .eq('id', room.id)
        } else {
          await supabase
            .from('rooms')
            .update({ current_question: nextQuestion })
            .eq('id', room.id)
        }
      }
    }, 5000)
  }

  const submitAnswer = async (answerIndex: number, timeTaken: number) => {
    if (hasAnswered || !currentQuestion) return

    setHasAnswered(true)
    setSelectedAnswer(answerIndex)

    const isCorrect = answerIndex === currentQuestion.correct_index
    const timeBonus = Math.floor((timeLeft / room.time_limit) * 100)
    const points = isCorrect ? 1000 + timeBonus : 0

    await supabase.from('player_answers').insert({
      room_id: room.id,
      question_number: room.current_question,
      player_id: playerId,
      answer_index: answerIndex,
      time_taken: timeTaken,
      is_correct: isCorrect,
      points_earned: points
    })

    checkAllAnswered()
  }

  if (room.status === 'finished') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/10 backdrop-blur-sm rounded-lg p-8 max-w-2xl w-full"
        >
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white text-center mb-8">Game Over!</h1>

          <div className="space-y-4">
            {players.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  index === 0 ? 'bg-yellow-500/30 border-2 border-yellow-400' : 'bg-white/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-white">#{index + 1}</span>
                  <span className="text-lg text-white font-medium">{player.player_name}</span>
                </div>
                <span className="text-2xl font-bold text-yellow-400">{player.score}</span>
              </motion.div>
            ))}
          </div>

          <button
            onClick={() => window.location.href = '/'}
            className="w-full mt-8 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    )
  }

  if (!currentQuestion) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3">
            <span className="text-white font-semibold">
              Question {room.current_question + 1} / {room.question_count}
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            <span className={`text-2xl font-bold ${timeLeft <= 5 ? 'text-red-400' : 'text-white'}`}>
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          {!showResults ? (
            <motion.div
              key="question"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-8 mb-6"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">
                {currentQuestion.question}
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (!hasAnswered) {
                        submitAnswer(index, room.time_limit - timeLeft)
                      }
                    }}
                    disabled={hasAnswered}
                    className={`p-6 rounded-lg text-left text-lg font-medium transition ${
                      hasAnswered
                        ? selectedAnswer === index
                          ? index === currentQuestion.correct_index
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                          : index === currentQuestion.correct_index
                          ? 'bg-green-500 text-white'
                          : 'bg-white/20 text-gray-300'
                        : 'bg-white/20 hover:bg-white/30 text-white'
                    } disabled:cursor-not-allowed`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-8 mb-6"
            >
              <h2 className="text-2xl font-bold text-white mb-4 text-center">
                Correct Answer: {currentQuestion.options[currentQuestion.correct_index]}
              </h2>
              <p className="text-gray-300 text-center mb-4">Moving to next question...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Leaderboard */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Leaderboard
          </h3>
          <div className="space-y-2">
            {players.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  player.player_id === playerId ? 'bg-blue-500/30' : 'bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold">#{index + 1}</span>
                  <span className="text-white">{player.player_name}</span>
                </div>
                <span className="text-yellow-400 font-bold">{player.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}