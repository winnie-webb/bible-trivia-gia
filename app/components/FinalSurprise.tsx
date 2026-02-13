'use client'

import { useMemo } from 'react'
import { motion, useTransform } from 'framer-motion'
import { useParallax } from '@/app/components/ValentineExperience'

// ─── Constants ───────────────────────────────────────────────────────────────

const PAPER_GRAIN =
  'repeating-conic-gradient(rgba(0,0,0,0.015) 0% 25%, transparent 0% 50%) 0 0 / 4px 4px'

// ─── Floating Heart Generator ────────────────────────────────────────────────

function generateRisingHearts(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${10 + Math.random() * 80}%`,
    size: 10 + Math.random() * 16,
    delay: Math.random() * 6,
    duration: 6 + Math.random() * 6,
    opacity: 0.12 + Math.random() * 0.15,
    drift: (Math.random() - 0.5) * 40,
  }))
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function FinalSurprise({
  message = "Happy Valentine's ❤️\nYou're my everything.",
}: {
  message?: string
}) {
  const hearts = useMemo(() => generateRisingHearts(16), [])
  const lines = message.split('\n')
  const parallax = useParallax()

  // 3D tilt from mouse
  const tiltX = useTransform(
    parallax?.mouseY ?? { get: () => 0 } as never,
    [-1, 1],
    [4, -4]
  )
  const tiltY = useTransform(
    parallax?.mouseX ?? { get: () => 0 } as never,
    [-1, 1],
    [-4, 4]
  )

  return (
    <section
      className="relative py-20 px-4 overflow-hidden"
      style={{ minHeight: '80vh' }}
    >
      {/* ── Rising hearts (infinite loop) ────────────────────────────── */}
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

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[60vh]">
        {/* "One more thing..." teaser */}
        <motion.p
          className="text-sm uppercase tracking-[0.3em] mb-8"
          style={{ color: 'rgba(220,160,170,0.6)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          One more thing…
        </motion.p>

        {/* Big heart */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 100,
            damping: 10,
            delay: 0.5,
          }}
        >
          <motion.div
            className="text-7xl sm:text-8xl select-none"
            animate={{ scale: [1, 1.12, 1] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
          >
            ❤️
          </motion.div>
        </motion.div>

        {/* Message card with paper grain & 3D tilt */}
        <motion.div
          className="rounded-2xl px-8 py-8 sm:px-10 sm:py-10 max-w-md w-full"
          style={{
            backgroundColor: 'rgba(253,246,236,0.92)',
            backgroundImage: PAPER_GRAIN,
            boxShadow:
              '0 16px 50px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
            border: '1px solid rgba(220,160,170,0.15)',
            perspective: 800,
            rotateX: parallax ? tiltX : 0,
            rotateY: parallax ? tiltY : 0,
          }}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            type: 'spring',
            stiffness: 80,
            damping: 15,
            delay: 0.7,
          }}
        >
          {/* Final message lines */}
          {lines.map((line, i) => (
            <motion.p
              key={i}
              className="text-center mb-2"
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                color: '#5a3e3e',
                fontSize: i === 0 ? '1.6rem' : '1.1rem',
                fontWeight: i === 0 ? 700 : 400,
                letterSpacing: '0.02em',
                lineHeight: 1.7,
              }}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                delay: 0.9 + i * 0.3,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              {line}
            </motion.p>
          ))}
        </motion.div>

        {/* Wax seal decorative element */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, scale: 0, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 150,
            damping: 14,
            delay: 1.6,
          }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle at 35% 35%, #d44, #8b1a1a)',
              boxShadow:
                '0 3px 14px rgba(180,30,30,0.5), inset 0 1px 3px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.2)',
            }}
          >
            <span className="text-rose-100 text-lg leading-none">♥</span>
          </div>
        </motion.div>

        {/* Scripture */}
        <motion.p
          className="mt-6 text-sm italic text-center max-w-md"
          style={{ color: 'rgba(220,160,170,0.6)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 2 }}
        >
          "Many waters cannot quench love, neither can the floods drown it."
          <br />
          — Song of Solomon 8:7
        </motion.p>
      </div>
    </section>
  )
}
