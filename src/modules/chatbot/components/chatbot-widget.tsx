"use client"

import { useEffect, useRef, useState } from "react"
import ChatbotLauncher from "./chatbot-launcher"
import ChatbotPanel from "./chatbot-panel"
import type { ChatbotConfig, ChatbotMessage, ChatbotResponse, CurrentChatbotResponse, HandoverForm, HandoverState } from "./types"
import { executeRecaptcha } from "@lib/recaptcha-client"

const VISIBILITY_EVENT = "cba:chatbot-visibility"
const EMPTY_FORM: HandoverForm = { name: "", phone: "", consent: false }

export default function ChatbotWidget() {
  const [config, setConfig] = useState<ChatbotConfig | null>(null)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatbotMessage[]>([])
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)
  const [handover, setHandover] = useState<HandoverState | null>(null)
  const [handoverExpanded, setHandoverExpanded] = useState(false)
  const [handoverError, setHandoverError] = useState("")
  const [form, setForm] = useState<HandoverForm>(EMPTY_FORM)
  const launcherRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    async function loadConfig() {
      try {
        const response = await fetch("/api/cba/chatbot/config", { cache: "no-store", signal: controller.signal })
        if (!response.ok) return
        const payload = await response.json() as ChatbotConfig
        if (!controller.signal.aborted) setConfig(payload)
      } catch (error) { if (error instanceof Error && error.name === "AbortError") return }
    }
    async function loadCurrentSession() {
      try {
        const response = await fetch("/api/cba/chatbot/current", { cache: "no-store", signal: controller.signal })
        if (!response.ok) return
        const payload = await response.json() as CurrentChatbotResponse
        if (controller.signal.aborted) return
        setMessages(payload.messages.map((item) => ({ id: item.id, role: item.role, message: item.content.message, actions: item.content.actions, createdAt: item.created_at ? new Date(item.created_at) : new Date() })))
        if (payload.handover) { setHandover({ ...payload.handover, recommended: true }); setHandoverExpanded(true) }
      } catch (error) { if (error instanceof Error && error.name === "AbortError") return }
    }
    void loadConfig()
    void loadCurrentSession()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    window.dispatchEvent(new CustomEvent(VISIBILITY_EVENT, { detail: { open } }))
    if (!open) return
    const previousOverflow = document.body.style.overflow
    if (window.matchMedia("(max-width: 1023px)").matches) document.body.style.overflow = "hidden"
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setOpen(false); return }
      if (event.key !== "Tab" || !panelRef.current) return
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      if (!focusable.length) return
      const first = focusable[0], last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => { window.clearTimeout(timer); document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = previousOverflow }
  }, [open])

  useEffect(() => { if (!open) launcherRef.current?.focus() }, [open])
  useEffect(() => { if (open) endRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" }) }, [messages, busy, handover, handoverExpanded, open])

  if (!config?.enabled) return null

  async function ensureSession() {
    const current = await fetch("/api/cba/chatbot/current", { cache: "no-store" })
    if (current.ok) return
    const captcha = await executeRecaptcha("chatbot_session")
    const created = await fetch("/api/cba/chatbot/session", { method: "POST", headers: { "content-type": "application/json", "x-cba-recaptcha-token": captcha }, body: JSON.stringify({ locale: document.documentElement.lang || "en", source_page_url: location.pathname }) })
    if (!created.ok) throw new Error(await responseError(created, "Unable to start the assistant."))
  }

  async function send(value = text) {
    const message = value.trim()
    if (!message || busy) return
    setBusy(true); setMessages((items) => [...items, { id: crypto.randomUUID(), role: "user", message, createdAt: new Date() }]); setText(""); setHandoverError("")
    try {
      await ensureSession()
      const captcha = await executeRecaptcha("chatbot_message")
      const response = await fetch("/api/cba/chatbot/message", { method: "POST", headers: { "content-type": "application/json", "x-cba-recaptcha-token": captcha }, body: JSON.stringify({ client_message_id: crypto.randomUUID(), message, source_page_url: location.pathname }) })
      if (!response.ok) throw new Error(await responseError(response, "The assistant is temporarily unavailable."))
      const payload = await response.json() as ChatbotResponse
      setMessages((items) => [...items, { id: crypto.randomUUID(), role: "assistant", message: payload.message, actions: payload.actions, createdAt: new Date() }])
      if (payload.handover?.recommended && config?.handover_enabled) setHandover({ recommended: true })
    } catch (error) {
      setMessages((items) => [...items, { id: crypto.randomUUID(), role: "assistant", message: error instanceof Error ? error.message : "The assistant is temporarily unavailable.", createdAt: new Date(), isError: true }])
      if (config?.handover_enabled) setHandover({ recommended: true })
    } finally { setBusy(false) }
  }

  async function createHandover() {
    setHandoverError("")
    if (form.name.trim().length < 2) return setHandoverError("Enter your name using at least 2 characters.")
    if (!/^[+0-9][0-9\s-]{8,19}$/.test(form.phone)) return setHandoverError("Enter a valid Sri Lankan or international phone number.")
    if (!form.consent) return setHandoverError("Please accept the consent statement before continuing.")
    setBusy(true)
    try {
      const captcha = await executeRecaptcha("chatbot_handover")
      const response = await fetch("/api/cba/chatbot/handover", { method: "POST", headers: { "content-type": "application/json", "x-cba-recaptcha-token": captcha }, body: JSON.stringify(form) })
      if (!response.ok) throw new Error(await responseError(response, "We could not create the support request."))
      setHandover({ ...(await response.json() as HandoverState), recommended: true })
    } catch (error) { setHandoverError(error instanceof Error ? error.message : "We could not create the support request.") }
    finally { setBusy(false) }
  }

  function continueOnWhatsApp() {
    if (!handover?.whatsapp_url) return
    void fetch("/api/cba/chatbot/handover/opened", { method: "POST", headers: { "content-type": "application/json" }, body: "{}", keepalive: true }).catch(() => undefined)
  }

  return <><ChatbotLauncher ref={launcherRef} open={open} avatarUrl={config.avatar_url} avatarAltText={config.avatar_alt_text} onClick={() => setOpen((value) => !value)}/>{open ? <ChatbotPanel config={config} messages={messages} text={text} busy={busy} handover={handover} handoverExpanded={handoverExpanded} handoverError={handoverError} form={form} panelRef={panelRef} inputRef={inputRef} endRef={endRef} onClose={() => setOpen(false)} onTextChange={setText} onSend={(value) => void send(value)} onExpandHandover={() => setHandoverExpanded(true)} onFormChange={setForm} onCreateHandover={() => void createHandover()} onWhatsApp={() => void continueOnWhatsApp()}/> : null}</>
}

async function responseError(response: Response, fallback: string) {
  const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null
  return payload?.error?.message || fallback
}
