'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getProfile, updateStreak, checkAndAwardAchievements, recordGameComplete } from '@/lib/localStorage'
import { Clock, Home } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import AchievementToast from '@/app/components/AchievementToast'
type Question = {
  question: string
  options: string[]
  correct_index: number
  difficulty: string
  category: string
}

export default function DailyChallengePlayPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [score, setScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [gameComplete, setGameComplete] = useState(false)
  const [fastestAnswer, setFastestAnswer] = useState<number | null>(null)
  const [newAchievements, setNewAchievements] = useState<string[]>([])

  useEffect(() => {
    const userProfile = getProfile()
    if (!userProfile) {
      router.push('/')
      return
    }
    setProfile(userProfile)
    generateQuestions()
  }, [])

  useEffect(() => {
    if (loading || hasAnswered || gameComplete) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleAnswer(-1)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [loading, hasAnswered, currentQuestionIndex, gameComplete])

  const generateQuestions = async () => {
    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          difficulty: 'mixed',
          category: 'mixed',
          count: 10
        })
      })

      const data = await response.json()
      setQuestions(data.questions)
      setLoading(false)
    } catch (error) {
      console.error('Error loading questions:', error)
      router.push('/daily-challenge')
    }
  }

  const handleAnswer = (answerIndex: number) => {
    if (hasAnswered) return

    setHasAnswered(true)
    setSelectedAnswer(answerIndex)

    const currentQuestion = questions[currentQuestionIndex]
    const isCorrect = answerIndex === currentQuestion.correct_index
    const timeTaken = 30 - timeLeft
    const timeBonus = Math.floor((timeLeft / 30) * 100)
    const points = isCorrect ? 1000 + timeBonus : 0

    if (isCorrect) {
      setScore(prev => prev + points)
      setCorrectCount(prev => prev + 1)
      updateStreak(true)

      if (fastestAnswer === null || timeTaken < fastestAnswer) {
        setFastestAnswer(timeTaken)
      }
    } else {
      updateStreak(false)
    }

    // Check for achievements
    const achievements = checkAndAwardAchievements()
    if (achievements.length > 0) {
      setNewAchievements(prev => [...prev, ...achievements])
    }

    // Move to next question after 3 seconds
    setTimeout(() => {
      if (currentQuestionIndex + 1 < questions.length) {
        setCurrentQuestionIndex(prev => prev + 1)
        setHasAnswered(false)
        setSelectedAnswer(null)
        setTimeLeft(30)
      } else {
        completeChallenge()
      }
    }, 3000)
  }

  const completeChallenge = () => {
    setGameComplete(true)

    // Record game completion
    recordGameComplete(false, correctCount, questions.length, fastestAnswer || undefined)

    // Save daily challenge completion
    const today = new Date().toISOString().split('T')[0]
    const completedChallenges = JSON.parse(localStorage.getItem('dailyChallenges') || '{}')
    completedChallenges[today] = { score, completed: true }
    localStorage.setItem('dailyChallenges', JSON.stringify(completedChallenges))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading challenge...</div>
      </div>
    )
  }

  if (gameComplete) {
    const accuracy = ((correctCount / questions.length) * 100).toFixed(0)

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/10 backdrop-blur-sm rounded-lg p-8 max-w-2xl w-full"
        >
          <h1 className="text-4xl font-bold text-white text-center mb-8">
            Challenge Complete! 🎉
          </h1>

          <div className="bg-white/5 rounded-lg p-6 mb-6">
            <div className="text-center mb-6">
              <p className="text-6xl font-bold text-yellow-400 mb-2">{score}</p>
              <p className="text-gray-300">Total Score</p>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-green-400">{correctCount}</p>
                <p className="text-sm text-gray-400">Correct</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-purple-400">{accuracy}%</p>
                <p className="text-sm text-gray-400">Accuracy</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-400">
                  {fastestAnswer ? `${fastestAnswer.toFixed(1)}s` : 'N/A'}
                </p>
                <p className="text-sm text-gray-400">Fastest</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/daily-challenge')}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 rounded-lg transition"
            >
              Back to Daily Challenge
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-white/20 hover:bg-white/30 text-white font-bold py-3 rounded-lg transition"
            >
              Back to Home
            </button>
          </div>
        </motion.div>

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

  const currentQuestion = questions[currentQuestionIndex]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3">
            <span className="text-white font-semibold">
              Question {currentQuestionIndex + 1} / {questions.length}
            </span>
          </div>

          <div className="flex gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              <span className={`text-2xl font-bold ${timeLeft <= 5 ? 'text-red-400' : 'text-white'}`}>
                {timeLeft}s
              </span>
            </div>

            <button
              onClick={() => router.push('/daily-challenge')}
              className="bg-white/10 hover:bg-white/20 px-4 py-3 rounded-lg text-white transition"
            >
              <Home className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Score */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3 mb-6 text-center">
          <span className="text-white text-lg">
            Score: <span className="font-bold text-yellow-400">{score}</span>
          </span>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
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
                  onClick={() => handleAnswer(index)}
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
                      : 'bg-white/20 hover:bg-white/30 text-white cursor-pointer'
                  } disabled:cursor-not-allowed`}
                >
                  {option}
                </button>
              ))}
            </div>

            {hasAnswered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 text-center"
              >
                <p className="text-gray-300">
                  {selectedAnswer === currentQuestion.correct_index
                    ? '✓ Correct!'
                    : `✗ Incorrect. The answer was: ${currentQuestion.options[currentQuestion.correct_index]}`}
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
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