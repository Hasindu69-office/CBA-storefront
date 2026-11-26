"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { LAUNCH_STATUS_POLL_MS } from "@lib/launch/config"
import {
  armLaunchAudio,
  playCountdownBeep,
  playFinalCommit,
  playLaunchTrigger,
  playStepDone,
  playStepStart,
} from "./launch-audio"
import { captureLaunchKeyFromSearch, readLaunchKey } from "./launch-key"

import "./launch-ceremony.css"

const REDIRECT_DELAY_MS = 5000
const STEP_COUNT = 6

const DEPLOY_STEPS = [
  {
    title: "Edge & Compute Provisioning",
    detail: "Production containers & load balancer healthy",
    logs: [
      "Provisioning production containers...",
      "Load balancer health check: 200 OK. ✓",
    ],
    duration: 1500,
  },
  {
    title: "Application Build Verification",
    detail: "Storefront bundle & API routes verified",
    logs: [
      "Verifying production build manifest...",
      "SSR & API routes verified. ✓",
    ],
    duration: 1700,
  },
  {
    title: "Database & Cache Sync",
    detail: "Primary PostgreSQL & Redis cluster connected",
    logs: [
      "Connecting PostgreSQL primary & replica...",
      "Redis session cache synced. ✓",
    ],
    duration: 1600,
  },
  {
    title: "TLS 1.3 & WAF Activation",
    detail: "HTTPS certificates & firewall rules active",
    logs: [
      "Verifying TLS 1.3 certificate chain...",
      "WAF & rate-limiting rules active. ✓",
    ],
    duration: 1500,
  },
  {
    title: "Synthetic Health Checks",
    detail: "HTTP 200 OK · Edge cache primed",
    logs: [
      "Running synthetic endpoint checks...",
      "CDN edge cache primed (11ms). ✓",
    ],
    duration: 1600,
  },
  {
    title: "DNS Cutover & Go-Live",
    detail: "Routing live traffic to www.cbaebiz.com",
    logs: [
      "Updating DNS records for cbaebiz.com...",
      "Live traffic cutover complete. ✓",
    ],
    duration: 1400,
  },
] as const

type Phase = "standby" | "countdown" | "deploy" | "reveal"
type StepState = "idle" | "active" | "done"
type LogEntry = { id: number; ts: string; msg: string; type: "info" | "ok" }

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

function pad2(value: number) {
  return String(value).padStart(2, "0")
}

function formatClock(date: Date) {
  const dateStr = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}`
  const timeStr = `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(
    date.getSeconds()
  )}`
  return `${dateStr} ${timeStr}`
}

function formatLogTs(date: Date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(
    date.getSeconds()
  )}`
}

function useNetworkCanvas(active: boolean) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    type Node = {
      x: number
      y: number
      vx: number
      vy: number
      r: number
      accent: boolean
    }
    type Speck = {
      x: number
      y: number
      vx: number
      vy: number
      r: number
      a: number
      phase: number
      orange: boolean
    }
    type Pulse = { a: Node; b: Node; t: number; speed: number }

    let nodes: Node[] = []
    let specks: Speck[] = []
    let pulses: Pulse[] = []
    let frame = 0
    let raf = 0
    const maxDist = 165

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      const count = Math.min(
        68,
        Math.floor((canvas.width * canvas.height) / 22000)
      )
      nodes = []
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.36,
          vy: (Math.random() - 0.5) * 0.36,
          r: Math.random() * 1.5 + 1.0,
          accent: i % 5 === 0,
        })
      }

      const speckCount = Math.min(
        140,
        Math.floor((canvas.width * canvas.height) / 11000)
      )
      specks = []
      for (let i = 0; i < speckCount; i++) {
        specks.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.16,
          vy: -0.08 - Math.random() * 0.18,
          r: Math.random() * 1.1 + 0.3,
          a: Math.random() * 0.35 + 0.08,
          phase: Math.random() * Math.PI * 2,
          orange: i % 11 === 0,
        })
      }
      pulses = []
    }

    const draw = () => {
      frame += 1
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const grad = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        20,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height) * 0.48
      )
      grad.addColorStop(0, "rgba(243, 107, 36, 0.055)")
      grad.addColorStop(1, "rgba(6, 8, 12, 0)")
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (const sp of specks) {
        sp.x += sp.vx
        sp.y += sp.vy
        if (sp.y < -4) sp.y = canvas.height + 4
        if (sp.x < -4) sp.x = canvas.width + 4
        if (sp.x > canvas.width + 4) sp.x = -4

        const twinkle = 0.65 + 0.35 * Math.sin(frame * 0.025 + sp.phase)
        ctx.beginPath()
        ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2)
        ctx.fillStyle = sp.orange
          ? `rgba(243, 107, 36, ${sp.a * twinkle})`
          : `rgba(203, 213, 225, ${sp.a * twinkle})`
        ctx.fill()
      }

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        a.x += a.vx
        a.y += a.vy
        if (a.x < 0 || a.x > canvas.width) a.vx *= -1
        if (a.y < 0 || a.y > canvas.height) a.vy *= -1

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.hypot(dx, dy)
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.17
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle =
              a.accent || b.accent
                ? `rgba(243, 107, 36, ${alpha * 1.25})`
                : `rgba(148, 163, 184, ${alpha})`
            ctx.lineWidth = 1
            ctx.stroke()

            if (pulses.length < 10 && Math.random() < 0.0004) {
              pulses.push({
                a,
                b,
                t: 0,
                speed: 0.015 + Math.random() * 0.015,
              })
            }
          }
        }
      }

      for (let p = pulses.length - 1; p >= 0; p--) {
        const pk = pulses[p]
        pk.t += pk.speed
        if (pk.t >= 1) {
          pulses.splice(p, 1)
          continue
        }
        const px = pk.a.x + (pk.b.x - pk.a.x) * pk.t
        const py = pk.a.y + (pk.b.y - pk.a.y) * pk.t
        ctx.beginPath()
        ctx.arc(px, py, 2, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(243, 107, 36, 0.75)"
        ctx.fill()
      }

      for (const nd of nodes) {
        ctx.beginPath()
        ctx.arc(nd.x, nd.y, nd.r, 0, Math.PI * 2)
        ctx.fillStyle = nd.accent
          ? "rgba(243, 107, 36, 0.55)"
          : "rgba(148, 163, 184, 0.34)"
        ctx.fill()
      }

      raf = window.requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener("resize", resize)
    raf = window.requestAnimationFrame(draw)

    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [active])

  return canvasRef
}

export function LaunchCeremony() {
  const [statusMessage, setStatusMessage] = useState("")
  const [phase, setPhase] = useState<Phase>("standby")
  const [clock, setClock] = useState("--/--/-- --:--:--")
  const [specPing, setSpecPing] = useState("11 ms")
  const [specRate, setSpecRate] = useState("1.42 GB/s")

  const [countdownNum, setCountdownNum] = useState(5)
  const [countdownProgress, setCountdownProgress] = useState(0)

  const [stepStates, setStepStates] = useState<StepState[]>(() =>
    Array.from({ length: STEP_COUNT }, () => "idle")
  )
  const [deployMsg, setDeployMsg] = useState("Starting release pipeline")
  const [deployComplete, setDeployComplete] = useState(false)
  const [deployCount, setDeployCount] = useState("0 / 6")
  const [deployBar, setDeployBar] = useState(0)
  const [logs, setLogs] = useState<LogEntry[]>([])

  const launchedRef = useRef(false)
  const testModeRef = useRef(false)
  const sequenceIdRef = useRef(0)
  const logIdRef = useRef(0)
  const canvasRef = useNetworkCanvas(true)

  const pushLog = useCallback((msg: string, type: "info" | "ok" = "info") => {
    const entry: LogEntry = {
      id: ++logIdRef.current,
      ts: formatLogTs(new Date()),
      msg,
      type,
    }
    setLogs((prev) => [...prev.slice(-10), entry])
  }, [])

  useEffect(() => {
    captureLaunchKeyFromSearch(window.location.search)
    setClock(formatClock(new Date()))

    let cancelled = false

    const boot = async () => {
      try {
        const status = await fetchLaunchStatus()
        if (cancelled) return
        if (status?.gate_enabled === false || status?.launched) {
          goToStorefrontHome()
        }
      } catch {
        /* stay on launch */
      }
    }
    void boot()

    const clockTimer = window.setInterval(() => {
      setClock(formatClock(new Date()))
    }, 1000)

    const specTimer = window.setInterval(() => {
      setSpecPing(`${9 + Math.floor(Math.random() * 5)} ms`)
      setSpecRate(`${(1.38 + Math.random() * 0.14).toFixed(2)} GB/s`)
    }, 2200)

    const poll = window.setInterval(async () => {
      if (launchedRef.current || testModeRef.current) return
      try {
        const status = await fetchLaunchStatus()
        if (status?.launched || status?.gate_enabled === false) {
          goToStorefrontHome()
        }
      } catch {
        /* ignore */
      }
    }, LAUNCH_STATUS_POLL_MS)

    return () => {
      cancelled = true
      window.clearInterval(clockTimer)
      window.clearInterval(specTimer)
      window.clearInterval(poll)
    }
  }, [])

  const resetUi = useCallback(() => {
    sequenceIdRef.current += 1
    launchedRef.current = false
    testModeRef.current = false
    setPhase("standby")
    setStatusMessage("")
    setCountdownNum(5)
    setCountdownProgress(0)
    setStepStates(Array.from({ length: STEP_COUNT }, () => "idle"))
    setDeployMsg("Starting release pipeline")
    setDeployComplete(false)
    setDeployCount("0 / 6")
    setDeployBar(0)
    setLogs([])
  }, [])

  const runCountdown = useCallback(async (sequenceId: number) => {
    setPhase("countdown")
    setCountdownNum(5)
    setCountdownProgress(0)
    await wait(250)

    for (const n of [5, 4, 3, 2, 1]) {
      if (sequenceIdRef.current !== sequenceId) return
      setCountdownProgress(((5 - n) / 5) * 100)
      setCountdownNum(n)
      playCountdownBeep(n)
      await wait(1000)
    }

    if (sequenceIdRef.current !== sequenceId) return
    setCountdownNum(0)
    setCountdownProgress(100)
    playCountdownBeep(0)
    await wait(650)
  }, [])

  const runDeploy = useCallback(
    async (sequenceId: number) => {
      setPhase("deploy")
      setStepStates(Array.from({ length: STEP_COUNT }, () => "idle"))
      setDeployMsg("Starting release pipeline")
      setDeployComplete(false)
      setDeployCount("0 / 6")
      setDeployBar(0)
      setLogs([])
      await wait(250)
      if (sequenceIdRef.current !== sequenceId) return
      pushLog("Release pipeline started.", "info")

      for (let idx = 0; idx < DEPLOY_STEPS.length; idx++) {
        if (sequenceIdRef.current !== sequenceId) return
        const step = DEPLOY_STEPS[idx]

        setStepStates((prev) =>
          prev.map((state, i) => (i === idx ? "active" : state))
        )
        playStepStart()
        setDeployMsg(step.title)
        setDeployCount(`${idx} / ${STEP_COUNT}`)
        setDeployBar((idx / STEP_COUNT) * 100)

        const logTimers: number[] = []
        step.logs.forEach((msg, li) => {
          const timer = window.setTimeout(() => {
            if (sequenceIdRef.current !== sequenceId) return
            pushLog(msg, li === step.logs.length - 1 ? "ok" : "info")
          }, step.duration * (0.25 + li * 0.45))
          logTimers.push(timer)
        })

        await wait(step.duration)
        for (const timer of logTimers) window.clearTimeout(timer)
        if (sequenceIdRef.current !== sequenceId) return

        setStepStates((prev) =>
          prev.map((state, i) => (i === idx ? "done" : state))
        )
        setDeployBar(((idx + 1) / STEP_COUNT) * 100)
        setDeployCount(`${idx + 1} / ${STEP_COUNT}`)

        if (idx === STEP_COUNT - 1) {
          playFinalCommit()
          setDeployMsg("Launch complete. Opening www.cbaebiz.com...")
          setDeployComplete(true)
          pushLog("www.cbaebiz.com is live.", "ok")
          await wait(900)
        } else {
          playStepDone()
        }
      }
    },
    [pushLog]
  )

  const runCeremony = useCallback(
    async (asTest: boolean) => {
      if (launchedRef.current) return

      const secret = readLaunchKey()
      testModeRef.current = asTest

      if (!asTest) {
        if (!secret) {
          setStatusMessage(
            "Launch authorization failed. Error code: LAUNCH_AUTH_401"
          )
          return
        }
        try {
          setStatusMessage("Authorizing…")
          await unlockLaunch(secret)
          setStatusMessage("")
        } catch {
          setStatusMessage(
            "Launch authorization failed. Error code: LAUNCH_AUTH_403"
          )
          return
        }
      } else {
        setStatusMessage("Test mode — animation only. The shop stays locked.")
      }

      launchedRef.current = true
      const sequenceId = ++sequenceIdRef.current

      await armLaunchAudio()
      playLaunchTrigger()

      await runCountdown(sequenceId)
      if (sequenceIdRef.current !== sequenceId) return

      await runDeploy(sequenceId)
      if (sequenceIdRef.current !== sequenceId) return

      setPhase("reveal")
      await wait(350)

      if (asTest) {
        setStatusMessage("Test mode complete — press R to reset.")
        return
      }

      await wait(REDIRECT_DELAY_MS)
      if (sequenceIdRef.current !== sequenceId) return
      goToStorefrontHome()
    },
    [runCountdown, runDeploy]
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
      <canvas ref={canvasRef} className="launch-bg-canvas" aria-hidden />

      <div
        className={`launch-standby${
          phase === "standby" ? "" : " is-hidden"
        }`}
      >
        <header className="launch-header-rail">
          <div className="launch-header-left">
            <img
              className="launch-cba-logo"
              src="/launch/cba-logo.png"
              alt="CBA"
            />
            <span className="launch-header-entity">
              Ceylon Business Appliances (Pvt) Ltd.
            </span>
          </div>
          <div />
          <div className="launch-header-right">
            <span>{clock}</span>
          </div>
        </header>

        <main className="launch-stage">
          <div className="launch-stage-specs is-left" aria-hidden>
            <div className="launch-spec-entry">
              <span className="launch-spec-label">Infrastructure</span>
              <span className="launch-spec-val">
                <span className="launch-spec-pulse" />
                Multi-Zone HA
              </span>
            </div>
            <div className="launch-spec-entry">
              <span className="launch-spec-label">Edge Network</span>
              <span className="launch-spec-val">CDN Primed</span>
            </div>
            <div className="launch-spec-entry">
              <span className="launch-spec-label">Latency</span>
              <span className="launch-spec-val">{specPing}</span>
            </div>
          </div>

          <div className="launch-stage-specs is-right" aria-hidden>
            <div className="launch-spec-entry">
              <span className="launch-spec-label">Transport</span>
              <span className="launch-spec-val">HTTP/3 · TLS 1.3</span>
            </div>
            <div className="launch-spec-entry">
              <span className="launch-spec-label">Availability</span>
              <span className="launch-spec-val">99.99% SLA</span>
            </div>
            <div className="launch-spec-entry">
              <span className="launch-spec-label">Throughput</span>
              <span className="launch-spec-val">{specRate}</span>
            </div>
          </div>

          <div className="launch-centre-block">
            <div className="launch-event-designation">
              Official Website Launch
            </div>

            <div className="launch-ebiz-logo-wrap">
              <img
                src="/launch/ebiz-logo.png"
                alt="EBiz by Ceylon Business Appliances (Pvt) Ltd."
              />
            </div>

            <div className="launch-sys-status-inline">
              <div className="launch-sys-item">
                <span className="launch-cell-ok">●</span> Production Cluster
              </div>
              <div className="launch-sys-item">
                <span className="launch-cell-ok">●</span> TLS 1.3 Active
              </div>
            </div>

            <button
              type="button"
              className="launch-btn"
              disabled={busy}
              onClick={() => void runCeremony(false)}
            >
              Launch
            </button>

            <div className="launch-interact-hint">
              Press <kbd>Space</kbd> or Click to Launch
            </div>

            {statusMessage ? (
              <p className="launch-message" role="status">
                {statusMessage}
              </p>
            ) : null}
          </div>
        </main>

        <footer className="launch-footer-rail">
          <div className="launch-footer-left">
            <div className="launch-hk-item">
              <kbd>F</kbd> Fullscreen
            </div>
            <div className="launch-hk-item">
              <kbd>Space</kbd> Launch
            </div>
          </div>
          <div className="launch-footer-right">EBiz Production Release</div>
        </footer>
      </div>

      <div
        className={`launch-cd-overlay${
          phase === "countdown" ? " is-active" : ""
        }`}
        aria-hidden={phase !== "countdown"}
      >
        <div className="launch-cd-number">{countdownNum}</div>
        <div
          className="launch-cd-progress"
          style={{ width: `${countdownProgress}%` }}
        />
      </div>

      <div
        className={`launch-deploy-overlay${
          phase === "deploy" ? " is-active" : ""
        }`}
        aria-hidden={phase !== "deploy"}
      >
        <div className="launch-deploy-card">
          <div className="launch-deploy-header">
            <div className="launch-deploy-header-title">
              EBiz Production Release
            </div>
            <div className="launch-deploy-header-target">www.cbaebiz.com</div>
          </div>

          <div className="launch-deploy-body">
            <div className="launch-steps-panel">
              {DEPLOY_STEPS.map((step, index) => (
                <div
                  key={step.title}
                  className={`launch-step-row${
                    stepStates[index] === "active" ? " is-active" : ""
                  }${stepStates[index] === "done" ? " is-done" : ""}`}
                >
                  <div className="launch-step-index">0{index + 1}</div>
                  <div className="launch-step-content">
                    <div className="launch-step-title">{step.title}</div>
                    <div className="launch-step-detail">{step.detail}</div>
                  </div>
                  <div className="launch-step-status">
                    <div className="launch-step-spinner" />
                    <div className="launch-step-check">✓</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="launch-telem-panel">
              <div className="launch-telem-title">Release Log</div>
              <div className="launch-telem-log">
                {logs.map((entry) => (
                  <div
                    key={entry.id}
                    className={`launch-log-line is-${entry.type}`}
                  >
                    <span className="launch-log-ts">{entry.ts}</span>
                    <span className="launch-log-msg">{entry.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="launch-deploy-footer">
            <div
              className="launch-deploy-progress-track"
              style={{ width: `${deployBar}%` }}
            />
            <div
              className={`launch-deploy-footer-left${
                deployComplete ? " is-complete" : ""
              }`}
            >
              {deployMsg}
            </div>
            <div className="launch-deploy-footer-right">
              Step <span className="launch-deploy-count">{deployCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`launch-reveal-overlay${
          phase === "reveal" ? " is-active" : ""
        }`}
        aria-hidden={phase !== "reveal"}
      >
        <div className="launch-reveal-content">
          <div className="launch-reveal-logo">
            <img
              src="/launch/ebiz-logo.png"
              alt="EBiz by Ceylon Business Appliances (Pvt) Ltd."
            />
          </div>
          <div className="launch-reveal-status">
            <div className="launch-reveal-status-dot" />
            Website is Now Live
          </div>
          <div className="launch-reveal-redirect">
            Opening www.cbaebiz.com...
          </div>
        </div>
      </div>
    </div>
  )
}
