"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { LAUNCH_STATUS_POLL_MS } from "@lib/launch/config"
import {
  armLaunchAudio,
  playCinematicBoom,
  playCountTick,
  playRevealHarmonics,
  playStepDone,
  playSystemCharge,
} from "./launch-audio"
import {
  captureLaunchKeyFromSearch,
  readLaunchKey,
} from "./launch-key"

import "./launch-ceremony.css"

const REDIRECT_DELAY_MS = 4200

const PROGRESS_STEPS = [
  {
    title: "Provisioning live infrastructure",
    detail: "Edge nodes and storefront services coming online.",
    durationMs: 1700,
  },
  {
    title: "Loading commerce engine",
    detail: "Catalog, pricing, and merchandising synchronized.",
    durationMs: 1800,
  },
  {
    title: "Arming secure checkout",
    detail: "Payments, sessions, and order flows verified.",
    durationMs: 1700,
  },
  {
    title: "Opening public access",
    detail: "Routing live traffic to the EBiz storefront.",
    durationMs: 1500,
  },
] as const

type Phase = "standby" | "countdown" | "progress" | "reveal"
type StatusResponse = {
  success?: boolean
  data?: { launched?: boolean; gate_enabled?: boolean }
}

function goToStorefrontHome() {
  window.location.assign(`/?opened=${Date.now()}`)
}

async function fetchLaunchStatus(): Promise<StatusResponse["data"]> {
  const response = await fetch("/api/launch/status", { cache: "no-store" })
  const json = (await response.json()) as StatusResponse
  return json.data
}

async function unlockLaunch(secret: string) {
  const response = await fetch("/api/launch/unlock", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-launch-secret": secret,
    },
    body: JSON.stringify({ secret }),
    cache: "no-store",
  })
  const json = (await response.json()) as StatusResponse & { error?: string }
  if (!response.ok || json.success === false) {
    throw new Error(json.error || "Unlock failed.")
  }
  return json.data
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export function LaunchCeremony() {
  const [armed, setArmed] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")
  const [phase, setPhase] = useState<Phase>("standby")
  const [countdown, setCountdown] = useState(3)
  const [activeStep, setActiveStep] = useState(-1)
  const [completedSteps, setCompletedSteps] = useState(0)
  const [revealShown, setRevealShown] = useState({
    eyebrow: false,
    logo: false,
    title: false,
    badge: false,
    note: false,
  })

  const launchedRef = useRef(false)
  const testModeRef = useRef(false)
  const sequenceIdRef = useRef(0)

  const progressPercent = useMemo(() => {
    if (phase !== "progress" && phase !== "reveal") return 0
    return Math.round((completedSteps / PROGRESS_STEPS.length) * 100)
  }, [completedSteps, phase])

  useEffect(() => {
    captureLaunchKeyFromSearch(window.location.search)
    setArmed(Boolean(readLaunchKey()))

    let cancelled = false

    const boot = async () => {
      try {
        const status = await fetchLaunchStatus()
        if (cancelled) return
        if (status?.gate_enabled === false || status?.launched) {
          goToStorefrontHome()
        }
      } catch {
        /* stay on ceremony if status temporarily fails */
      }
    }
    void boot()

    const poll = window.setInterval(async () => {
      if (launchedRef.current || testModeRef.current) return
      try {
        const status = await fetchLaunchStatus()
        if (status?.launched || status?.gate_enabled === false) {
          goToStorefrontHome()
        }
      } catch {
        /* ignore poll errors */
      }
    }, LAUNCH_STATUS_POLL_MS)

    return () => {
      cancelled = true
      window.clearInterval(poll)
    }
  }, [])

  const resetUi = useCallback(() => {
    sequenceIdRef.current += 1
    launchedRef.current = false
    testModeRef.current = false
    setPhase("standby")
    setCountdown(3)
    setActiveStep(-1)
    setCompletedSteps(0)
    setRevealShown({
      eyebrow: false,
      logo: false,
      title: false,
      badge: false,
      note: false,
    })
    setStatusMessage("")
    setArmed(Boolean(readLaunchKey()))
  }, [])

  const runCeremony = useCallback(
    async (asTest: boolean) => {
      if (launchedRef.current) return

      const secret = readLaunchKey()
      testModeRef.current = asTest

      if (!asTest) {
        if (!secret) {
          setStatusMessage(
            "Official launch key required. Open /launch?launch_key=YOUR_SECRET on the ceremony laptop."
          )
          return
        }
        try {
          setStatusMessage("Authorizing launch…")
          await unlockLaunch(secret)
          setStatusMessage("")
        } catch (error) {
          setStatusMessage(
            error instanceof Error ? error.message : "Unlock failed."
          )
          return
        }
      } else {
        setStatusMessage("Test mode — animation only. The shop stays locked.")
      }

      launchedRef.current = true
      const sequenceId = ++sequenceIdRef.current

      await armLaunchAudio()
      playSystemCharge()

      setPhase("countdown")
      for (const value of [3, 2, 1]) {
        if (sequenceIdRef.current !== sequenceId) return
        setCountdown(value)
        playCountTick()
        await wait(900)
      }

      if (sequenceIdRef.current !== sequenceId) return
      setPhase("progress")
      setActiveStep(-1)
      setCompletedSteps(0)

      for (let index = 0; index < PROGRESS_STEPS.length; index++) {
        if (sequenceIdRef.current !== sequenceId) return
        setActiveStep(index)
        await wait(PROGRESS_STEPS[index].durationMs)
        setCompletedSteps(index + 1)
        playStepDone()
      }

      if (sequenceIdRef.current !== sequenceId) return
      setPhase("reveal")
      playCinematicBoom()
      setRevealShown({
        eyebrow: false,
        logo: false,
        title: false,
        badge: false,
        note: false,
      })
      await wait(200)
      playRevealHarmonics()
      setRevealShown((prev) => ({ ...prev, eyebrow: true }))
      await wait(220)
      setRevealShown((prev) => ({ ...prev, logo: true }))
      await wait(260)
      setRevealShown((prev) => ({ ...prev, title: true }))
      await wait(280)
      setRevealShown((prev) => ({ ...prev, badge: true }))
      await wait(320)
      setRevealShown((prev) => ({ ...prev, note: true }))

      if (asTest) {
        setStatusMessage("Test mode complete — press R to reset.")
        return
      }

      await wait(REDIRECT_DELAY_MS)
      if (sequenceIdRef.current !== sequenceId) return
      goToStorefrontHome()
    },
    []
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if (key === " ") {
        event.preventDefault()
        void runCeremony(false)
      } else if (key === "f") {
        if (!document.fullscreenElement) {
          void document.documentElement.requestFullscreen().catch(() => undefined)
        } else {
          void document.exitFullscreen()
        }
      } else if (key === "r") {
        resetUi()
      } else if (key === "t") {
        void runCeremony(true)
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [resetUi, runCeremony])

  const busy = phase !== "standby"

  return (
    <div className="launch-ceremony-root">
      <div className="launch-ambient" aria-hidden />

      <div className="launch-shell">
        <header className="launch-topbar">
          <div className="launch-brand-row">
            <img src="/launch/cba-badge.png" alt="CBA" />
            <span className="launch-brand-name">Ceylon Business Appliances</span>
          </div>
          <div className="launch-status-chip">
            <span className="launch-status-dot" aria-hidden />
            {phase === "standby" ? "Standby for launch" : "Launch sequence active"}
          </div>
        </header>

        <main className="launch-main">
          <p className="launch-eyebrow">
            Official platform unveiling // Live commerce
          </p>

          <div className="launch-logo-wrap">
            <div className="launch-logo-glow" aria-hidden />
            <img
              className="launch-logo"
              src="/launch/ebiz-logo-dark.png"
              alt="EBiz"
            />
          </div>

          <h1 className="launch-title">Initiate the EBiz launch</h1>
          <p className="launch-subtitle">
            Next-generation commerce for Ceylon Business Appliances — built for
            high-volume corporate buying across Sri Lanka.
          </p>

          <div className="launch-cta-wrap">
            <button
              type="button"
              className="launch-cta"
              disabled={busy}
              onClick={() => void runCeremony(false)}
            >
              <span className="launch-cta-core" aria-hidden />
              Initiate official launch
            </button>

            <div className="launch-meta">
              <span>
                Safety:{" "}
                <strong>{armed ? "Launch key armed" : "Awaiting launch key"}</strong>
              </span>
              <span aria-hidden>·</span>
              <span>Press Space or click</span>
            </div>

            {statusMessage ? (
              <p className="launch-message" role="status">
                {statusMessage}
              </p>
            ) : null}
          </div>
        </main>

        <div className="launch-hotkeys" aria-hidden={busy}>
          <span>
            <kbd>F</kbd> Fullscreen
          </span>
          <span>
            <kbd>Space</kbd> Launch
          </span>
          <span>
            <kbd>R</kbd> Reset
          </span>
          <span>
            <kbd>T</kbd> Test
          </span>
        </div>
      </div>

      <div
        className={`launch-overlay${phase === "countdown" ? " is-active" : ""}`}
        aria-hidden={phase !== "countdown"}
      >
        <div className="launch-countdown-card">
          <p className="launch-countdown-label">System launch sequence</p>
          <p className="launch-countdown-num" key={countdown}>
            {countdown}
          </p>
          <p className="launch-countdown-copy">Transferring to production</p>
        </div>
      </div>

      <div
        className={`launch-overlay${phase === "progress" ? " is-active" : ""}`}
        aria-hidden={phase !== "progress"}
      >
        <div className="launch-progress-card">
          <h2 className="launch-progress-heading">Production cutover</h2>
          <p className="launch-progress-sub">
            Final checks before EBiz goes live for every visitor.
          </p>

          {PROGRESS_STEPS.map((step, index) => {
            const isDone = completedSteps > index
            const isActive = activeStep === index && !isDone
            return (
              <div
                key={step.title}
                className={`launch-step${isActive ? " is-active" : ""}${
                  isDone ? " is-done" : ""
                }`}
              >
                <div className="launch-step-mark">
                  {isDone ? "✓" : index + 1}
                </div>
                <div>
                  <p className="launch-step-title">{step.title}</p>
                  <p className="launch-step-detail">{step.detail}</p>
                </div>
                <div className="launch-step-time">
                  {(step.durationMs / 1000).toFixed(1)}s
                </div>
              </div>
            )
          })}

          <div className="launch-progress-bar" aria-hidden>
            <span style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      <div
        className={`launch-overlay${phase === "reveal" ? " is-active" : ""}`}
        aria-hidden={phase !== "reveal"}
      >
        <div className="launch-reveal-card">
          <p
            className={`launch-reveal-eyebrow${
              revealShown.eyebrow ? " is-shown" : ""
            }`}
          >
            Deployment successful // Now live
          </p>
          <img
            className={`launch-reveal-logo${revealShown.logo ? " is-shown" : ""}`}
            src="/launch/ebiz-logo-dark.png"
            alt="EBiz"
          />
          <p
            className={`launch-reveal-title${
              revealShown.title ? " is-shown" : ""
            }`}
          >
            Ceylon Business Appliances Pvt Ltd
          </p>
          <div
            className={`launch-reveal-badge${
              revealShown.badge ? " is-shown" : ""
            }`}
          >
            <span className="launch-reveal-badge-dot" aria-hidden />
            Platform officially live
          </div>
          <p
            className={`launch-reveal-note${
              revealShown.note ? " is-shown" : ""
            }`}
          >
            Opening EBiz storefront…
          </p>
        </div>
      </div>
    </div>
  )
}
