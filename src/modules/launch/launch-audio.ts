"use client"

type BrowserWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext
  }

let audioCtx: AudioContext | null = null
let musicMaster: GainNode | null = null
let musicNodes: AudioNode[] = []
let musicTimers: number[] = []
let musicPlaying = false

function getAudioContext() {
  if (typeof window === "undefined") return null
  if (!audioCtx) {
    const BrowserAudio =
      window.AudioContext || (window as BrowserWindow).webkitAudioContext
    if (!BrowserAudio) return null
    audioCtx = new BrowserAudio()
  }
  return audioCtx
}

export async function armLaunchAudio() {
  const ctx = getAudioContext()
  if (!ctx) return
  if (ctx.state === "suspended") {
    try {
      await ctx.resume()
    } catch {
      /* ignore */
    }
  }
}

function playTone(
  freq: number,
  dur: number,
  type: OscillatorType = "sine",
  vol = 0.08,
  ramp: number | null = null
) {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    if (ramp) {
      osc.frequency.exponentialRampToValueAtTime(ramp, ctx.currentTime + dur)
    }
    gain.gain.setValueAtTime(vol, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + dur)
  } catch {
    /* ignore */
  }
}

export function playSystemCharge() {
  playTone(90, 1.3, "sine", 0.07, 280)
  playTone(180, 1.1, "triangle", 0.03, 360)
}

export function playCountTick() {
  playTone(660, 0.18, "sine", 0.07)
  playTone(990, 0.1, "triangle", 0.04)
}

export function playStepDone() {
  playTone(740, 0.14, "sine", 0.05)
}

/** Soft ember catch — used once when the spark first appears. */
export function playIgnitePulse() {
  playTone(180, 0.35, "sine", 0.045, 320)
  playTone(420, 0.22, "triangle", 0.03)
  window.setTimeout(() => playTone(880, 0.12, "sine", 0.025), 90)
}

/**
 * Word strike for Power / Precision / Presence.
 * Crisp, rising chimes that match the on-screen reveals.
 */
export function playSparkWord(index = 0) {
  const roots = [392.0, 493.88, 587.33] // G4, B4, D5
  const root = roots[Math.max(0, Math.min(index, roots.length - 1))]
  playTone(root, 0.55, "sine", 0.07)
  playTone(root * 2, 0.38, "triangle", 0.035)
  window.setTimeout(() => playTone(root * 1.5, 0.45, "sine", 0.03), 70)
}

export function playOrbitChime() {
  playTone(523.25, 0.35, "sine", 0.05)
  playTone(659.25, 0.45, "triangle", 0.035)
}

export function playSignatureSwell() {
  ;[261.63, 329.63, 392.0, 523.25].forEach((f, i) => {
    window.setTimeout(() => playTone(f, 1.6, "sine", 0.05), i * 110)
  })
}

export function playPortalWhoosh() {
  playTone(220, 1.2, "sine", 0.1, 880)
  playTone(110, 1.4, "triangle", 0.07, 55)
}

export function playCinematicBoom() {
  playPortalWhoosh()
  playTone(587.33, 1.8, "sine", 0.04)
}

export function playRevealHarmonics() {
  playSignatureSwell()
}

function clearMusicGraph() {
  for (const timer of musicTimers) {
    window.clearInterval(timer)
  }
  musicTimers = []
  for (const node of musicNodes) {
    try {
      node.disconnect()
    } catch {
      /* ignore */
    }
  }
  musicNodes = []
  musicMaster = null
  musicPlaying = false
}

export async function startLaunchMusic() {
  await armLaunchAudio()
  const ctx = getAudioContext()
  if (!ctx || musicPlaying) return

  try {
    const master = ctx.createGain()
    master.gain.setValueAtTime(0.0001, ctx.currentTime)
    master.gain.exponentialRampToValueAtTime(0.055, ctx.currentTime + 2.4)
    master.connect(ctx.destination)
    musicMaster = master

    const filter = ctx.createBiquadFilter()
    filter.type = "lowpass"
    filter.frequency.setValueAtTime(780, ctx.currentTime)
    filter.Q.setValueAtTime(0.6, ctx.currentTime)
    filter.connect(master)
    musicNodes.push(filter)

    const padChords = [
      [130.81, 164.81, 196.0],
      [146.83, 184.99, 220.0],
      [174.61, 220.0, 261.63],
      [196.0, 246.94, 293.66],
    ]

    const padGain = ctx.createGain()
    padGain.gain.setValueAtTime(0.65, ctx.currentTime)
    padGain.connect(filter)
    musicNodes.push(padGain)

    const activeOsc: OscillatorNode[] = []
    const startChord = (freqs: number[], at: number) => {
      for (const osc of activeOsc) {
        try {
          osc.stop(at)
        } catch {
          /* ignore */
        }
      }
      activeOsc.length = 0
      for (const freq of freqs) {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = "sine"
        osc.frequency.setValueAtTime(freq, at)
        g.gain.setValueAtTime(0.0001, at)
        g.gain.exponentialRampToValueAtTime(0.11, at + 1.6)
        osc.connect(g).connect(padGain)
        osc.start(at)
        activeOsc.push(osc)
        musicNodes.push(osc, g)
      }
    }

    startChord(padChords[0], ctx.currentTime)
    let chordIndex = 0
    const chordTimer = window.setInterval(() => {
      if (!musicPlaying || !audioCtx) return
      chordIndex = (chordIndex + 1) % padChords.length
      startChord(padChords[chordIndex], audioCtx.currentTime)
    }, 5800)
    musicTimers.push(chordTimer)

    musicPlaying = true
  } catch {
    clearMusicGraph()
  }
}

export function stopLaunchMusic(fadeMs = 1600) {
  const ctx = getAudioContext()
  if (!ctx || !musicMaster) {
    clearMusicGraph()
    return
  }
  const master = musicMaster
  musicPlaying = false
  try {
    const now = ctx.currentTime
    const current = Math.max(master.gain.value, 0.0001)
    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(current, now)
    master.gain.exponentialRampToValueAtTime(
      0.0001,
      now + Math.max(fadeMs, 50) / 1000
    )
  } catch {
    /* ignore */
  }
  for (const timer of musicTimers) {
    window.clearInterval(timer)
  }
  musicTimers = []
  window.setTimeout(() => {
    try {
      master.disconnect()
    } catch {
      /* ignore */
    }
    if (musicMaster === master) clearMusicGraph()
  }, Math.max(fadeMs, 50) + 80)
}
