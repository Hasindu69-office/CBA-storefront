"use client"

type BrowserWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext
  }

let audioCtx: AudioContext | null = null

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

/** Resume after a user gesture so browsers allow playback. */
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
  vol = 0.12,
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
    /* ignore audio errors */
  }
}

export function playSystemCharge() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(80, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(340, ctx.currentTime + 1.4)
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 1.4)
  } catch {
    /* ignore */
  }
}

export function playCountTick() {
  playTone(440, 0.22, "triangle", 0.14)
  playTone(880, 0.14, "sine", 0.08)
}

export function playStepDone() {
  playTone(1046.5, 0.09, "sine", 0.07)
}

export function playCinematicBoom() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(100, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(22, ctx.currentTime + 1.5)
    gain.gain.setValueAtTime(0.45, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 1.5)
    playTone(587.33, 2.0, "triangle", 0.08)
    playTone(880, 2.2, "sine", 0.05)
  } catch {
    /* ignore */
  }
}

export function playRevealHarmonics() {
  ;[220, 330, 440, 660, 880].forEach((freq, index) => {
    window.setTimeout(() => playTone(freq, 2.0, "sine", 0.07), index * 130)
  })
}
