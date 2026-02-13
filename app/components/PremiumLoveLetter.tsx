'use client'

import { useState, useEffect, useMemo, useCallback, type ReactNode } from 'react'
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring,
} from 'framer-motion'
import { Heart } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'opening' | 'letterOut' | 'zoom' | 'revealed' | 'done'

type Props = {
  children: ReactNode
  message?: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'letterViewed'

const DEFAULT_MESSAGE = `Happy Valentine's ❤️\nThis little app is just for you.`

// Subtle paper-grain CSS gradient (no images needed)
const PAPER_GRAIN =
  'repeating-conic-gradient(rgba(0,0,0,0.015) 0% 25%, transparent 0% 50%) 0 0 / 4px 4px'

// ─── Floating Hearts Generator ───────────────────────────────────────────────

function generateHearts(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: 10 + Math.random() * 18,
    delay: Math.random() * 6,
    duration: 8 + Math.random() * 7,
    opacity: 0.08 + Math.random() * 0.12,
    drift: (Math.random() - 0.5) * 60,
  }))
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PremiumLoveLetter({ children, message }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [showOverlay, setShowOverlay] = useState(false)
  const [checkedStorage, setCheckedStorage] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  const lines = (message || DEFAULT_MESSAGE).split('\n')
  const hearts = useMemo(() => generateHearts(18), [])

  // ── Mouse / touch parallax motion values ─────────────────────────────────
  const rawMouseX = useMotionValue(0)
  const rawMouseY = useMotionValue(0)
  const mouseX = useSpring(rawMouseX, { stiffness: 150, damping: 20 })
  const mouseY = useSpring(rawMouseY, { stiffness: 150, damping: 20 })

  // Envelope tilt (max ±5°)
  const rotateY = useTransform(mouseX, [-1, 1], [-5, 5])
  const rotateX = useTransform(mouseY, [-1, 1], [5, -5])

  // Background parallax shift (subtle depth layer)
  const bgX = useTransform(mouseX, [-1, 1], [8, -8])
  const bgY = useTransform(mouseY, [-1, 1], [8, -8])

  // ── Mount: check reduced motion & localStorage ──────────────────────────
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) {
      setReducedMotion(true)
      localStorage.setItem(STORAGE_KEY, 'true')
      setCheckedStorage(true)
      return
    }

    const viewed = localStorage.getItem(STORAGE_KEY)
    if (!viewed) {
      setShowOverlay(true)
      setPhase('idle')
    }
    setCheckedStorage(true)
  }, [])

  // ── Pointer tracking for parallax ───────────────────────────────────────
  useEffect(() => {
    if (reducedMotion || !showOverlay) return

    const handleMove = (cx: number, cy: number) => {
      rawMouseX.set((cx / window.innerWidth) * 2 - 1)
      rawMouseY.set((cy / window.innerHeight) * 2 - 1)
    }

    const onMouse = (e: MouseEvent) => handleMove(e.clientX, e.clientY)
    const onTouch = (e: TouchEvent) => {
      if (e.touches[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY)
    }

    window.addEventListener('mousemove', onMouse, { passive: true })
    window.addEventListener('touchmove', onTouch, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('touchmove', onTouch)
    }
  }, [reducedMotion, showOverlay, rawMouseX, rawMouseY])

  // ── Phase transition handlers ───────────────────────────────────────────

  const openEnvelope = useCallback(() => {
    if (phase === 'idle') setPhase('opening')
  }, [phase])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && phase === 'idle') {
        e.preventDefault()
        setPhase('opening')
      }
    },
    [phase]
  )

  const handleReplay = useCallback(() => {
    setPhase('idle')
    setShowOverlay(true)
  }, [])

  const finishAnimation = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true')
  }, [])

  const closeLetter = useCallback(() => {
    setPhase('done')
    setShowOverlay(false)
  }, [])

  // ── Wait for hydration before rendering anything ────────────────────────
  if (!checkedStorage) return null

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════
          ANIMATION OVERLAY
          ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            key="love-letter-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          >
            {/* ── Dark romantic background with parallax ───────────── */}
            <motion.div
              className="absolute inset-[-20px]"
              style={{
                background:
                  'linear-gradient(180deg, #1a0a0f 0%, #2d0a1a 50%, #0d0509 100%)',
                x: reducedMotion ? 0 : bgX,
                y: reducedMotion ? 0 : bgY,
              }}
            >
              {/* Radial vignette */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.55) 100%)',
                }}
              />

              {/* ── Floating hearts ────────────────────────────────── */}
              {hearts.map((h) => (
                <motion.div
                  key={h.id}
                  className="absolute pointer-events-none select-none"
                  style={{
                    left: h.left,
                    fontSize: h.size,
                    color: `rgba(220,100,120,${h.opacity})`,
                  }}
                  initial={{ y: '110vh', x: 0 }}
                  animate={{
                    y: '-10vh',
                    x: [0, h.drift, 0],
                  }}
                  transition={{
                    y: {
                      duration: h.duration,
                      repeat: Infinity,
                      delay: h.delay,
                      ease: 'linear',
                    },
                    x: {
                      duration: h.duration * 0.5,
                      repeat: Infinity,
                      delay: h.delay,
                      ease: 'easeInOut',
                      repeatType: 'mirror',
                    },
                  }}
                >
                  ♥
                </motion.div>
              ))}
            </motion.div>

            {/* ── Scene container (handles camera zoom) ────────────── */}
            <motion.div
              className="relative z-10 flex items-center justify-center"
              animate={
                phase === 'zoom' || phase === 'revealed'
                  ? { scale: 1.25 }
                  : { scale: 1 }
              }
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* ── Envelope + Letter (shown until "revealed") ─────── */}
              {phase !== 'revealed' ? (
                <motion.div
                  className="relative"
                  style={{
                    perspective: 800,
                    rotateX: reducedMotion ? 0 : rotateX,
                    rotateY: reducedMotion ? 0 : rotateY,
                  }}
                  animate={
                    phase === 'zoom'
                      ? { opacity: 0, scale: 0.92 }
                      : { opacity: 1, scale: 1 }
                  }
                  transition={{ duration: 0.9, ease: 'easeInOut' }}
                  onAnimationComplete={() => {
                    if (phase === 'zoom') setPhase('revealed')
                  }}
                >
                  {/* ── Envelope body ──────────────────────────────── */}
                  <motion.div
                    role="button"
                    tabIndex={0}
                    aria-label="Tap to open love letter"
                    onClick={openEnvelope}
                    onKeyDown={handleKeyDown}
                    className="relative w-[280px] h-[185px] sm:w-[340px] sm:h-[220px] rounded-lg cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-rose-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                    style={{
                      backgroundColor: '#f5f0e8',
                      backgroundImage: PAPER_GRAIN,
                      boxShadow:
                        '0 10px 40px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
                      transformStyle: 'preserve-3d',
                    }}
                    whileHover={phase === 'idle' ? { scale: 1.03, y: -2 } : {}}
                    whileTap={phase === 'idle' ? { scale: 0.97 } : {}}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    {/* Faint inner border */}
                    <div
                      className="absolute inset-3 rounded-sm pointer-events-none"
                      style={{ border: '1px solid rgba(0,0,0,0.04)' }}
                    />

                    {/* Bottom V fold lines */}
                    <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
                      <svg
                        className="absolute bottom-0 left-0 w-full"
                        viewBox="0 0 340 130"
                        preserveAspectRatio="none"
                        style={{ height: '60%', opacity: 0.06 }}
                      >
                        <line
                          x1="0"
                          y1="0"
                          x2="170"
                          y2="130"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                        <line
                          x1="340"
                          y1="0"
                          x2="170"
                          y2="130"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </div>

                    {/* ── Heart wax seal ────────────────────────────── */}
                    <AnimatePresence>
                      {phase === 'idle' && (
                        <motion.div
                          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
                          initial={{ opacity: 0, scale: 0, rotate: -20 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          transition={{
                            type: 'spring',
                            stiffness: 180,
                            damping: 14,
                            delay: 0.3,
                          }}
                        >
                          <div
                            className="w-14 h-14 rounded-full flex items-center justify-center"
                            style={{
                              background:
                                'radial-gradient(circle at 35% 35%, #d44, #8b1a1a)',
                              boxShadow:
                                '0 3px 14px rgba(180,30,30,0.5), inset 0 1px 3px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.2)',
                            }}
                          >
                            <span className="text-rose-100 text-xl leading-none">
                              ♥
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* ── Tap prompt ────────────────────────────────── */}
                    <AnimatePresence>
                      {phase === 'idle' && (
                        <motion.p
                          className="absolute -bottom-11 left-0 right-0 text-center text-sm tracking-widest"
                          style={{
                            color: 'rgba(220,160,170,0.6)',
                            fontFamily:
                              "'Georgia', 'Times New Roman', serif",
                          }}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: 0.9, duration: 0.6 }}
                        >
                          tap to open
                        </motion.p>
                      )}
                    </AnimatePresence>

                    {/* ── Envelope flap (triangular, hinge at top) ──── */}
                    <motion.div
                      className="absolute left-0 right-0 origin-top"
                      style={{
                        top: -1,
                        height: '55%',
                        transformStyle: 'preserve-3d',
                        zIndex: 15,
                        clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                        backgroundColor: '#eee9df',
                        backgroundImage: PAPER_GRAIN,
                        filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.08))',
                      }}
                      initial={{ rotateX: 0 }}
                      animate={
                        phase !== 'idle'
                          ? { rotateX: -180 }
                          : { rotateX: 0 }
                      }
                      transition={{
                        type: 'spring',
                        stiffness: 70,
                        damping: 13,
                        mass: 1.3,
                      }}
                      onAnimationComplete={() => {
                        if (phase === 'opening') setPhase('letterOut')
                      }}
                    />

                    {/* ── Letter paper (slides out of envelope) ─────── */}
                    <motion.div
                      className="absolute left-3 right-3 rounded-md overflow-hidden"
                      style={{
                        top: '10%',
                        height: '80%',
                        backgroundColor: '#fdf6ec',
                        backgroundImage: PAPER_GRAIN,
                        zIndex: 5,
                      }}
                      animate={
                        phase === 'letterOut' || phase === 'zoom'
                          ? {
                              y: '-125%',
                              rotate: 1.5,
                              boxShadow:
                                '0 14px 44px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.15)',
                            }
                          : {
                              y: '0%',
                              rotate: 0,
                              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                            }
                      }
                      transition={{
                        type: 'spring',
                        stiffness: 110,
                        damping: 17,
                        mass: 0.9,
                      }}
                      onAnimationComplete={() => {
                        if (phase === 'letterOut') setPhase('zoom')
                      }}
                    >
                      {/* Faint ruled lines */}
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute left-4 right-4 pointer-events-none"
                          style={{
                            top: `${25 + i * 14}%`,
                            height: 1,
                            background: 'rgba(0,0,0,0.05)',
                          }}
                        />
                      ))}
                    </motion.div>
                  </motion.div>
                </motion.div>
              ) : (
                /* ═══════════════════════════════════════════════════════
                   REVEALED LETTER WITH MESSAGE
                   ═══════════════════════════════════════════════════════ */
                <motion.div
                  className="relative w-[300px] sm:w-[380px] rounded-2xl px-8 py-10 sm:px-10 sm:py-12"
                  style={{
                    backgroundColor: '#fdf6ec',
                    backgroundImage: PAPER_GRAIN,
                    boxShadow:
                      '0 20px 70px rgba(0,0,0,0.45), 0 4px 20px rgba(0,0,0,0.2)',
                    fontFamily: "'Georgia', 'Times New Roman', serif",
                  }}
                  initial={{ opacity: 0, scale: 0.8, y: 40 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 90,
                    damping: 15,
                  }}
                >
                  {/* Top flourish */}
                  <motion.div
                    className="text-center mb-6"
                    style={{ color: 'rgba(190,80,100,0.35)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <span className="text-xl tracking-[0.4em]">── ♥ ──</span>
                  </motion.div>

                  {/* Staggered message lines */}
                  {lines.map((line, i) => (
                    <motion.p
                      key={i}
                      className="text-center leading-relaxed mb-3 last:mb-0"
                      style={{
                        color: '#5a3e3e',
                        fontSize: i === 0 ? '1.4rem' : '1.05rem',
                        fontWeight: i === 0 ? 600 : 400,
                        letterSpacing: '0.025em',
                        lineHeight: 1.7,
                      }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.8,
                        delay: 0.4 + i * 0.4,
                        ease: [0.25, 0.1, 0.25, 1],
                      }}
                      onAnimationComplete={() => {
                        if (i === lines.length - 1) finishAnimation()
                      }}
                    >
                      {line}
                    </motion.p>
                  ))}

                  {/* Bottom flourish */}
                  <motion.div
                    className="text-center mt-8"
                    style={{ color: 'rgba(190,80,100,0.35)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      delay: 0.4 + lines.length * 0.4 + 0.3,
                      duration: 0.6,
                    }}
                  >
                    <span className="text-xl tracking-[0.4em]">── ♥ ──</span>
                  </motion.div>

                  {/* Close letter button */}
                  <motion.button
                    onClick={closeLetter}
                    className="mt-8 mx-auto flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium cursor-pointer border-none outline-none focus-visible:ring-4 focus-visible:ring-rose-400/60"
                    style={{
                      color: '#fde4e8',
                      background:
                        'linear-gradient(135deg, rgba(185,40,68,0.88), rgba(135,18,48,0.92))',
                      boxShadow:
                        '0 4px 20px rgba(180,30,60,0.35)',
                      fontFamily: 'system-ui, sans-serif',
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.4 + lines.length * 0.4 + 0.6,
                      duration: 0.5,
                    }}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    aria-label="Close love letter"
                  >
                    <Heart className="w-4 h-4 fill-rose-200 text-rose-200" />
                    Close letter
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN APP CONTENT + REPLAY BUTTON
          ═══════════════════════════════════════════════════════════════════ */}
      {!showOverlay && (
        <>
          {children}

          {/* Persistent "Open letter again" pill button */}
          <motion.button
            onClick={handleReplay}
            className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium cursor-pointer border-none"
            style={{
              color: '#fde4e8',
              background:
                'linear-gradient(135deg, rgba(185,40,68,0.88), rgba(135,18,48,0.92))',
              boxShadow:
                '0 4px 24px rgba(180,30,60,0.35), 0 1px 4px rgba(0,0,0,0.15)',
              backdropFilter: 'blur(8px)',
            }}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.4, ease: 'easeOut' }}
            whileHover={{ scale: 1.06, y: -1 }}
            whileTap={{ scale: 0.94 }}
            aria-label="Replay love letter animation"
          >
            <Heart className="w-4 h-4 fill-rose-200 text-rose-200" />
            Open letter again
          </motion.button>
        </>
      )}
    </>
  )
}
