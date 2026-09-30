"use client"

import type { AccountAuthSettings } from "@lib/data/account-auth"
import { AuthIntent, AuthView, safeAuthDestination } from "@lib/util/auth-modal"
import ForgotPasswordForm from "@modules/account/templates/forgot-password"
import ResetPasswordForm from "@modules/account/templates/reset-password"
import Login from "@modules/account/components/login"
import Register from "@modules/account/components/register"
import X from "@modules/common/icons/x"
import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Fragment, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

type OpenOptions = {
  intent?: AuthIntent
  token?: string
  email?: string
  notice?: string
  routeHosted?: boolean
}

type AuthModalApi = {
  authenticated: boolean
  isOpen: boolean
  view: AuthView
  open: (view?: AuthView, options?: OpenOptions) => void
  switchView: (view: AuthView) => void
  close: () => void
}

const AuthModalContext = createContext<AuthModalApi | null>(null)

export function AuthModalProvider({ children, settings, countryCode, authenticated }: {
  children: React.ReactNode
  settings: AccountAuthSettings
  countryCode: string
  authenticated: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<AuthView>("sign-in")
  const [intent, setIntent] = useState<AuthIntent>({ behavior: "preserve-context" })
  const [routeHosted, setRouteHosted] = useState(false)
  const [token, setToken] = useState("")
  const [email, setEmail] = useState("")
  const [notice, setNotice] = useState<string | null>(null)

  const open = useCallback((nextView: AuthView = "sign-in", options: OpenOptions = {}) => {
    setView(nextView)
    setIntent(options.intent ?? { behavior: "preserve-context" })
    setToken(options.token ?? "")
    setEmail(options.email ?? "")
    setNotice(options.notice ?? null)
    setRouteHosted(Boolean(options.routeHosted))
    setIsOpen(true)
    window.dispatchEvent(new CustomEvent("cba:auth-modal", { detail: { open: true } }))
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setToken("")
    setEmail("")
    setNotice(null)
    window.dispatchEvent(new CustomEvent("cba:auth-modal", { detail: { open: false } }))
    if (routeHosted) {
      const sameOriginReferrer = document.referrer.startsWith(window.location.origin)
      if (sameOriginReferrer && window.history.length > 1) router.back()
      else router.replace("/")
    }
  }, [routeHosted, router])

  const onAuthenticated = useCallback(() => {
    setIsOpen(false)
    window.dispatchEvent(new CustomEvent("cba:auth-modal", { detail: { open: false } }))
    const destination = safeAuthDestination(intent.destination)
    if (intent.behavior === "navigate-after-auth" && destination) router.push(destination)
    router.refresh()
  }, [intent, router])

  useEffect(() => {
    if (authenticated && isOpen) setIsOpen(false)
  }, [authenticated, isOpen])

  useEffect(() => {
    const error = searchParams.get("auth_error")
    if (!error || authenticated) return
    const messages: Record<string, string> = {
      unsupported_provider: "This sign-on provider is not supported.",
      additional_verification_required: "Additional verification is required to sign in.",
      missing_email: "Your social account did not provide an email address.",
      oauth_failed: "We could not complete social sign-in. Please try again.",
    }
    open("sign-in", { notice: messages[error] ?? messages.oauth_failed })
  }, [authenticated, open, searchParams])

  const api = useMemo(() => ({ authenticated, isOpen, view, open, switchView: setView, close }), [authenticated, close, isOpen, open, view])
  const title = view === "register" ? "Create your account" : view === "forgot-password" ? "Forgot password" : view === "reset-password" ? "Reset password" : "Sign in"

  return (
    <AuthModalContext.Provider value={api}>
      {children}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[120]" onClose={close}>
          <TransitionChild as={Fragment} enter="ease-out duration-200 motion-reduce:duration-0" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150 motion-reduce:duration-0" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-[#111111]/65 backdrop-blur-[3px]" />
          </TransitionChild>
          <div className="fixed inset-0 overflow-hidden">
            <div className="flex min-h-full items-end justify-center small:items-center small:p-6">
              <TransitionChild as={Fragment} enter="ease-out duration-250 motion-reduce:duration-0" enterFrom="translate-y-full small:translate-y-0 small:opacity-0 small:scale-95" enterTo="translate-y-0 small:opacity-100 small:scale-100" leave="ease-in duration-180 motion-reduce:duration-0" leaveFrom="translate-y-0 small:opacity-100 small:scale-100" leaveTo="translate-y-full small:translate-y-0 small:opacity-0 small:scale-95">
                <DialogPanel className={`flex max-h-[calc(100dvh-0.75rem)] w-full flex-col overflow-hidden rounded-t-[24px] border border-gray-200 bg-white shadow-[0_30px_100px_rgba(0,0,0,.32)] small:max-h-[calc(100dvh-3rem)] small:rounded-[20px] ${view === "register" ? "small:max-w-[650px]" : "small:max-w-[500px]"}`}>
                  <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-gray-100 bg-white px-5 py-4 small:px-7">
                    <Dialog.Title className="text-lg font-bold text-[#111111]">{title}</Dialog.Title>
                    <button type="button" onClick={close} className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand" aria-label="Close authentication dialog">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="overflow-y-auto overscroll-contain px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 small:px-8 small:pb-8">
                    {notice && <div role="alert" className="mb-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{notice}</div>}
                    {view === "sign-in" && <Login setCurrentView={setView} settings={settings} countryCode={countryCode} onAuthenticated={onAuthenticated} onForgotPassword={() => setView("forgot-password")} returnTo={safeAuthDestination(intent.destination) ?? pathname} showTitle={false} />}
                    {view === "register" && <Register setCurrentView={setView} settings={settings} countryCode={countryCode} onAuthenticated={onAuthenticated} returnTo={safeAuthDestination(intent.destination) ?? pathname} showTitle={false} />}
                    {view === "forgot-password" && <ForgotPasswordForm countryCode={countryCode} embedded onBack={() => setView("sign-in")} />}
                    {view === "reset-password" && <ResetPasswordForm countryCode={countryCode} token={token} email={email} embedded onComplete={(message) => { setNotice(message); setView("sign-in") }} onBack={() => setView("sign-in")} />}
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  const value = useContext(AuthModalContext)
  if (!value) throw new Error("useAuthModal must be used within AuthModalProvider")
  return value
}
