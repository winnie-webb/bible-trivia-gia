'use client'

import { motion } from 'framer-motion'
import { Heart, Star, Sparkles, Sun, Music, Coffee } from 'lucide-react'

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
  return (
    <section className="relative py-16 px-4 overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, var(--highlight) 0%, transparent 65%)',
          opacity: 0.3,
        }}
      />

      {/* Header */}
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
          From My Heart
        </p>
        <h2
          className="text-3xl sm:text-4xl font-semibold"
          style={{
            fontFamily: 'var(--font-playfair), Georgia, serif',
            color: 'var(--foreground)',
          }}
        >
          Why I Love You
        </h2>
        <div
          className="mt-4 mx-auto w-16 h-px"
          style={{ background: 'var(--primary)' }}
        />
      </motion.div>

      {/* Reasons list */}
      <div className="relative z-10 max-w-lg mx-auto space-y-4">
        {reasons.map((reason, i) => {
          const Icon = reason.icon || Heart
          return (
            <motion.div
              key={i}
              className="flex items-start gap-4 rounded-2xl px-6 py-4"
              style={{
                background: 'var(--glass)',
                backdropFilter: 'blur(12px)',
                border: '1px solid var(--border)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
              }}
              initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.2 + i * 0.1,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              <div
                className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, var(--soft), var(--highlight))',
                }}
              >
                <Icon
                  className="w-4 h-4"
                  style={{ color: 'var(--primary)' }}
                />
              </div>
              <p
                className="text-base leading-relaxed italic"
                style={{
                  fontFamily: 'var(--font-playfair), Georgia, serif',
                  color: 'var(--foreground)',
                }}
              >
                {reason.text}
              </p>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
