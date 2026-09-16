"use client"

import type { RecaptchaAction } from "./recaptcha"

declare global {
  interface Window { grecaptcha?: { ready(callback: () => void): void; execute(siteKey: string, options: { action: string }): Promise<string> } }
}

let scriptPromise: Promise<void> | null = null

function loadScript(siteKey: string) {
  if (window.grecaptcha) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-cba-recaptcha]")
    const script = existing ?? document.createElement("script")
    const timeout = window.setTimeout(() => { scriptPromise = null; reject(new Error("Verification timed out.")) }, 10000)
    script.addEventListener("load", () => { window.clearTimeout(timeout); resolve() }, { once: true })
    script.addEventListener("error", () => { window.clearTimeout(timeout); scriptPromise = null; reject(new Error("Verification could not be loaded.")) }, { once: true })
    if (!existing) {
      script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`
      script.async = true
      script.defer = true
      script.dataset.cbaRecaptcha = "true"
      document.head.appendChild(script)
    }
  })
  return scriptPromise
}

export async function executeRecaptcha(action: RecaptchaAction) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim()
  if (!siteKey) {
    if (process.env.NODE_ENV !== "production") return ""
    throw new Error("Verification is not configured.")
  }
  await loadScript(siteKey)
  return new Promise<string>((resolve, reject) => {
    window.grecaptcha!.ready(() => window.grecaptcha!.execute(siteKey, { action }).then(resolve, reject))
  }).then((token) => {
    if (!token) throw new Error("Verification did not return a token.")
    return token
  })
}
