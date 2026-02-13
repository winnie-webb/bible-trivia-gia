'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Volume2, VolumeX } from 'lucide-react'

// ─── Component ───────────────────────────────────────────────────────────────

export default function MusicToggle({
  src = '/dandelions.m4a',
  autoStart = false,
}: {
  src?: string
  autoStart?: boolean
}) {
  const [playing, setPlaying] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const autoStarted = useRef(false)

  // Create audio element on mount
  useEffect(() => {
    const audio = new Audio(src)
    audio.loop = true
    audio.volume = 0
    audioRef.current = audio

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [src])

  // Smooth fade in/out
  const fade = useCallback(
    (target: number, duration: number) => {
      const audio = audioRef.current
      if (!audio) return

      const startVol = audio.volume
      const diff = target - startVol
      const steps = 30
      const stepTime = duration / steps
      let step = 0

      const interval = setInterval(() => {
        step++
        audio.volume = Math.max(
          0,
          Math.min(1, startVol + diff * (step / steps))
        )
        if (step >= steps) {
          clearInterval(interval)
          if (target === 0) audio.pause()
        }
      }, stepTime)
    },
    []
  )

  // Auto-start music when triggered (e.g. after envelope tap)
  useEffect(() => {
    if (!autoStart || autoStarted.current || playing) return
    const audio = audioRef.current
    if (!audio) return

    autoStarted.current = true
    audio.play().then(() => {
      fade(0.35, 1200)
      setPlaying(true)
      setHasInteracted(true)
    }).catch(() => {
      // Autoplay blocked — user can tap the toggle manually
    })
  }, [autoStart, playing, fade])

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (!hasInteracted) setHasInteracted(true)

    if (playing) {
      fade(0, 800)
      setPlaying(false)
    } else {
      audio.play().then(() => {
        fade(0.35, 1200)
        setPlaying(true)
      }).catch(() => {
        // Autoplay blocked — ignore silently
      })
    }
  }, [playing, hasInteracted, fade])

  return (
    <motion.button
      onClick={toggle}
      className="fixed top-5 right-5 z-40 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer border-none outline-none focus-visible:ring-4 focus-visible:ring-ring"
      style={{
        background: playing
          ? 'linear-gradient(135deg, var(--primary), var(--primary-hover))'
          : 'var(--glass)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--border)',
        color: playing ? '#fff' : 'var(--muted)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      aria-label={playing ? 'Mute background music' : 'Play background music'}
      title={playing ? 'Mute music' : 'Play music'}
    >
      {playing ? (
        <Volume2 className="w-4 h-4" />
      ) : (
        <VolumeX className="w-4 h-4" />
      )}

      {/* Pulse ring when playing */}
      {playing && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: '2px solid var(--primary)',
            opacity: 0.4,
          }}
          animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
    </motion.button>
  )
}
