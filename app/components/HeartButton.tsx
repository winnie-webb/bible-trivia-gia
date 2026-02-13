'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type FloatingHeart = {
  id: number
  x: number
  y: number
  size: number
  rotation: number
  duration: number
}

// ─── Constants ───────────────────────────────────────────────────────────────

const UNLOCK_TAP_COUNT = 20
const HIDDEN_MESSAGE = "You tapped your way to my heart! 💕 You are my forever. — B"

// ─── Component ───────────────────────────────────────────────────────────────

export default function HeartButton() {
  const [taps, setTaps] = useState(0)
  const [hearts, setHearts] = useState<FloatingHeart[]>([])
  const [showSecret, setShowSecret] = useState(false)
  const [pulse, setPulse] = useState(false)
  const nextId = useRef(0)

  // Haptic feedback (mobile)
  const vibrate = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30)
    }
  }, [])

  // Spawn burst of floating hearts
  const spawnHearts = useCallback((count: number) => {
    const newHearts: FloatingHeart[] = Array.from({ length: count }, () => ({
      id: nextId.current++,
      x: (Math.random() - 0.5) * 160,
      y: -(80 + Math.random() * 120),
      size: 14 + Math.random() * 18,
      rotation: (Math.random() - 0.5) * 60,
      duration: 1 + Math.random() * 0.8,
    }))
    setHearts((prev) => [...prev, ...newHearts])
  }, [])

  // Clean up finished hearts
  useEffect(() => {
    if (hearts.length === 0) return
    const timer = setTimeout(() => {
      setHearts((prev) => prev.slice(-30)) // keep max 30
    }, 2000)
    return () => clearTimeout(timer)
  }, [hearts])

  const handleTap = useCallback(() => {
    const newCount = taps + 1
    setTaps(newCount)
    vibrate()
    setPulse(true)
    setTimeout(() => setPulse(false), 200)

    // Normal tap: 3-5 hearts. Big milestone: more
    const isMilestone = newCount % 10 === 0
    spawnHearts(isMilestone ? 12 : 4)

    // Unlock secret at threshold
    if (newCount === UNLOCK_TAP_COUNT && !showSecret) {
      setShowSecret(true)
    }
  }, [taps, vibrate, spawnHearts, showSecret])

  return (
    <>
      {/* ── Fixed floating heart button ────────────────────────────────── */}
      <div className="fixed bottom-5 left-5 z-40">
        <div className="relative">
          {/* Floating hearts burst */}
          <AnimatePresence>
            {hearts.map((h) => (
              <motion.div
                key={h.id}
                className="absolute pointer-events-none select-none"
                style={{
                  left: '50%',
                  bottom: '50%',
                  fontSize: h.size,
                  color: 'var(--primary)',
                }}
                initial={{ opacity: 1, x: 0, y: 0, scale: 0.5, rotate: 0 }}
                animate={{
                  opacity: 0,
                  x: h.x,
                  y: h.y,
                  scale: 1,
                  rotate: h.rotation,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: h.duration, ease: 'easeOut' }}
              >
                ♥
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Main button */}
          <motion.button
            onClick={handleTap}
            className="relative flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium cursor-pointer border-none outline-none focus-visible:ring-4 focus-visible:ring-ring"
            style={{
              color: '#fff',
              background:
                'linear-gradient(135deg, var(--primary), var(--primary-hover))',
              boxShadow: pulse
                ? '0 0 24px rgba(227,138,164,0.6), 0 4px 16px rgba(227,138,164,0.3)'
                : '0 4px 16px rgba(227,138,164,0.25)',
            }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            animate={pulse ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.2 }}
            aria-label={`Tap for love. ${taps} taps so far.`}
          >
            <Heart className="w-4 h-4 fill-white text-white" />
            <span>Tap for love</span>
            {taps > 0 && (
              <span
                className="ml-1 text-xs opacity-75"
              >
                ({taps})
              </span>
            )}
          </motion.button>
        </div>
      </div>

      {/* ── Secret message modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {showSecret && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
              onClick={() => setShowSecret(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            />

            {/* Message card */}
            <motion.div
              className="relative rounded-2xl px-8 py-10 text-center max-w-sm"
              style={{
                background: 'var(--surface)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                border: '1px solid var(--border)',
              }}
              initial={{ opacity: 0, scale: 0.8, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 40 }}
              transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            >
              <motion.div
                className="text-5xl mb-4"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                💕
              </motion.div>
              <p
                className="text-base font-medium italic leading-relaxed mb-6"
                style={{
                  fontFamily: 'var(--font-playfair), Georgia, serif',
                  color: 'var(--foreground)',
                }}
              >
                {HIDDEN_MESSAGE}
              </p>
              <p
                className="text-xs mb-4"
                style={{ color: 'var(--muted)' }}
              >
                You tapped {taps} times! 🎉
              </p>
              <button
                onClick={() => setShowSecret(false)}
                className="px-6 py-2 rounded-full text-sm font-medium text-white cursor-pointer border-none"
                style={{
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                }}
              >
                Close ♥
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
