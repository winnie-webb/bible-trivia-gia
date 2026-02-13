'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'

// ─── Floating Heart Generator ────────────────────────────────────────────────

function generateRisingHearts(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${10 + Math.random() * 80}%`,
    size: 10 + Math.random() * 16,
    delay: Math.random() * 4,
    duration: 4 + Math.random() * 5,
    opacity: 0.15 + Math.random() * 0.2,
    drift: (Math.random() - 0.5) * 40,
  }))
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function FinalSurprise({
  message = "Happy Valentine's ❤️\nYou're my everything.",
}: {
  message?: string
}) {
  const hearts = useMemo(() => generateRisingHearts(20), [])
  const lines = message.split('\n')

  return (
    <section
      className="relative py-20 px-4 overflow-hidden"
      style={{ minHeight: '70vh' }}
    >
      {/* ── Gradient glow background ─────────────────────────────────── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 60%, var(--highlight) 0%, var(--soft) 35%, var(--background) 70%)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />

      {/* ── Rising hearts ────────────────────────────────────────────── */}
      {hearts.map((h) => (
        <motion.div
          key={h.id}
          className="absolute pointer-events-none select-none"
          style={{
            left: h.left,
            bottom: 0,
            fontSize: h.size,
            color: 'var(--primary)',
            opacity: h.opacity,
          }}
          initial={{ y: 0, x: 0, opacity: h.opacity }}
          animate={{
            y: '-100vh',
            x: [0, h.drift, 0],
            opacity: [h.opacity, h.opacity, 0],
          }}
          transition={{
            y: { duration: h.duration, delay: h.delay, ease: 'linear' },
            x: {
              duration: h.duration * 0.6,
              delay: h.delay,
              ease: 'easeInOut',
              repeatType: 'mirror',
              repeat: 1,
            },
            opacity: {
              duration: h.duration,
              delay: h.delay,
              times: [0, 0.7, 1],
            },
          }}
        >
          ♥
        </motion.div>
      ))}

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[50vh]">
        {/* "One more thing..." teaser */}
        <motion.p
          className="text-sm uppercase tracking-[0.3em] mb-8"
          style={{ color: 'var(--muted)' }}
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

        {/* Final message lines */}
        {lines.map((line, i) => (
          <motion.p
            key={i}
            className="text-center mb-2"
            style={{
              fontFamily: 'var(--font-playfair), Georgia, serif',
              color: 'var(--foreground)',
              fontSize: i === 0 ? '1.8rem' : '1.15rem',
              fontWeight: i === 0 ? 700 : 400,
              letterSpacing: '0.02em',
              lineHeight: 1.6,
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

        {/* Subtle decorative line */}
        <motion.div
          className="mt-10 w-24 h-px"
          style={{ background: 'var(--primary)' }}
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 0.5, scaleX: 1 }}
          transition={{ duration: 0.8, delay: 1.6 }}
        />

        {/* Scripture */}
        <motion.p
          className="mt-6 text-sm italic text-center max-w-md"
          style={{ color: 'var(--muted)' }}
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
