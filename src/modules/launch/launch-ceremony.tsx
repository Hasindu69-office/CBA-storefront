"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { LAUNCH_STATUS_POLL_MS } from "@lib/launch/config"
import {
  armLaunchAudio,
  playCinematicBoom,
  playIgnitePulse,
  playSparkWord,
  playOrbitChime,
  playPortalWhoosh,
  playSignatureSwell,
  playSystemCharge,
  startLaunchMusic,
  stopLaunchMusic,
} from "./launch-audio"
import {
  captureLaunchKeyFromSearch,
  readLaunchKey,
} from "./launch-key"

import "./launch-ceremony.css"

const REDIRECT_DELAY_MS = 2100

const SPARK_WORDS = ["Power", "Precision", "Presence"] as const

const STORE_CATEGORIES = [
  {
    name: "Printers",
    note: "Office & production",
  },
  {
    name: "POS",
    note: "Retail ready",
  },
  {
    name: "Security",
    note: "Watch & protect",
  },
  {
    name: "Office",
    note: "Everyday tools",
  },
] as const

type Phase = "standby" | "spark" | "constellation" | "signature" | "portal"

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

  const [emberLit, setEmberLit] = useState(false)
  const [emberGrow, setEmberGrow] = useState(false)
  const [raysOn, setRaysOn] = useState(false)
  const [coronaKey, setCoronaKey] = useState(0)
  const [sparkWord, setSparkWord] = useState("")
  const [sparkWordKey, setSparkWordKey] = useState(0)

  const [assembleReady, setAssembleReady] = useState(false)
  const [assembleIn, setAssembleIn] = useState<boolean[]>(() =>
    STORE_CATEGORIES.map(() => false)
  )
  const [assembleFocus, setAssembleFocus] = useState(-1)
  const [assembleCount, setAssembleCount] = useState(0)

  const [signatureBeam, setSignatureBeam] = useState(false)
  const [signatureLogo, setSignatureLogo] = useState(false)
  const [signatureWord, setSignatureWord] = useState(false)
  const [signatureTag, setSignatureTag] = useState(false)
  const [signatureFlare, setSignatureFlare] = useState(false)

  const [portalShown, setPortalShown] = useState(false)
  const [portalTitle, setPortalTitle] = useState(false)
  const [portalReady, setPortalReady] = useState(false)
  const [portalOpen, setPortalOpen] = useState(false)
  const [portalReveal, setPortalReveal] = useState(false)
  const [portalExit, setPortalExit] = useState(false)

  const launchedRef = useRef(false)
  const testModeRef = useRef(false)
  const sequenceIdRef = useRef(0)

  const dimStandby = phase !== "standby"

  useEffect(() => {
    captureLaunchKeyFromSearch(window.location.search)
    setArmed(Boolean(readLaunchKey()))

    let cancelled = false
    let musicArmed = false

    const boot = async () => {
      try {
        const status = await fetchLaunchStatus()
        if (cancelled) return
        if (status?.gate_enabled === false || status?.launched) {
          goToStorefrontHome()
        }
      } catch {
        /* stay */
      }
    }
    void boot()

    const armAmbientMusic = () => {
      if (musicArmed || cancelled) return
      musicArmed = true
      void startLaunchMusic()
    }

    window.addEventListener("pointerdown", armAmbientMusic, { once: true })
    window.addEventListener("keydown", armAmbientMusic, { once: true })

    const poll = window.setInterval(async () => {
      if (launchedRef.current || testModeRef.current) return
      try {
        const status = await fetchLaunchStatus()
        if (status?.launched || status?.gate_enabled === false) {
          stopLaunchMusic(900)
          goToStorefrontHome()
        }
      } catch {
        /* ignore */
      }
    }, LAUNCH_STATUS_POLL_MS)

    return () => {
      cancelled = true
      window.clearInterval(poll)
      window.removeEventListener("pointerdown", armAmbientMusic)
      window.removeEventListener("keydown", armAmbientMusic)
      stopLaunchMusic(400)
    }
  }, [])

  const resetVisualState = () => {
    setEmberLit(false)
    setEmberGrow(false)
    setRaysOn(false)
    setCoronaKey(0)
    setSparkWord("")
    setSparkWordKey(0)
    setAssembleReady(false)
    setAssembleIn(STORE_CATEGORIES.map(() => false))
    setAssembleFocus(-1)
    setAssembleCount(0)
    setSignatureBeam(false)
    setSignatureLogo(false)
    setSignatureWord(false)
    setSignatureTag(false)
    setSignatureFlare(false)
    setPortalShown(false)
    setPortalTitle(false)
    setPortalReady(false)
    setPortalOpen(false)
    setPortalReveal(false)
    setPortalExit(false)
  }

  const resetUi = useCallback(() => {
    sequenceIdRef.current += 1
    launchedRef.current = false
    testModeRef.current = false
    setPhase("standby")
    resetVisualState()
    setStatusMessage("")
    setArmed(Boolean(readLaunchKey()))
    stopLaunchMusic(200)
    window.setTimeout(() => {
      void startLaunchMusic()
    }, 260)
  }, [])

  const runCeremony = useCallback(async (asTest: boolean) => {
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
        setStatusMessage("Authorizing…")
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
    resetVisualState()

    await armLaunchAudio()
    await startLaunchMusic()
    playSystemCharge()

    // ── Act I: Spark ───────────────────────────────
    setPhase("spark")
    await wait(280)
    setEmberLit(true)
    playIgnitePulse()
    await wait(700)
    setRaysOn(true)
    setEmberGrow(true)

    for (let i = 0; i < SPARK_WORDS.length; i++) {
      if (sequenceIdRef.current !== sequenceId) return
      setEmberLit(false)
      setEmberGrow(false)
      setSparkWord(SPARK_WORDS[i])
      setSparkWordKey((k) => k + 1)
      setCoronaKey((k) => k + 1)
      playSparkWord(i)
      await wait(980)
    }

    await wait(420)

    // ── Act II: Assemble store ─────────────────────
    if (sequenceIdRef.current !== sequenceId) return
    setPhase("constellation")
    await wait(280)
    setAssembleReady(true)
    playOrbitChime()
    await wait(420)

    for (let i = 0; i < STORE_CATEGORIES.length; i++) {
      if (sequenceIdRef.current !== sequenceId) return
      setAssembleIn((prev) => prev.map((v, idx) => (idx === i ? true : v)))
      setAssembleFocus(i)
      setAssembleCount(i + 1)
      playOrbitChime()
      await wait(780)
    }
    setAssembleFocus(-1)
    await wait(700)

    // ── Act III: Signature ─────────────────────────
    if (sequenceIdRef.current !== sequenceId) return
    setPhase("signature")
    setSignatureBeam(true)
    await wait(480)
    playSignatureSwell()
    setSignatureLogo(true)
    await wait(360)
    setSignatureFlare(true)
    await wait(260)
    setSignatureWord(true)
    await wait(220)
    setSignatureTag(true)
    await wait(1500)

    // ── Act IV: Portal → storefront ────────────────
    if (sequenceIdRef.current !== sequenceId) return
    setPhase("portal")
    setPortalShown(true)
    await wait(480)
    setPortalTitle(true)
    await wait(900)
    setPortalReady(true)
    await wait(1100)
    playPortalWhoosh()
    setPortalOpen(true)
    await wait(700)
    setPortalReveal(true)
    await wait(1400)
    playCinematicBoom()

    if (asTest) {
      setStatusMessage("Test mode complete — press R to reset.")
      return
    }

    setPortalExit(true)
    stopLaunchMusic(1000)
    await wait(REDIRECT_DELAY_MS)
    if (sequenceIdRef.current !== sequenceId) return
    goToStorefrontHome()
  }, [])

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
      <div className={`launch-shell${dimStandby ? " is-dimmed" : ""}`}>
        <div className="launch-field" aria-hidden>
          <svg className="launch-field-svg" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
            <g className="launch-field-lines">
              <line x1="80" y1="120" x2="260" y2="210" />
              <line x1="260" y1="210" x2="420" y2="140" />
              <line x1="420" y1="140" x2="560" y2="260" />
              <line x1="560" y1="260" x2="760" y2="180" />
              <line x1="760" y1="180" x2="940" y2="300" />
              <line x1="940" y1="300" x2="1100" y2="220" />
              <line x1="180" y1="420" x2="340" y2="360" />
              <line x1="340" y1="360" x2="520" y2="480" />
              <line x1="520" y1="480" x2="700" y2="400" />
              <line x1="700" y1="400" x2="880" y2="520" />
              <line x1="880" y1="520" x2="1060" y2="440" />
              <line x1="260" y1="210" x2="340" y2="360" />
              <line x1="560" y1="260" x2="520" y2="480" />
              <line x1="760" y1="180" x2="700" y2="400" />
              <line x1="940" y1="300" x2="880" y2="520" />
            </g>
            <g className="launch-field-nodes">
              <circle cx="80" cy="120" r="3.5" />
              <circle cx="260" cy="210" r="4.5" />
              <circle cx="420" cy="140" r="3" />
              <circle cx="560" cy="260" r="5" />
              <circle cx="760" cy="180" r="3.5" />
              <circle cx="940" cy="300" r="4" />
              <circle cx="1100" cy="220" r="3" />
              <circle cx="180" cy="420" r="3" />
              <circle cx="340" cy="360" r="4" />
              <circle cx="520" cy="480" r="5" />
              <circle cx="700" cy="400" r="3.5" />
              <circle cx="880" cy="520" r="4.5" />
              <circle cx="1060" cy="440" r="3" />
            </g>
          </svg>
          <span className="launch-particle p1" />
          <span className="launch-particle p2" />
          <span className="launch-particle p3" />
          <span className="launch-particle p4" />
          <span className="launch-particle p5" />
          <span className="launch-particle p6" />
          <span className="launch-particle p7" />
          <span className="launch-particle p8" />
        </div>

        <header className="launch-rail-top">
          <div className="launch-rail-brand">
            <img src="/launch/cba-logo.png" alt="CBA" />
            <span className="launch-rail-divider" aria-hidden />
            <span className="launch-rail-label">Ceylon Business Appliances</span>
          </div>
          <span className="launch-status">
            <span className="launch-status-dot" aria-hidden />
            Coming soon
          </span>
        </header>

        <main className="launch-stage">
          <section className="launch-copy">
            <p className="launch-kicker">Online store premiere</p>
            <img
              className="launch-brand-mark"
              src="/launch/ebiz-logo.png"
              alt="EBiz"
            />
            <h1 className="launch-title">
              Business technology,
              <span> ready to shop.</span>
            </h1>
            <p className="launch-subtitle">
              A cleaner way to browse printers, POS, security, and office
              essentials from Ceylon Business Appliances.
            </p>

            <div className="launch-actions">
              <button
                type="button"
                className="launch-cta"
                disabled={busy}
                onClick={() => void runCeremony(false)}
              >
                Begin launch
              </button>
              <div className="launch-armed">
                <span
                  className={`launch-armed-dot${armed ? " is-on" : ""}`}
                  aria-hidden
                />
                <p className="launch-meta">
                  {armed ? (
                    <>
                      Presenter key <strong>armed</strong>
                      <span className="launch-meta-sep">·</span>
                      Space to begin
                    </>
                  ) : (
                    <>
                      Awaiting presenter key
                      <span className="launch-meta-sep">·</span>
                      <strong>T</strong> to rehearse
                    </>
                  )}
                </p>
              </div>
            </div>

            {statusMessage ? (
              <p className="launch-message" role="status">
                {statusMessage}
              </p>
            ) : null}
          </section>

          <section className="launch-visual" aria-label="EBiz categories">
            <div className="launch-visual-frame">
              <div className="launch-visual-orbit" aria-hidden />
              <div className="launch-visual-orbit launch-visual-orbit-2" aria-hidden />
              <img
                className="launch-visual-logo"
                src="/launch/ebiz-logo.png"
                alt=""
              />
              <ul className="launch-visual-tags">
                <li>Printers</li>
                <li>POS</li>
                <li>Security</li>
                <li>Office</li>
              </ul>
            </div>
          </section>
        </main>

        <footer className="launch-rail-bottom" aria-hidden={busy}>
          <p className="launch-rail-note">Presenter controls</p>
          <div className="launch-hotkeys">
            <span>
              <kbd>F</kbd> Fullscreen
            </span>
            <span>
              <kbd>Space</kbd> Begin
            </span>
            <span>
              <kbd>R</kbd> Reset
            </span>
            <span>
              <kbd>T</kbd> Test
            </span>
          </div>
        </footer>
      </div>

      {/* Act I — Spark */}
      <div
        className={`launch-act launch-spark${
          phase === "spark" ? " is-active" : ""
        }`}
        aria-hidden={phase !== "spark"}
      >
        <div className="launch-spark-stage">
          <div
            className={`launch-spark-rays${raysOn ? " is-on" : ""}`}
            aria-hidden
          />
          <div
            key={`corona-${coronaKey}`}
            className={`launch-spark-corona${
              coronaKey ? " is-pulse" : ""
            }`}
            aria-hidden
          />
          <div
            className={`launch-spark-ember${emberLit ? " is-lit" : ""}${
              emberGrow ? " is-grow" : ""
            }${sparkWord ? " is-gone" : ""}`}
            aria-hidden
          />
          {sparkWord ? (
            <p className="launch-spark-word is-shown" key={sparkWordKey}>
              {sparkWord}
            </p>
          ) : null}
        </div>
      </div>

      {/* Act II — Assemble store */}
      <div
        className={`launch-act launch-constellation${
          phase === "constellation" ? " is-active" : ""
        }`}
        aria-hidden={phase !== "constellation"}
      >
        <div
          className={`launch-assemble${assembleReady ? " is-ready" : ""}`}
        >
          <p className="launch-constellation-title">Assembling the store</p>

          <div className="launch-assemble-meter" aria-hidden>
            <div
              className="launch-assemble-meter-fill"
              style={{
                width: `${(assembleCount / STORE_CATEGORIES.length) * 100}%`,
              }}
            />
            <div className="launch-assemble-meter-ticks">
              {STORE_CATEGORIES.map((item, index) => (
                <span
                  key={item.name}
                  className={assembleCount > index ? "is-on" : undefined}
                />
              ))}
            </div>
          </div>

          <div className="launch-assemble-grid">
            {STORE_CATEGORIES.map((item, index) => (
              <article
                key={item.name}
                className={`launch-assemble-cell${
                  assembleIn[index] ? " is-in" : ""
                }${assembleFocus === index ? " is-focus" : ""}`}
              >
                <div className="launch-assemble-cell-scan" aria-hidden />
                <span className="launch-assemble-index">0{index + 1}</span>
                <h3 className="launch-assemble-name">{item.name}</h3>
                <p className="launch-assemble-note">{item.note}</p>
                <span className="launch-assemble-check" aria-hidden>
                  {assembleIn[index] ? "Added" : "Waiting"}
                </span>
              </article>
            ))}
          </div>

          <p className="launch-assemble-status">
            {assembleCount === 0
              ? "Preparing catalog…"
              : assembleCount < STORE_CATEGORIES.length
                ? `${assembleCount} of ${STORE_CATEGORIES.length} departments live`
                : "Catalog ready"}
          </p>
        </div>
      </div>

      {/* Act III — Signature */}
      <div
        className={`launch-act launch-signature${
          phase === "signature" ? " is-active" : ""
        }`}
        aria-hidden={phase !== "signature"}
      >
        <div
          className={`launch-signature-beam${signatureBeam ? " is-on" : ""}`}
          aria-hidden
        />
        <div
          className={`launch-signature-flare${signatureFlare ? " is-on" : ""}`}
          aria-hidden
        />
        <div className="launch-signature-mark">
          <img
            className={`launch-signature-logo${
              signatureLogo ? " is-shown" : ""
            }`}
            src="/launch/ebiz-logo.png"
            alt="EBiz"
          />
          <p
            className={`launch-signature-word${
              signatureWord ? " is-shown" : ""
            }`}
          >
            EBiz
          </p>
          <p
            className={`launch-signature-tag${
              signatureTag ? " is-shown" : ""
            }`}
          >
            Ceylon Business Appliances
          </p>
        </div>
      </div>

      {/* Act IV — Portal → storefront */}
      <div
        className={`launch-act launch-portal${
          phase === "portal" ? " is-active" : ""
        }${portalExit ? " is-exit" : ""}`}
        aria-hidden={phase !== "portal"}
      >
        <div
          className={`launch-portal-headline${portalTitle ? " is-shown" : ""}${
            portalExit ? " is-fade" : ""
          }`}
        >
          <p className="launch-portal-eyebrow">Almost there</p>
          <h2 className="launch-portal-heading">The store is opening</h2>
        </div>

        <div
          className={`launch-portal-stage${portalShown ? " is-shown" : ""}${
            portalExit ? " is-rush" : ""
          }`}
        >
          <div
            className={`launch-portal-frame${portalShown ? " is-shown" : ""}${
              portalOpen ? " is-open" : ""
            }`}
          >
            <div className="launch-portal-door launch-portal-door-left">
              <span className="launch-portal-handle" aria-hidden />
            </div>
            <div className="launch-portal-door launch-portal-door-right">
              <span className="launch-portal-handle" aria-hidden />
            </div>
            <div
              className={`launch-portal-inner${
                portalReveal ? " is-revealed" : ""
              }`}
            >
              <img
                className="launch-portal-logo"
                src="/launch/ebiz-logo.png"
                alt=""
              />
              <p className="launch-portal-store-name">EBiz Store</p>
              <p className="launch-portal-store-line">
                Printers · POS · Security · Office
              </p>
            </div>
          </div>
        </div>

        <p
          className={`launch-portal-cue${portalReady && !portalOpen ? " is-shown" : ""}`}
        >
          Watch the doors
        </p>
        <p
          className={`launch-portal-cue launch-portal-cue-open${
            portalOpen && !portalExit ? " is-shown" : ""
          }`}
        >
          Welcome in
        </p>
      </div>
    </div>
  )
}
