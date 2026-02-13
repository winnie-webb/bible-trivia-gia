'use client'

import { useRef } from 'react'
import { motion, useInView, useTransform } from 'framer-motion'
import { useParallax } from '@/app/components/ValentineExperience'

// ─── Types ───────────────────────────────────────────────────────────────────

type Memory = {
  title: string
  message: string
  emoji: string
  date?: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PAPER_GRAIN =
  'repeating-conic-gradient(rgba(0,0,0,0.015) 0% 25%, transparent 0% 50%) 0 0 / 4px 4px'

// ─── Default Memories ────────────────────────────────────────────────────────

const DEFAULT_MEMORIES: Memory[] = [
  {
    title: 'Our First Bible Study',
    message:
      'The first time we studied God\'s Word together — two hearts learning side by side. I didn\'t know it then, but that moment planted a seed that would bloom into something beautiful.',
    emoji: '📖',
    date: 'A day I\'ll never forget',
  },
  {
    title: 'When We Became Official',
    message:
      'The day we made a covenant in our hearts — to be each other\'s. No more wondering, no more maybe. Just us, committed, with God at the center of it all.',
    emoji: '💑',
    date: 'The best yes',
  },
  {
    title: 'When We Said "I Love You"',
    message:
      'Three words that changed everything. My heart was beating so fast, but the moment those words left our lips, everything felt right. Like it was always meant to be said.',
    emoji: '❤️',
    date: 'Written on my heart',
  },
  {
    title: 'Our Birthdays Together',
    message:
      'Celebrating the day God brought you into this world — there\'s no greater gift He could have given me. Every birthday with you is a reminder of His faithfulness.',
    emoji: '🎂',
    date: 'Our favourite celebrations',
  },
]

// ─── Memory Card ─────────────────────────────────────────────────────────────

function MemoryCard({
  memory,
  index,
}: {
  memory: Memory
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  const parallax = useParallax()

  // Subtle per-card parallax from mouse position
  const offsetX = useTransform(
    parallax?.mouseX ?? { get: () => 0 } as never,
    [-1, 1],
    [-(index + 1) * 3, (index + 1) * 3]
  )
  const offsetY = useTransform(
    parallax?.mouseY ?? { get: () => 0 } as never,
    [-1, 1],
    [-(index + 1) * 2, (index + 1) * 2]
  )

  return (
    <motion.div
      ref={ref}
      className="relative flex items-center justify-center py-8 sm:py-12"
      style={{
        minHeight: '50vh',
        x: parallax ? offsetX : 0,
        y: parallax ? offsetY : 0,
      }}
    >
      {/* Glow behind card */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, rgba(220,100,120,0.12) 0%, transparent 60%)`,
        }}
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
      />

      <motion.div
        className="relative w-full max-w-md mx-auto rounded-2xl px-6 py-8 sm:px-8 sm:py-10"
        style={{
          backgroundColor: '#fdf6ec',
          backgroundImage: PAPER_GRAIN,
          boxShadow:
            '0 16px 50px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
          border: '1px solid rgba(220,160,170,0.15)',
        }}
        initial={{ opacity: 0, scale: 0.85, rotateX: 8 }}
        animate={
          isInView
            ? { opacity: 1, scale: 1, rotateX: 0 }
            : { opacity: 0, scale: 0.85, rotateX: 8 }
        }
        transition={{
          type: 'spring',
          stiffness: 80,
          damping: 16,
          delay: 0.1 + index * 0.05,
        }}
      >
        {/* Emoji icon */}
        <motion.div
          className="text-center mb-5"
          initial={{ opacity: 0, scale: 0 }}
          animate={
            isInView
              ? { opacity: 1, scale: 1 }
              : { opacity: 0, scale: 0 }
          }
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 12,
            delay: 0.3 + index * 0.05,
          }}
        >
          <span className="text-5xl">{memory.emoji}</span>
        </motion.div>

        {/* Date */}
        {memory.date && (
          <motion.p
            className="text-center text-xs uppercase tracking-[0.25em] mb-3"
            style={{ color: 'rgba(190,80,100,0.6)' }}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.4 + index * 0.05 }}
          >
            {memory.date}
          </motion.p>
        )}

        {/* Title */}
        <motion.h3
          className="text-center text-xl sm:text-2xl font-semibold mb-4"
          style={{
            fontFamily: 'var(--font-playfair), Georgia, serif',
            color: '#5a3e3e',
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={
            isInView
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 12 }
          }
          transition={{ duration: 0.5, delay: 0.35 + index * 0.05 }}
        >
          {memory.title}
        </motion.h3>

        {/* Decorative line */}
        <motion.div
          className="mx-auto w-12 h-px mb-5"
          style={{ background: 'rgba(190,80,100,0.3)' }}
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.6, delay: 0.4 + index * 0.05 }}
        />

        {/* Message */}
        <motion.p
          className="text-center text-sm sm:text-base leading-relaxed"
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            color: '#6b4e4e',
            lineHeight: 1.8,
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={
            isInView
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 10 }
          }
          transition={{ duration: 0.6, delay: 0.45 + index * 0.05 }}
        >
          {memory.message}
        </motion.p>
      </motion.div>
    </motion.div>
  )
}

// ─── Section Component ───────────────────────────────────────────────────────

export default function MemoryTimeline({
  memories = DEFAULT_MEMORIES,
}: {
  memories?: Memory[]
}) {
  return (
    <section className="relative py-16 px-4 overflow-hidden">
      {/* Section header */}
      <motion.div
        className="relative z-10 text-center mb-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <p
          className="text-sm uppercase tracking-[0.25em] mb-3"
          style={{ color: 'rgba(220,160,170,0.7)' }}
        >
          Our Favourite Moments
        </p>
        <h2
          className="text-3xl sm:text-4xl font-semibold"
          style={{
            fontFamily: 'var(--font-playfair), Georgia, serif',
            color: '#fde4e8',
          }}
        >
          Favourite Memories Together
        </h2>
        <motion.div
          className="mt-4 mx-auto w-16 h-px"
          style={{ background: 'rgba(220,160,170,0.4)' }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />
      </motion.div>

      {/* Vertical scroll-through cards */}
      <div className="relative z-10 max-w-xl mx-auto">
        {memories.map((memory, i) => (
          <MemoryCard key={i} memory={memory} index={i} />
        ))}
      </div>
    </section>
  )
}
