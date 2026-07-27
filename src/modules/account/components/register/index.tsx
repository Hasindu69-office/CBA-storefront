"use client"

import type React from "react"
import { useActionState, useState } from "react"
import type { AccountAuthSettings } from "@lib/data/account-auth"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { signup } from "@lib/data/customer"
import { AuthField, SocialSection } from "@modules/account/components/login"
import { startOAuthLogin } from "@lib/data/customer"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
  settings: AccountAuthSettings
  countryCode: string
}

const Register = ({ setCurrentView, settings, countryCode }: Props) => {
  const [message, formAction] = useActionState(signup, null)
  const [socialMessage, socialAction] = useActionState(startOAuthLogin, null)
  const [clientError, setClientError] = useState<string | null>(null)

  function validate(event: React.FormEvent<HTMLFormElement>) {
    const form = new FormData(event.currentTarget)
    const firstName = String(form.get("first_name") ?? "").trim()
    const lastName = String(form.get("last_name") ?? "").trim()
    const email = String(form.get("email") ?? "").trim()
    const phone = String(form.get("phone") ?? "").trim()
    const password = String(form.get("password") ?? "")
    const confirm = String(form.get("confirm_password") ?? "")

    const error =
      !firstName || !lastName
        ? "First name and last name are required."
        : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
          ? "Enter a valid email address."
          : phone && !/^[+()\d\s-]{7,24}$/.test(phone)
            ? "Enter a valid phone number."
            : password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)
              ? "Password must be at least 8 characters and include letters and numbers."
              : password !== confirm
                ? "Passwords do not match."
                : form.get("terms") !== "on"
                  ? "You must agree to the terms and privacy policy."
                  : null

    if (error) {
      event.preventDefault()
      setClientError(error)
      return
    }
    setClientError(null)
  }

  return (
    <div className="w-full" data-testid="register-page">
      <h1 className="text-[30px] font-bold leading-tight text-[#111111]">
        {settings.content.register_title}
      </h1>
      <p className="mt-3 max-w-[470px] text-[15px] leading-6 text-[#6b6b6b]">
        {settings.content.register_description}
      </p>

      <form className="mt-7 w-full" action={formAction} onSubmit={validate} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <AuthField label="First Name" name="first_name" autoComplete="given-name" placeholder="Enter your first name" icon="user" />
          <AuthField label="Last Name" name="last_name" autoComplete="family-name" placeholder="Enter your last name" icon="user" />
        </div>
        <div className="mt-4 flex flex-col gap-4">
          <AuthField label="Email Address" name="email" type="email" autoComplete="email" placeholder="Enter your email address" icon="email" />
          <AuthField label="Phone Number" name="phone" type="tel" autoComplete="tel" placeholder="Enter your phone number" icon="phone" />
          <AuthField label="Password" name="password" type="password" autoComplete="new-password" placeholder="Create a password" icon="lock" />
          <AuthField label="Confirm Password" name="confirm_password" type="password" autoComplete="new-password" placeholder="Confirm your password" icon="lock" />
        </div>
        <label className="mt-5 flex items-start gap-3 text-[14px] font-medium leading-6 text-[#333333]">
          <input
            type="checkbox"
            name="terms"
            className="mt-1 h-5 w-5 rounded border border-[#d7d7d7] text-[#ff5c0e] focus:ring-[#ff5c0e]"
          />
          <span>
            I agree to the{" "}
            <LocalizedClientLink href="/content/terms-of-use" className="font-semibold text-[#ff5c0e]">
              Terms & Conditions
            </LocalizedClientLink>{" "}
            and{" "}
            <LocalizedClientLink href="/content/privacy-policy" className="font-semibold text-[#ff5c0e]">
              Privacy Policy
            </LocalizedClientLink>
          </span>
        </label>
        <ErrorMessage
          error={clientError ?? (typeof message === "string" ? message : null)}
          data-testid="register-error"
        />
        <SubmitButton
          className="mt-6 h-[54px] w-full rounded-md border-none bg-[#ff5c0e] text-[16px] font-semibold text-white shadow-none hover:bg-[#e6530c]"
          data-testid="register-button"
        >
          Create Account
        </SubmitButton>
      </form>

      <SocialSection
        providers={settings.providers}
        countryCode={countryCode}
        formAction={socialAction}
        error={socialMessage}
      />

      <p className="mt-7 text-center text-[14px] text-[#686868]">
        Already have an account?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="font-semibold text-[#ff5c0e]"
        >
          Sign In
        </button>
      </p>
    </div>
  )
}

export default Register
