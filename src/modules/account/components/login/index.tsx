"use client"

import { login, startOAuthLogin } from "@lib/data/customer"
import type { AccountAuthSettings, AuthProviderId } from "@lib/data/account-auth"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { notify } from "@lib/notifications"
import type React from "react"
import { useActionState, useEffect, useState } from "react"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
  settings: AccountAuthSettings
  countryCode: string
}

const Login = ({ setCurrentView, settings, countryCode }: Props) => {
  const [message, formAction] = useActionState(login, null)
  const [socialMessage, socialAction] = useActionState(startOAuthLogin, null)
  const [clientError, setClientError] = useState<string | null>(null)

  useEffect(() => {
    if (message) {
      notify.error(message, "We could not sign you in.", { id: "login" })
    }
  }, [message])

  useEffect(() => {
    if (socialMessage) {
      notify.error(socialMessage, "We could not start sign-on.", {
        id: "social-login",
      })
    }
  }, [socialMessage])

  function validate(event: React.FormEvent<HTMLFormElement>) {
    const form = new FormData(event.currentTarget)
    const email = String(form.get("email") ?? "").trim()
    const password = String(form.get("password") ?? "")
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      event.preventDefault()
      setClientError("Enter a valid email address.")
      notify.error("Enter a valid email address.", "Enter a valid email address.", {
        id: "login-validation",
      })
      return
    }
    if (!password) {
      event.preventDefault()
      setClientError("Password is required.")
      notify.error("Password is required.", "Password is required.", {
        id: "login-validation",
      })
      return
    }
    setClientError(null)
  }

  return (
    <div className="w-full" data-testid="login-page">
      <h1 className="text-[30px] font-bold leading-tight text-[#111111]">
        {settings.content.login_title}
      </h1>
      <p className="mt-3 text-[15px] leading-6 text-[#6b6b6b]">
        {settings.content.login_description}
      </p>

      <form className="mt-8 w-full" action={formAction} onSubmit={validate} noValidate>
        <div className="flex flex-col gap-5">
          <AuthField
            label="Email Address"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email address"
            icon="email"
          />
          <AuthField
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            icon="lock"
            aside={
              <LocalizedClientLink href="/account/forgot-password" className="text-[13px] font-semibold text-[#ff5c0e]">
                Forgot Password?
              </LocalizedClientLink>
            }
          />
          <label className="flex items-center gap-3 text-[14px] font-medium text-[#555555]">
            <input
              type="checkbox"
              name="remember"
              className="h-5 w-5 rounded border border-[#d7d7d7] text-[#ff5c0e] focus:ring-[#ff5c0e]"
            />
            Remember me
          </label>
        </div>
        <ErrorMessage error={clientError ?? message} data-testid="login-error-message" />
        <SubmitButton
          data-testid="sign-in-button"
          className="mt-7 h-[54px] w-full rounded-md border-none bg-[#ff5c0e] text-[16px] font-semibold text-white shadow-none hover:bg-[#e6530c]"
        >
          Sign In
        </SubmitButton>
      </form>

      <SocialSection
        providers={settings.providers}
        countryCode={countryCode}
        formAction={socialAction}
        error={socialMessage}
      />

      <p className="mt-8 text-center text-[14px] text-[#686868]">
        Don&apos;t have an account?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className="font-semibold text-[#ff5c0e]"
          data-testid="register-button"
        >
          Create Account
        </button>
      </p>
    </div>
  )
}

export function AuthField({
  label,
  name,
  type = "text",
  placeholder,
  autoComplete,
  icon,
  aside,
}: {
  label: string
  name: string
  type?: string
  placeholder: string
  autoComplete?: string
  icon: "email" | "lock" | "user" | "phone"
  aside?: React.ReactNode
}) {
  const [show, setShow] = useState(false)
  const isPassword = type === "password"

  return (
    <div>
      <div className="mb-2 flex min-h-[20px] items-center justify-between gap-4">
        <label htmlFor={name} className="text-[14px] font-semibold text-[#222222]">
          {label}
        </label>
        {aside}
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]">
          <FieldIcon icon={icon} />
        </span>
        <input
          id={name}
          name={name}
          type={isPassword && show ? "text" : type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="h-[52px] w-full rounded-md border border-[#dddddd] bg-white pl-12 pr-12 text-[15px] text-[#151515] outline-none transition placeholder:text-[#9b9b9b] focus:border-[#ff5c0e] focus:ring-2 focus:ring-[#ff5c0e]/15"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((current) => !current)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8f8f8f]"
            aria-label={show ? "Hide password" : "Show password"}
          >
            <FieldIcon icon={show ? "eye-off" : "eye"} />
          </button>
        )}
      </div>
    </div>
  )
}

export function SocialSection({
  providers,
  countryCode,
  formAction,
  error,
}: {
  providers: AccountAuthSettings["providers"]
  countryCode: string
  formAction: (payload: FormData) => void
  error?: string | null
}) {
  const visible = (Object.keys(providers) as AuthProviderId[]).filter(
    (provider) => providers[provider].enabled
  )
  if (!visible.length) {
    return null
  }

  return (
    <div className="mt-9">
      <div className="flex items-center gap-6">
        <div className="h-px flex-1 bg-[#e2e2e2]" />
        <span className="text-[13px] font-medium text-[#757575]">or</span>
        <div className="h-px flex-1 bg-[#e2e2e2]" />
      </div>
      <div className="mt-7 flex flex-col gap-3">
        {visible.map((provider) => (
          <form action={formAction} key={provider}>
            <input type="hidden" name="provider" value={provider} />
            <input type="hidden" name="country_code" value={countryCode} />
            <button
              type="submit"
              className="flex h-[52px] w-full items-center justify-center gap-3 rounded-md border border-[#dddddd] bg-white text-[15px] font-semibold text-[#222222] transition hover:border-[#cfcfcf] hover:bg-[#fafafa]"
            >
              <ProviderIcon provider={provider} />
              {providers[provider].label}
            </button>
          </form>
        ))}
      </div>
      <ErrorMessage error={error} />
    </div>
  )
}

function FieldIcon({ icon }: { icon: string }) {
  if (icon === "email") {
    return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M4 6h16v12H4V6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="m5 7 7 6 7-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
  }
  if (icon === "lock") {
    return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M7 10V8a5 5 0 0 1 10 0v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M6 10h12v10H6V10Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M12 14v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
  }
  if (icon === "user") {
    return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="1.8" /><path d="M4 21a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
  }
  if (icon === "phone") {
    return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M7 5h3l1.5 4-2 1.2a10 10 0 0 0 4.3 4.3l1.2-2 4 1.5v3a2 2 0 0 1-2.2 2A15 15 0 0 1 5 7.2 2 2 0 0 1 7 5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
  }
  if (icon === "eye-off") {
    return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="m4 4 16 16M10.6 10.6a2 2 0 0 0 2.8 2.8M8.5 5.7A10.7 10.7 0 0 1 12 5c5 0 8 5 8 7a9.5 9.5 0 0 1-2 3M6.2 8.2C4.8 9.4 4 11 4 12c0 2 3 7 8 7a10 10 0 0 0 4-.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
  }
  return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M3 12s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6Z" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" /></svg>
}

function ProviderIcon({ provider }: { provider: AuthProviderId }) {
  if (provider === "google") {
    return <span className="text-[22px] font-bold text-[#4285f4]">G</span>
  }
  if (provider === "facebook") {
    return <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1877f2] text-[18px] font-bold text-white">f</span>
  }
  return <span className="text-[24px] leading-none text-black"></span>
}

export default Login
