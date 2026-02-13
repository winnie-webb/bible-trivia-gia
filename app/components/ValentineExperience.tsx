'use client'

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  createContext,
  useContext,
  type ReactNode,
} from 'react'
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring,
  type MotionValue,
} from 'framer-motion'
import { Heart, ChevronRight, X } from 'lucide-react'
import MemoryTimeline from '@/app/components/MemoryTimeline'
import WhyILoveYou from '@/app/components/WhyILoveYou'
import FinalSurprise from '@/app/components/FinalSurprise'
import HeartButton from '@/app/components/HeartButton'
import MusicToggle from '@/app/components/MusicToggle'

// ─── Types ───────────────────────────────────────────────────────────────────

type Stage =
  | 'envelope'
  | 'letter'
  | 'memories'
  | 'whyILoveYou'
  | 'finalSurprise'
  | 'app'

type EnvelopePhase = 'idle' | 'opening' | 'letterOut' | 'zoom' | 'revealed'

const STORAGE_KEY = 'experienceCompleted'

// ─── Parallax Context ────────────────────────────────────────────────────────

type ParallaxCtx = { mouseX: MotionValue<number>; mouseY: MotionValue<number> }
const ParallaxContext = createContext<ParallaxCtx | null>(null)
export function useParallax() {
  return useContext(ParallaxContext)
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_MESSAGE = `My Beloved, My Valentine ❤️
A year hence, I knew thee not. Thou wert a stranger unto mine eyes, and my heart had not yet learned the melody of thy name. How wondrous are the ways of the Lord, who in His perfect timing brought thee unto me — for He declareth in Ecclesiastes that to everything there is a season, and this, my darling, is our season of love.
As Solomon sang of his beloved, so I sing of thee: "Thou art fair, my love; behold, thou art fair. Thy eyes are as doves behind thy veil." Thy beauty surpasseth the lilies of the field, and thy voice is sweeter than the honeycomb that drippeth upon my lips.
Before I beheld thee, my garden was asleep, the winter had not yet passed. But thou camest as the spring — the flowers appeared upon the earth, the time of singing arrived, and the voice of the turtledove was heard in our land. Thou hast awakened love in the chambers of my heart where none had dwelt before.
I marvel that the Almighty, who setteth the stars in their courses and knoweth the number of the sands upon the shore, did ordain that our paths should cross. He who maketh all things beautiful in His time hath made thee the most beautiful of all His works unto mine eyes.
My love for thee is a akin to a flame that increaseth with every tender breath, every shared smile, every shared prayer, and every challenge we overcome together.
From this Valentine's Day unto all our days, I am thine and thou art mine, as the Lord hath willed it.
With all the love mine heart doth hold,
Forever & Always
Brian ♥`

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

// ─── Shared transition ──────────────────────────────────────────────────────

const pageTransition = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -30 },
  transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
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
      className="flex items-center gap-2 px-7 py-3 rounded-full text-sm font-medium cursor-pointer border-none outline-none focus-visible:ring-4 focus-visible:ring-rose-400/60"
      style={{
        color: '#fde4e8',
        background:
          'linear-gradient(135deg, rgba(185,40,68,0.88), rgba(135,18,48,0.92))',
        boxShadow: '0 4px 20px rgba(180,30,60,0.35)',
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

// ─── Cinematic Background ────────────────────────────────────────────────────

function CinematicBackground({
  hearts,
  bgX,
  bgY,
  reducedMotion,
}: {
  hearts: ReturnType<typeof generateHearts>
  bgX: MotionValue<number>
  bgY: MotionValue<number>
  reducedMotion: boolean
}) {
  return (
    <motion.div
      className="fixed inset-[-20px] z-0 pointer-events-none"
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

      {/* Floating hearts */}
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
  )
}

// ─── Envelope Stage ──────────────────────────────────────────────────────────

function EnvelopeStage({
  envelopePhase,
  setEnvelopePhase,
  rotateX,
  rotateY,
  reducedMotion,
  onLetterRevealed,
}: {
  envelopePhase: EnvelopePhase
  setEnvelopePhase: (p: EnvelopePhase) => void
  rotateX: MotionValue<number>
  rotateY: MotionValue<number>
  reducedMotion: boolean
  onLetterRevealed: () => void
}) {
  const openEnvelope = useCallback(() => {
    if (envelopePhase === 'idle') setEnvelopePhase('opening')
  }, [envelopePhase, setEnvelopePhase])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && envelopePhase === 'idle') {
        e.preventDefault()
        setEnvelopePhase('opening')
      }
    },
    [envelopePhase, setEnvelopePhase]
  )

  return (
    <motion.div
      className="relative z-10 flex items-center justify-center min-h-screen"
      animate={
        envelopePhase === 'zoom'
          ? { scale: 1.25 }
          : { scale: 1 }
      }
      transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="relative"
        style={{
          perspective: 800,
          rotateX: reducedMotion ? 0 : rotateX,
          rotateY: reducedMotion ? 0 : rotateY,
        }}
        animate={
          envelopePhase === 'zoom'
            ? { opacity: 0, scale: 0.92 }
            : { opacity: 1, scale: 1 }
        }
        transition={{ duration: 0.9, ease: 'easeInOut' }}
        onAnimationComplete={() => {
          if (envelopePhase === 'zoom') onLetterRevealed()
        }}
      >
        {/* Envelope body */}
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
          whileHover={envelopePhase === 'idle' ? { scale: 1.03, y: -2 } : {}}
          whileTap={envelopePhase === 'idle' ? { scale: 0.97 } : {}}
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
              <line x1="0" y1="0" x2="170" y2="130" stroke="currentColor" strokeWidth="1.5" />
              <line x1="340" y1="0" x2="170" y2="130" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Heart wax seal */}
          <AnimatePresence>
            {envelopePhase === 'idle' && (
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
                    background: 'radial-gradient(circle at 35% 35%, #d44, #8b1a1a)',
                    boxShadow:
                      '0 3px 14px rgba(180,30,30,0.5), inset 0 1px 3px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.2)',
                  }}
                >
                  <span className="text-rose-100 text-xl leading-none">♥</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tap prompt */}
          <AnimatePresence>
            {envelopePhase === 'idle' && (
              <motion.p
                className="absolute -bottom-11 left-0 right-0 text-center text-sm tracking-widest"
                style={{
                  color: 'rgba(220,160,170,0.6)',
                  fontFamily: "'Georgia', 'Times New Roman', serif",
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

          {/* Envelope flap */}
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
              envelopePhase !== 'idle' ? { rotateX: -180 } : { rotateX: 0 }
            }
            transition={{
              type: 'spring',
              stiffness: 70,
              damping: 13,
              mass: 1.3,
            }}
            onAnimationComplete={() => {
              if (envelopePhase === 'opening') setEnvelopePhase('letterOut')
            }}
          />

          {/* Letter paper sliding out */}
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
              envelopePhase === 'letterOut' || envelopePhase === 'zoom'
                ? {
                    y: '-125%',
                    rotate: 1.5,
                    boxShadow: '0 14px 44px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.15)',
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
              if (envelopePhase === 'letterOut') setEnvelopePhase('zoom')
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
    </motion.div>
  )
}

// ─── Letter Stage ────────────────────────────────────────────────────────────

function LetterStage({ onContinue }: { onContinue: () => void }) {
  const lines = DEFAULT_MESSAGE.split('\n')

  return (
    <motion.div
      className="relative z-10 flex items-center justify-center min-h-screen p-4"
      {...pageTransition}
    >
      <motion.div
        className="relative w-[320px] sm:w-[420px] md:w-[480px] rounded-2xl px-6 py-8 sm:px-10 sm:py-12 overflow-y-auto"
        style={{
          backgroundColor: '#fdf6ec',
          backgroundImage: PAPER_GRAIN,
          boxShadow:
            '0 20px 70px rgba(0,0,0,0.45), 0 4px 20px rgba(0,0,0,0.2)',
          fontFamily: "'Georgia', 'Times New Roman', serif",
          maxHeight: '85vh',
        }}
        initial={{ opacity: 0, scale: 0.8, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 90, damping: 15 }}
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
              fontSize: i === 0 ? '1.3rem' : '0.95rem',
              fontWeight: i === 0 ? 600 : 400,
              letterSpacing: '0.02em',
              lineHeight: 1.75,
              textAlign:
                line.startsWith('With all') || line.startsWith('Forever')
                  ? 'right'
                  : undefined,
              fontStyle:
                line.startsWith('Forever') || line.startsWith('With all')
                  ? 'italic'
                  : undefined,
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.3 + i * 0.15,
              ease: [0.25, 0.1, 0.25, 1],
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
            delay: 0.3 + lines.length * 0.15 + 0.2,
            duration: 0.6,
          }}
        >
          <span className="text-xl tracking-[0.4em]">── ♥ ──</span>
        </motion.div>

        {/* Continue button inside letter */}
        <motion.div className="flex justify-center mt-8">
          <ContinueButton
            onClick={onContinue}
            label="Continue"
            delay={0.3 + lines.length * 0.15 + 0.5}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ValentineExperience({
  children,
}: {
  children: ReactNode
}) {
  const [stage, setStage] = useState<Stage>('envelope')
  const [envelopePhase, setEnvelopePhase] = useState<EnvelopePhase>('idle')
  const [checked, setChecked] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  const hearts = useMemo(() => generateHearts(18), [])

  // ── Mouse / touch parallax motion values ─────────────────────────────
  const rawMouseX = useMotionValue(0)
  const rawMouseY = useMotionValue(0)
  const mouseX = useSpring(rawMouseX, { stiffness: 150, damping: 20 })
  const mouseY = useSpring(rawMouseY, { stiffness: 150, damping: 20 })

  // Envelope tilt
  const rotateY = useTransform(mouseX, [-1, 1], [-5, 5])
  const rotateX = useTransform(mouseY, [-1, 1], [5, -5])

  // Background parallax shift
  const bgX = useTransform(mouseX, [-1, 1], [8, -8])
  const bgY = useTransform(mouseY, [-1, 1], [8, -8])

  // ── Mount: check reduced motion & localStorage ──────────────────────
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) {
      setReducedMotion(true)
      localStorage.setItem(STORAGE_KEY, 'true')
      setStage('app')
      setChecked(true)
      return
    }

    const viewed = localStorage.getItem(STORAGE_KEY)
    if (viewed) {
      setStage('app')
    }
    setChecked(true)
  }, [])

  // ── Pointer tracking for parallax ───────────────────────────────────
  useEffect(() => {
    if (reducedMotion || stage === 'app') return

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
  }, [reducedMotion, stage, rawMouseX, rawMouseY])

  const advance = useCallback((next: Stage) => {
    setStage(next)
    if (next === 'app') {
      localStorage.setItem(STORAGE_KEY, 'true')
    }
  }, [])

  const replayExperience = useCallback(() => {
    setStage('envelope')
    setEnvelopePhase('idle')
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
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium cursor-pointer border-none"
          style={{
            color: '#fde4e8',
            background:
              'linear-gradient(135deg, rgba(185,40,68,0.88), rgba(135,18,48,0.92))',
            boxShadow:
              '0 4px 24px rgba(180,30,60,0.35), 0 1px 4px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(8px)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          aria-label="Replay Valentine's experience"
        >
          <Heart className="w-4 h-4 fill-rose-200 text-rose-200" />
          Replay experience
        </motion.button>
      </>
    )
  }

  // ── Full-screen cinematic experience ─────────────────────────────────
  return (
    <ParallaxContext.Provider value={{ mouseX, mouseY }}>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Persistent cinematic background */}
        <CinematicBackground
          hearts={hearts}
          bgX={bgX}
          bgY={bgY}
          reducedMotion={reducedMotion}
        />

        <MusicToggle />
        <HeartButton />

        {/* Close / Skip experience button */}
        <motion.button
          onClick={() => advance('app')}
          className="fixed top-5 right-5 z-50 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium cursor-pointer border-none outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60"
          style={{
            color: 'rgba(220,160,170,0.7)',
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(220,160,170,0.15)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.5 }}
          whileHover={{ scale: 1.06, background: 'rgba(255,255,255,0.15)' }}
          whileTap={{ scale: 0.94 }}
          aria-label="Skip experience"
        >
          <X className="w-3.5 h-3.5" />
          Skip
        </motion.button>

        {/* Stage content */}
        <AnimatePresence mode="wait">
          {/* ── Stage: Envelope ──────────────────────────────────── */}
          {stage === 'envelope' && (
            <motion.div
              key="envelope"
              className="absolute inset-0 z-10"
              {...pageTransition}
            >
              <EnvelopeStage
                envelopePhase={envelopePhase}
                setEnvelopePhase={setEnvelopePhase}
                rotateX={rotateX}
                rotateY={rotateY}
                reducedMotion={reducedMotion}
                onLetterRevealed={() => advance('letter')}
              />
            </motion.div>
          )}

          {/* ── Stage: Letter ────────────────────────────────────── */}
          {stage === 'letter' && (
            <motion.div
              key="letter"
              className="absolute inset-0 z-10"
              {...pageTransition}
            >
              <LetterStage onContinue={() => advance('memories')} />
            </motion.div>
          )}

          {/* ── Stage: Favourite Memories ─────────────────────────── */}
          {stage === 'memories' && (
            <motion.div
              key="memories"
              className="absolute inset-0 z-10 overflow-y-auto"
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

          {/* ── Stage: Why I Love You ────────────────────────────── */}
          {stage === 'whyILoveYou' && (
            <motion.div
              key="whyILoveYou"
              className="absolute inset-0 z-10 overflow-y-auto"
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

          {/* ── Stage: Final Surprise ────────────────────────────── */}
          {stage === 'finalSurprise' && (
            <motion.div
              key="finalSurprise"
              className="absolute inset-0 z-10 overflow-y-auto"
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
      </div>
    </ParallaxContext.Provider>
  )
}

