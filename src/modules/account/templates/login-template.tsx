"use client"

import { useState } from "react"

import type { AccountAuthSettings } from "@lib/data/account-auth"
import Register from "@modules/account/components/register"
import Login from "@modules/account/components/login"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { usePathname, useSearchParams } from "next/navigation"
import ForgotPasswordForm from "./forgot-password"
import ResetPasswordForm from "./reset-password"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

type Props = {
  settings: AccountAuthSettings
  countryCode: string
}

const LoginTemplate = ({ settings, countryCode }: Props) => {
  const [currentView, setCurrentView] = useState("sign-in")
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isForgotPassword = pathname.endsWith("/account/forgot-password")
  const isResetPassword = pathname.endsWith("/account/reset-password")

  return (
    <div
      className="min-h-[100svh] w-full bg-white lg:h-[100svh] lg:overflow-hidden"
      data-testid="auth-page"
    >
      <div className="grid min-h-[100svh] grid-cols-1 lg:h-[100svh] lg:min-h-0 lg:grid-cols-[46%_54%]">
        <section className="flex min-h-[100svh] justify-center px-6 py-10 sm:px-10 lg:h-[100svh] lg:min-h-0 lg:overflow-y-auto lg:px-14">
          <div className="flex w-full max-w-[520px] flex-col">
            <LocalizedClientLink
              href="/"
              className="mb-12 block h-20 w-48"
              aria-label="Go to home page"
            >
              <Image
                src={settings.content.logo_url}
                alt={settings.content.logo_alt_text}
                width={220}
                height={92}
                priority
                className="h-auto w-full object-contain object-left"
              />
            </LocalizedClientLink>
            {isForgotPassword ? (
              <ForgotPasswordForm countryCode={countryCode} />
            ) : isResetPassword ? (
              <ResetPasswordForm
                countryCode={countryCode}
                token={searchParams.get("token") ?? ""}
                email={searchParams.get("email") ?? ""}
              />
            ) : currentView === "sign-in" ? (
              <Login
                setCurrentView={setCurrentView}
                settings={settings}
                countryCode={countryCode}
              />
            ) : (
              <Register
                setCurrentView={setCurrentView}
                settings={settings}
                countryCode={countryCode}
              />
            )}
          </div>
        </section>
        <AuthPromoPanel content={settings.content} />
      </div>
    </div>
  )
}

function AuthPromoPanel({ content }: { content: AccountAuthSettings["content"] }) {
  return (
    <aside className="sticky top-0 hidden h-[100svh] min-h-0 overflow-hidden bg-[#090909] lg:block">
      <Image
        src={content.promo_image_url}
        alt={content.promo_image_alt_text}
        fill
        priority
        sizes="54vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-black/5" />
      <div className="relative z-10 flex h-full max-w-[560px] flex-col justify-center px-16 py-16 text-white">
        <p className="mb-7 text-[18px] font-semibold text-[#ff5c0e]">
          {content.promo_eyebrow}
        </p>
        <h2 className="max-w-[460px] text-[38px] font-bold leading-[1.14]">
          {content.promo_title}
        </h2>
        <p className="mt-5 max-w-[390px] text-[17px] leading-8 text-white/78">
          {content.promo_description}
        </p>
        <div className="mt-9 flex flex-col gap-6">
          {content.benefits.map((benefit) => (
            <div key={benefit.title} className="grid grid-cols-[44px_1fr] gap-4">
              <BenefitIcon icon={benefit.icon} />
              <div>
                <p className="text-[16px] font-semibold">{benefit.title}</p>
                <p className="mt-1 max-w-[260px] text-[14px] leading-6 text-white/72">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}

function BenefitIcon({ icon }: { icon: "award" | "settings" | "support" }) {
  if (icon === "settings") {
    return (
      <svg className="h-11 w-11 text-[#ff5c0e]" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M20.5 5h7l1.5 6a15.7 15.7 0 0 1 4 2.3l5.8-1.9 3.5 6-4.5 4.2c.2 1.6.2 3.2 0 4.8l4.5 4.2-3.5 6-5.8-1.9a15.7 15.7 0 0 1-4 2.3l-1.5 6h-7l-1.5-6a15.7 15.7 0 0 1-4-2.3l-5.8 1.9-3.5-6 4.5-4.2a17 17 0 0 1 0-4.8l-4.5-4.2 3.5-6 5.8 1.9a15.7 15.7 0 0 1 4-2.3L20.5 5Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
        <circle cx="24" cy="24" r="6" stroke="currentColor" strokeWidth="2.4" />
      </svg>
    )
  }
  if (icon === "support") {
    return (
      <svg className="h-11 w-11 text-[#ff5c0e]" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M10 28v-5a14 14 0 0 1 28 0v5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M10 28a5 5 0 0 1 5-5h2v12h-2a5 5 0 0 1-5-5v-2ZM38 28a5 5 0 0 0-5-5h-2v12h2a5 5 0 0 0 5-5v-2Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M31 38h-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg className="h-11 w-11 text-[#ff5c0e]" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M15 8h18v13a9 9 0 0 1-18 0V8Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M15 12H9v6a7 7 0 0 0 7 7M33 12h6v6a7 7 0 0 1-7 7M20 35l-2 7h12l-2-7M18 42h12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m24 14 2 4 4 .5-3 3 .8 4.5-3.8-2.2-3.8 2.2.8-4.5-3-3 4-.5 2-4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}

export default LoginTemplate
