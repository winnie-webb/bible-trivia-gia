'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, ChevronRight } from 'lucide-react'
import MemoryTimeline from '@/app/components/MemoryTimeline'
import WhyILoveYou from '@/app/components/WhyILoveYou'
import FinalSurprise from '@/app/components/FinalSurprise'
import HeartButton from '@/app/components/HeartButton'
import MusicToggle from '@/app/components/MusicToggle'

// ─── Types ───────────────────────────────────────────────────────────────────

type Stage = 'memories' | 'whyILoveYou' | 'finalSurprise' | 'app'

const STORAGE_KEY = 'valentineViewed'

// ─── Shared transition ──────────────────────────────────────────────────────

const pageTransition = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -30 },
  transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as number[] },
}

// ─── Continue Button ─────────────────────────────────────────────────────────

function ContinueButton({
  onClick,
  label = 'Continue',
  delay = 0.8,
}: {
  onClick: () => void
  label?: string
  delay?: number
}) {
  return (
    <motion.button
      onClick={onClick}
      className="flex items-center gap-2 px-7 py-3 rounded-full text-sm font-medium cursor-pointer border-none outline-none focus-visible:ring-4 focus-visible:ring-ring"
      style={{
        color: '#fff',
        background:
          'linear-gradient(135deg, var(--primary), var(--primary-hover))',
        boxShadow: '0 4px 20px rgba(227,138,164,0.35)',
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      whileHover={{ scale: 1.06, y: -2 }}
      whileTap={{ scale: 0.94 }}
    >
      {label}
      <ChevronRight className="w-4 h-4" />
    </motion.button>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ValentineExperience({
  children,
}: {
  children: React.ReactNode
}) {
  const [stage, setStage] = useState<Stage>('memories')
  const [checked, setChecked] = useState(false)

  // Check if the full experience was already viewed
  useEffect(() => {
    const viewed = localStorage.getItem(STORAGE_KEY)
    if (viewed) {
      setStage('app')
    }
    setChecked(true)
  }, [])

  const advance = useCallback((next: Stage) => {
    setStage(next)
    if (next === 'app') {
      localStorage.setItem(STORAGE_KEY, 'true')
    }
  }, [])

  const replayExperience = useCallback(() => {
    setStage('memories')
  }, [])

  if (!checked) return null

  // ── Already completed → show app ─────────────────────────────────────
  if (stage === 'app') {
    return (
      <>
        <MusicToggle />
        <HeartButton />
        {children}

        {/* Replay entire experience */}
        <motion.button
          onClick={replayExperience}
          className="fixed bottom-5 left-5 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium cursor-pointer border-none"
          style={{
            color: '#fff',
            background:
              'linear-gradient(135deg, var(--primary), var(--primary-hover))',
            boxShadow: '0 4px 20px rgba(227,138,164,0.25)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          aria-label="Replay Valentine's experience"
        >
          <Heart className="w-4 h-4 fill-white" />
          Replay experience
        </motion.button>
      </>
    )
  }

  // ── Sequential fullscreen experience ─────────────────────────────────
  return (
    <>
      <MusicToggle />
      <HeartButton />

      <AnimatePresence mode="wait">
        {/* ── Stage: Memory Timeline ──────────────────────────────── */}
        {stage === 'memories' && (
          <motion.div
            key="memories"
            className="fixed inset-0 z-30 overflow-y-auto"
            style={{ background: 'var(--background)' }}
            {...pageTransition}
          >
            <div className="min-h-screen flex flex-col">
              <div className="flex-1">
                <MemoryTimeline />
              </div>
              <div className="flex justify-center pb-12 pt-4">
                <ContinueButton
                  onClick={() => advance('whyILoveYou')}
                  label="Continue"
                  delay={1.2}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Stage: Why I Love You ───────────────────────────────── */}
        {stage === 'whyILoveYou' && (
          <motion.div
            key="whyILoveYou"
            className="fixed inset-0 z-30 overflow-y-auto"
            style={{ background: 'var(--background)' }}
            {...pageTransition}
          >
            <div className="min-h-screen flex flex-col">
              <div className="flex-1">
                <WhyILoveYou />
              </div>
              <div className="flex justify-center pb-12 pt-4">
                <ContinueButton
                  onClick={() => advance('finalSurprise')}
                  label="One more thing…"
                  delay={1.5}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Stage: Final Surprise ───────────────────────────────── */}
        {stage === 'finalSurprise' && (
          <motion.div
            key="finalSurprise"
            className="fixed inset-0 z-30 overflow-y-auto"
            style={{ background: 'var(--background)' }}
            {...pageTransition}
          >
            <div className="min-h-screen flex flex-col">
              <div className="flex-1">
                <FinalSurprise />
              </div>
              <div className="flex justify-center pb-12 pt-4">
                <ContinueButton
                  onClick={() => advance('app')}
                  label="Enter the app ♥"
                  delay={2.5}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

