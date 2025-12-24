'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ACHIEVEMENTS } from '@/lib/localStorage'
import { Award, X } from 'lucide-react'

type Props = {
  achievementKey: string
  onClose: () => void
  delay?: number
}

export default function AchievementToast({ achievementKey, onClose, delay = 0 }: Props) {
  const [isVisible, setIsVisible] = useState(false)
  
  const achievement = ACHIEVEMENTS.find(a => a.key === achievementKey)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    const autoClose = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300)
    }, delay + 5000)

    return () => {
      clearTimeout(timer)
      clearTimeout(autoClose)
    }
  }, [delay])

  if (!achievement) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg shadow-2xl p-4 w-80 relative"
        >
          <button
            onClick={() => {
              setIsVisible(false)
              setTimeout(onClose, 300)
            }}
            className="absolute top-2 right-2 text-white/70 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-white" />
            <div className="flex-1">
              <p className="text-white font-bold text-sm">Achievement Unlocked!</p>
              <p className="text-white text-lg font-bold">{achievement.icon} {achievement.name}</p>
              <p className="text-white/90 text-xs">{achievement.description}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}