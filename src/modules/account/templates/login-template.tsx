"use client"

import type { AccountAuthSettings } from "@lib/data/account-auth"
import type { AuthView } from "@lib/util/auth-modal"
import { useAuthModal } from "@modules/account/context/auth-modal-context"
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useRef } from "react"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

export default function LoginTemplate({ settings, countryCode }: {
  settings: AccountAuthSettings
  countryCode: string
}) {
  void settings
  void countryCode
  const modal = useAuthModal()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const opened = useRef(false)

  useEffect(() => {
    if (opened.current) return
    opened.current = true
    let view: AuthView = "sign-in"
    if (pathname.endsWith("/forgot-password")) view = "forgot-password"
    if (pathname.endsWith("/reset-password")) view = "reset-password"
    const notice = pathname.endsWith("/email-change/confirm")
      ? "Sign in with your current email, then reopen the verification link before it expires."
      : searchParams.get("email_changed") === "1"
        ? "Your email was updated successfully. Sign in with your new email and existing password."
        : undefined
    modal.open(view, {
      routeHosted: true,
      token: searchParams.get("token") ?? "",
      email: searchParams.get("email") ?? "",
      notice,
      intent: { behavior: "navigate-after-auth", destination: "/account" },
    })
  }, [modal, pathname, searchParams])

  return <div className="min-h-[55vh] bg-[#f7f8fa]" aria-hidden="true" />
}
