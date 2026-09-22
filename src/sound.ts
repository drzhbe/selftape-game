// All sounds are synthesized with Web Audio — no asset files.

import { useSyncExternalStore } from 'react'

const MUTE_KEY = 'selftape-game:muted'

let muted = (() => {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
})()
const listeners = new Set<() => void>()

export function setMuted(m: boolean) {
  muted = m
  try {
    localStorage.setItem(MUTE_KEY, m ? '1' : '0')
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l())
  if (!m) play('tap')
}

export const useMuted = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => muted,
  )

let ctx: AudioContext | undefined
let master: GainNode | undefined

function audio() {
  if (!ctx) {
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = 0.35
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
  return { ctx, out: master! }
}

interface Tone {
  freq: number
  at?: number
  dur?: number
  type?: OscillatorType
  gain?: number
  slideTo?: number
}

function tone({ freq, at = 0, dur = 0.12, type = 'triangle', gain = 0.5, slideTo }: Tone) {
  const { ctx, out } = audio()
  const t = ctx.currentTime + at
  const osc = ctx.createOscillator()
  const env = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
  // Fast attack, exponential decay: a soft "pluck".
  env.gain.setValueAtTime(0.0001, t)
  env.gain.exponentialRampToValueAtTime(gain, t + 0.008)
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(env).connect(out)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

function whoosh(at = 0, dur = 0.35) {
  const { ctx, out } = audio()
  const t = ctx.currentTime + at
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = buf
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.Q.value = 1.2
  filter.frequency.setValueAtTime(400, t)
  filter.frequency.exponentialRampToValueAtTime(4000, t + dur)
  const env = ctx.createGain()
  env.gain.setValueAtTime(0.0001, t)
  env.gain.exponentialRampToValueAtTime(0.35, t + dur * 0.4)
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(filter).connect(env).connect(out)
  src.start(t)
}

// C major pentatonic, so any combination sounds pleasant.
const N = { C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5, D6: 1174.66, E6: 1318.51, G6: 1567.98, C7: 2093 }
const SCORE_NOTES = [N.C5, N.D5, N.E5, N.G5, N.A5]

const SOUNDS = {
  tap: () => tone({ freq: 880, dur: 0.05, type: 'sine', gain: 0.25 }),
  /** Pitch rises with the score picked. */
  select: (score = 3) => {
    const f = SCORE_NOTES[Math.max(0, Math.min(4, score - 1))]
    tone({ freq: f, dur: 0.14, gain: 0.45 })
    tone({ freq: f * 2, dur: 0.08, type: 'sine', gain: 0.12 })
  },
  next: () => {
    tone({ freq: N.E5, dur: 0.08, gain: 0.3 })
    tone({ freq: N.A5, at: 0.06, dur: 0.12, gain: 0.3 })
  },
  back: () => {
    tone({ freq: N.A5, dur: 0.08, gain: 0.25 })
    tone({ freq: N.E5, at: 0.06, dur: 0.12, gain: 0.25 })
  },
  /** Take scored — the classic "correct!" double chime. */
  success: () => {
    ;[N.C6, N.E6].forEach((f, i) => tone({ freq: f, at: i * 0.09, dur: 0.35, gain: 0.4 }))
    tone({ freq: N.G6, at: 0.18, dur: 0.5, type: 'sine', gain: 0.25 })
  },
  levelUp: () => {
    ;[N.C5, N.E5, N.G5, N.C6, N.E6, N.G6].forEach((f, i) => tone({ freq: f, at: i * 0.07, dur: 0.25, gain: 0.35 }))
    ;[N.C6, N.E6, N.G6].forEach((f) => tone({ freq: f, at: 0.48, dur: 0.9, gain: 0.25 }))
    tone({ freq: N.C5 / 2, at: 0.48, dur: 0.9, type: 'sine', gain: 0.3 })
  },
  achievement: () => {
    ;[N.G6, N.C7, N.E6, N.G6, N.C7].forEach((f, i) => tone({ freq: f, at: i * 0.05, dur: 0.18, type: 'sine', gain: 0.18 }))
  },
  sent: () => {
    whoosh(0, 0.4)
    tone({ freq: N.E6, at: 0.32, dur: 0.4, gain: 0.35 })
    tone({ freq: N.A5 * 2, at: 0.42, dur: 0.5, type: 'sine', gain: 0.2 })
  },
  xpTick: () => tone({ freq: 1760, dur: 0.03, type: 'square', gain: 0.04 }),
}

export type SoundName = keyof typeof SOUNDS

export function play(name: SoundName, arg?: number) {
  if (muted) return
  try {
    ;(SOUNDS[name] as (a?: number) => void)(arg)
  } catch {
    /* audio unavailable */
  }
}
