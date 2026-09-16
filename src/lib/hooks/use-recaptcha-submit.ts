"use client"

import { executeRecaptcha } from "@lib/recaptcha-client"
import { RECAPTCHA_FORM_FIELD, type RecaptchaAction } from "@lib/recaptcha"
import { useRef, useState } from "react"

export function useRecaptchaSubmit(action: RecaptchaAction, additionalActions: RecaptchaAction[] = []) {
  const bypass = useRef(false)
  const inFlight = useRef(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    if (bypass.current) { bypass.current = false; return }
    event.preventDefault()
    if (inFlight.current) return

    // React's SyntheticEvent currentTarget is only reliable during the
    // synchronous event callback. Retain the DOM form before awaiting Google.
    const form = event.currentTarget
    inFlight.current = true
    setVerificationError(null); setVerifying(true)
    try {
      const token = await executeRecaptcha(action)
      let input = form.elements.namedItem(RECAPTCHA_FORM_FIELD) as HTMLInputElement | null
      if (!input) { input = document.createElement("input"); input.type = "hidden"; input.name = RECAPTCHA_FORM_FIELD; form.appendChild(input) }
      input.value = token
      for (const extraAction of additionalActions) {
        const extraToken = await executeRecaptcha(extraAction)
        let extra = form.elements.namedItem(`${RECAPTCHA_FORM_FIELD}_${extraAction}`) as HTMLInputElement | null
        if (!extra) { extra = document.createElement("input"); extra.type = "hidden"; extra.name = `${RECAPTCHA_FORM_FIELD}_${extraAction}`; form.appendChild(extra) }
        extra.value = extraToken
      }
      bypass.current = true
      form.requestSubmit()
    } catch { setVerificationError("Verification is temporarily unavailable. Please try again.") }
    finally { inFlight.current = false; setVerifying(false) }
  }
  return { onRecaptchaSubmit: onSubmit, verificationError, verifying }
}
