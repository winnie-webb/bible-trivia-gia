'use client'

import { motion, useTransform } from 'framer-motion'
import { Heart, Star, Sparkles, Sun, Music, Coffee } from 'lucide-react'
import { useParallax } from '@/app/components/ValentineExperience'

// ─── Constants ───────────────────────────────────────────────────────────────

const PAPER_GRAIN =
  'repeating-conic-gradient(rgba(0,0,0,0.015) 0% 25%, transparent 0% 50%) 0 0 / 4px 4px'

// ─── Data ────────────────────────────────────────────────────────────────────

const DEFAULT_REASONS = [
  { text: 'I love your laugh — it fills every room with warmth', icon: Sun },
  { text: 'I love how you support me through every storm', icon: Heart },
  { text: 'I love your heart for God and how you inspire my faith', icon: Sparkles },
  { text: 'I love being with you — even silence feels like home', icon: Coffee },
  { text: 'I love how you see the best in everyone', icon: Star },
  { text: 'I love every single day the Lord gives us together', icon: Heart },
  { text: 'I love the way you pray for us', icon: Sparkles },
  { text: 'I love that you are mine and I am yours', icon: Music },
]

// ─── Component ───────────────────────────────────────────────────────────────

export default function WhyILoveYou({
  reasons = DEFAULT_REASONS,
}: {
  reasons?: { text: string; icon?: typeof Heart }[]
}) {
  const parallax = useParallax()

  // Subtle header parallax
  const headerX = useTransform(
    parallax?.mouseX ?? { get: () => 0 } as never,
    [-1, 1],
    [-6, 6]
  )

  return (
    <section className="relative py-16 px-4 overflow-hidden">
      {/* Subtle radial glow for this section */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(220,100,120,0.08) 0%, transparent 60%)',
        }}
      />

      {/* Header */}
      <motion.div
        className="relative z-10 text-center mb-12"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        style={{ x: parallax ? headerX : 0 }}
      >
        <p
          className="text-sm uppercase tracking-[0.25em] mb-3"
          style={{ color: 'rgba(220,160,170,0.7)' }}
        >
          From My Heart
        </p>
        <h2
          className="text-3xl sm:text-4xl font-semibold"
          style={{
            fontFamily: 'var(--font-playfair), Georgia, serif',
            color: '#fde4e8',
          }}
        >
          Why I Love You
        </h2>
        <motion.div
          className="mt-4 mx-auto w-16 h-px"
          style={{ background: 'rgba(220,160,170,0.4)' }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />
      </motion.div>

      {/* Reasons list */}
      <div className="relative z-10 max-w-lg mx-auto space-y-5">
        {reasons.map((reason, i) => {
          const Icon = reason.icon || Heart
          return (
            <ReasonCard key={i} reason={reason} index={i} Icon={Icon} />
          )
        })}
      </div>
    </section>
  )
}

// ─── Reason Card ─────────────────────────────────────────────────────────────

function ReasonCard({
  reason,
  index,
  Icon,
}: {
  reason: { text: string }
  index: number
  Icon: typeof Heart
}) {
  const parallax = useParallax()

  const cardX = useTransform(
    parallax?.mouseX ?? { get: () => 0 } as never,
    [-1, 1],
    [-(index + 1) * 2, (index + 1) * 2]
  )

  return (
    <motion.div
      className="flex items-start gap-4 rounded-2xl px-6 py-5"
      style={{
        backgroundColor: 'rgba(253,246,236,0.92)',
        backgroundImage: PAPER_GRAIN,
        border: '1px solid rgba(220,160,170,0.2)',
        boxShadow:
          '0 8px 30px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.1)',
        x: parallax ? cardX : 0,
      }}
      initial={{ opacity: 0, scale: 0.9, rotate: index % 2 === 0 ? -2 : 2 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{
        type: 'spring',
        stiffness: 100,
        damping: 14,
        delay: 0.2 + index * 0.1,
      }}
    >
      <div
        className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
        style={{
          background: 'radial-gradient(circle at 35% 35%, #d44, #8b1a1a)',
          boxShadow: '0 2px 8px rgba(180,30,30,0.3)',
        }}
      >
        <Icon className="w-4 h-4 text-rose-100" />
      </div>
      <p
        className="text-base leading-relaxed italic"
        style={{
          fontFamily: "'Georgia', 'Times New Roman', serif",
          color: '#5a3e3e',
        }}
      >
        {reason.text}
      </p>
    </motion.div>
  )
}
