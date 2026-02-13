'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

// ─── Types ───────────────────────────────────────────────────────────────────

type Memory = {
  title: string
  message: string
  emoji: string
  date?: string
}

// ─── Default Memories ────────────────────────────────────────────────────────

const DEFAULT_MEMORIES: Memory[] = [
  {
    title: 'When We First Met',
    message:
      'A year ago, we were strangers. God had a beautiful plan we couldn\'t yet see. That first moment I saw your smile, something stirred in my heart.',
    emoji: '✨',
    date: 'Early 2025',
  },
  {
    title: 'Our First Real Conversation',
    message:
      'We talked for hours and it felt like minutes. I knew then that you were different — a gift wrapped in grace and warmth.',
    emoji: '💬',
    date: 'A beautiful day',
  },
  {
    title: 'The Moment I Knew',
    message:
      'There was a quiet moment — maybe you don\'t even remember it — when I looked at you and thought, "This is the one God kept for me."',
    emoji: '💖',
    date: 'Written on my heart',
  },
  {
    title: 'Our Favorite Memory',
    message:
      'Every laugh, every prayer together, every late-night talk — they all blur into one golden feeling: joy. Pure, God-given joy.',
    emoji: '🌅',
    date: 'Every day with you',
  },
  {
    title: 'What You Mean To Me',
    message:
      'You are my answered prayer, my Proverbs 31 woman, my Song of Solomon love. I thank God for you every single day.',
    emoji: '🙏',
    date: 'Now & forever',
  },
]

// ─── Polaroid Card ───────────────────────────────────────────────────────────

function PolaroidCard({
  memory,
  index,
}: {
  memory: Memory
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-30px' })

  // Alternate slight rotations for realism
  const rotations = [-2.5, 1.8, -1.2, 2.3, -1.8]
  const rotation = rotations[index % rotations.length]

  return (
    <motion.div
      ref={ref}
      className="relative mx-auto w-full max-w-[300px]"
      initial={{ opacity: 0, y: 50, rotate: 0 }}
      animate={
        isInView
          ? { opacity: 1, y: 0, rotate: rotation }
          : { opacity: 0, y: 50, rotate: 0 }
      }
      transition={{
        duration: 0.6,
        delay: 0.15 + index * 0.12,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      whileHover={{ rotate: 0, scale: 1.04, y: -4 }}
    >
      <div
        className="rounded-xl p-5 pb-6"
        style={{
          background: 'linear-gradient(145deg, #fffaf5, #fff5ee)',
          boxShadow:
            '0 8px 30px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)',
          border: '1px solid rgba(227,138,164,0.12)',
        }}
      >
        {/* Emoji / Photo placeholder area */}
        <div
          className="rounded-lg h-32 flex items-center justify-center mb-4"
          style={{
            background:
              'linear-gradient(135deg, var(--soft), var(--highlight))',
          }}
        >
          <span className="text-5xl">{memory.emoji}</span>
        </div>

        {/* Title */}
        <h3
          className="text-lg font-semibold mb-2"
          style={{
            fontFamily: 'var(--font-playfair), Georgia, serif',
            color: 'var(--foreground)',
          }}
        >
          {memory.title}
        </h3>

        {/* Message */}
        <p
          className="text-sm leading-relaxed mb-3"
          style={{ color: 'var(--muted)' }}
        >
          {memory.message}
        </p>

        {/* Date */}
        {memory.date && (
          <p
            className="text-xs italic"
            style={{ color: 'var(--primary)' }}
          >
            {memory.date}
          </p>
        )}
      </div>
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
      {/* Subtle background accent */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, var(--soft) 0%, transparent 60%)',
          opacity: 0.5,
        }}
      />

      {/* Section header */}
      <motion.div
        className="relative z-10 text-center mb-12"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <p
          className="text-sm uppercase tracking-[0.25em] mb-3"
          style={{ color: 'var(--primary)' }}
        >
          Our Story
        </p>
        <h2
          className="text-3xl sm:text-4xl font-semibold"
          style={{
            fontFamily: 'var(--font-playfair), Georgia, serif',
            color: 'var(--foreground)',
          }}
        >
          Memory Lane
        </h2>
        <div
          className="mt-4 mx-auto w-16 h-px"
          style={{ background: 'var(--primary)' }}
        />
      </motion.div>

      {/* Cards grid */}
      <div className="relative z-10 max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
        {memories.map((memory, i) => (
          <PolaroidCard key={i} memory={memory} index={i} />
        ))}
      </div>
    </section>
  )
}
