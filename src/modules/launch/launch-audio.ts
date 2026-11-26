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
  vol = 0.05,
  type: OscillatorType = "sine",
  delay = 0
) {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const t = ctx.currentTime + delay
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(vol, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + dur + 0.02)
  } catch {
    /* ignore */
  }
}

export function playLaunchTrigger() {
  playTone(1320, 0.045, 0.045, "triangle", 0)
  playTone(165, 0.18, 0.08, "sine", 0.02)
  playTone(261.63, 0.35, 0.04, "sine", 0.05)
}

export function playCountdownBeep(n: number) {
  if (n > 0) {
    playTone(880, 0.11, 0.065, "sine", 0)
    playTone(1760, 0.06, 0.018, "sine", 0)
  } else {
    playTone(110, 0.45, 0.12, "sine", 0)
    playTone(440, 0.28, 0.07, "sine", 0)
    playTone(659.25, 0.32, 0.04, "sine", 0.03)
  }
}

export function playStepStart() {
  playTone(540, 0.03, 0.02, "sine", 0)
}

export function playStepDone() {
  playTone(740, 0.045, 0.03, "sine", 0)
  playTone(987.77, 0.06, 0.025, "sine", 0.045)
}

export function playFinalCommit() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime

    playTone(1200, 0.025, 0.04, "triangle", 0)
    playTone(240, 0.08, 0.07, "sine", 0.01)

    const sub = ctx.createOscillator()
    const subGain = ctx.createGain()
    sub.type = "sine"
    sub.frequency.setValueAtTime(64, now)
    sub.frequency.exponentialRampToValueAtTime(34, now + 0.9)
    subGain.gain.setValueAtTime(0, now)
    subGain.gain.linearRampToValueAtTime(0.24, now + 0.025)
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6)
    sub.connect(subGain).connect(ctx.destination)
    sub.start(now)
    sub.stop(now + 1.65)

    playTone(55.0, 1.8, 0.14, "sine", 0.02)
    playTone(110.0, 1.5, 0.075, "sine", 0.03)
    playTone(164.81, 1.3, 0.045, "sine", 0.05)
  } catch {
    /* ignore */
  }
}
