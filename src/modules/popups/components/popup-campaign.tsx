"use client"

import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react"
import { executeRecaptcha } from "@lib/recaptcha-client"
import { reportPopupEvent, StorefrontPopup, subscribeFromPopup } from "@lib/data/popups"
import { normalizeEmail, validateEmail } from "@lib/util/storefront-form-validation"
import { writePopupState } from "@lib/util/popups"
import X from "@modules/common/icons/x"
import { Fragment, useEffect, useRef, useState } from "react"

type Device = "desktop" | "tablet" | "mobile"

export default function PopupCampaignView({ campaign, device, onClose }: { campaign: StorefrontPopup; device: Device; onClose: () => void }) {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [closing, setClosing] = useState(false)
  const submitted = useRef(false)
  const dismissed = useRef(false)
  const modal = campaign.presentation_type === "modal" || (device === "mobile" && campaign.content.mobile_presentation === "bottom_sheet")
  const editorial = campaign.content.layout_variant === "editorial_hero"

  useEffect(() => {
    if (modal) return
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [modal, onClose])

  const dismiss = () => {
    if (dismissed.current) return
    dismissed.current = true
    writePopupState(campaign.id, { dismissed_at: Date.now() })
    void reportPopupEvent(campaign, "dismiss")
    onClose()
  }
  const close = () => {
    if (modal) setClosing(true)
    else dismiss()
  }
  const action = () => {
    writePopupState(campaign.id, { clicked_at: Date.now() })
    void reportPopupEvent(campaign, "cta_click")
    if (!campaign.action.url) return
    if (campaign.action.open_in_new_tab) window.open(campaign.action.url, "_blank", "noopener,noreferrer")
    else window.location.assign(campaign.action.url)
  }
  async function subscribe(event: React.FormEvent) {
    event.preventDefault()
    const normalized = normalizeEmail(email)
    const validation = validateEmail(normalized)
    if (validation) { setError(validation); return }
    if (submitting || submitted.current) return
    setSubmitting(true); setError("")
    try {
      const token = await executeRecaptcha("newsletter_subscribe")
      setMessage(await subscribeFromPopup(campaign, normalized, token))
      submitted.current = true
      writePopupState(campaign.id, { newsletter_submitted: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not submit your subscription.")
    } finally { setSubmitting(false) }
  }

  const cardProps = { campaign, device, modal, onClose: close, onAction: action, email, setEmail, error, setError, message, submitting, onSubscribe: subscribe }
  const card = editorial ? <EditorialPopupCard {...cardProps} /> : <ClassicPopupCard {...cardProps} />

  if (!modal) return <aside role="region" aria-label={campaign.content.title} className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-[70] w-[min(440px,calc(100vw-2rem))] animate-in slide-in-from-right motion-reduce:animate-none small:right-5">{card}</aside>

  const bottom = device === "mobile" && campaign.content.mobile_presentation === "bottom_sheet"
  return <Transition appear show={!closing} as={Fragment} afterLeave={dismiss}>
    <Dialog as="div" className="relative z-[80]" onClose={close}>
      <TransitionChild as={Fragment} enter="ease-out duration-300 motion-reduce:duration-0" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200 motion-reduce:duration-0" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-grey-90/75 backdrop-blur-[4px]" /></TransitionChild>
      <div className="fixed inset-0 overflow-y-auto overscroll-contain">
        <div className={`flex min-h-full ${bottom ? "items-end" : "items-center"} justify-center p-0 small:p-6`}>
          <TransitionChild as={Fragment} enter="ease-out duration-300 motion-reduce:duration-0" enterFrom={bottom ? "translate-y-full" : "opacity-0 scale-95"} enterTo={bottom ? "translate-y-0" : "opacity-100 scale-100"} leave="ease-in duration-200 motion-reduce:duration-0" leaveFrom={bottom ? "translate-y-0" : "opacity-100 scale-100"} leaveTo={bottom ? "translate-y-full" : "opacity-0 scale-95"}>
            <DialogPanel className={`w-full ${bottom ? "max-w-none pb-[env(safe-area-inset-bottom)]" : editorial ? "max-w-[1180px]" : "max-w-3xl"}`}>{card}</DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </Transition>
}

function EditorialPopupCard(props: any) {
  const { campaign, device, modal, onClose } = props
  const content = campaign.content
  const stacked = !modal || device === "mobile"
  const image = stacked ? content.mobile_image_url || content.desktop_image_url : content.desktop_image_url || content.mobile_image_url
  const light = !stacked && content.text_tone === "light"

  if (stacked) return <div className="relative max-h-[calc(100dvh-1rem)] overflow-y-auto overscroll-contain rounded-t-[24px] border border-grey-20 bg-grey-0 shadow-[0_24px_80px_rgba(17,24,39,.35)] small:rounded-[24px]">
    <CloseButton onClose={onClose} />
    {image ? <img src={image} alt={content.image_alt || ""} className="h-[clamp(13rem,55vw,20rem)] w-full object-cover" /> : <div className="h-48 bg-grey-10" />}
    <div className="bg-grey-0 px-6 py-7 small:px-8 small:py-8"><PopupCopy {...props} editorial /></div>
  </div>

  return <div className="relative h-[min(620px,calc(100dvh-3rem))] min-h-[480px] overflow-hidden rounded-[28px] border border-grey-20 bg-grey-0 shadow-[0_30px_100px_rgba(17,24,39,.38)]">
    {image ? <img src={image} alt={content.image_alt || ""} className={`absolute inset-0 h-full w-full object-cover ${imagePosition(content.desktop_image_position)}`} /> : <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-orange-100" />}
    <CloseButton onClose={onClose} />
    <div className={`relative z-[1] flex h-full w-[53%] flex-col justify-center px-12 py-14 large:px-16 ${light ? "text-white" : "text-grey-90"}`}><PopupCopy {...props} editorial light={light} /></div>
  </div>
}

function ClassicPopupCard(props: any) {
  const { campaign, onClose } = props
  const content = campaign.content
  return <div className="relative max-h-[calc(100dvh-1rem)] overflow-hidden rounded-t-large border border-grey-20 bg-grey-0 shadow-[0_24px_80px_rgba(17,24,39,.3)] small:max-h-[calc(100dvh-2rem)] small:rounded-large">
    <CloseButton onClose={onClose} />
    {(content.desktop_image_url || content.mobile_image_url) && <div className="relative overflow-hidden bg-grey-10 small:max-h-[22rem]"><div className="absolute inset-x-0 bottom-0 z-[1] h-24 bg-gradient-to-t from-grey-90/20 to-transparent" /><picture><source media="(max-width: 767px)" srcSet={content.mobile_image_url || content.desktop_image_url} /><img src={content.desktop_image_url || content.mobile_image_url} alt={content.image_alt || ""} className="max-h-[15rem] w-full object-cover small:max-h-[22rem]" /></picture></div>}
    <div className="max-h-[calc(100dvh-16rem)] overflow-y-auto overscroll-contain p-6 small:max-h-[calc(100dvh-22rem)] small:p-8"><PopupCopy {...props} /></div>
  </div>
}

function PopupCopy({ campaign, modal, editorial, light, onAction, email, setEmail, error, setError, message, submitting, onSubscribe, onClose }: any) {
  const content = campaign.content
  const titleClass = editorial ? `pr-10 text-[clamp(2rem,4vw,4rem)] font-semibold leading-[1.04] tracking-[-.035em] ${light ? "text-white" : "text-grey-90"}` : "pr-10 text-2xl font-semibold leading-[1.12] tracking-tight text-grey-90 small:text-4xl"
  return <div className={editorial ? "max-w-[34rem]" : "max-w-xl"}>
    {content.eyebrow && <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-brand small:text-xs">{content.eyebrow}</p>}
    {modal ? <DialogTitle as="h2" className={titleClass}>{content.title}</DialogTitle> : <h2 className={titleClass}>{content.title}</h2>}
    {content.description && <p className={`mt-4 text-sm leading-6 small:text-lg small:leading-7 ${light ? "text-white/80" : "text-grey-60"}`}>{content.description}</p>}
    <PopupActions campaign={campaign} editorial={editorial} light={light} onAction={onAction} email={email} setEmail={setEmail} error={error} setError={setError} message={message} submitting={submitting} onSubscribe={onSubscribe} onClose={onClose} />
  </div>
}

function PopupActions({ campaign, editorial, light, onAction, email, setEmail, error, setError, message, submitting, onSubscribe, onClose }: any) {
  const content = campaign.content
  if (campaign.action.type === "newsletter") return <form onSubmit={onSubscribe} noValidate className="mt-7">
    <label htmlFor={`popup-email-${campaign.id}`} className="sr-only">Email address</label>
    <div className="flex flex-col gap-3 small:flex-row"><input id={`popup-email-${campaign.id}`} type="email" inputMode="email" autoComplete="email" maxLength={254} value={email} onChange={(event)=>{setEmail(event.target.value);if(error)setError("")}} placeholder="Email address" disabled={submitting||Boolean(message)} aria-invalid={Boolean(error)} aria-describedby={error?`popup-error-${campaign.id}`:undefined} className="min-h-12 flex-1 rounded-[12px] border border-grey-30 bg-white px-5 text-sm text-grey-90 placeholder:text-grey-50 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 disabled:opacity-60"/><button disabled={submitting||Boolean(message)} className="min-h-12 rounded-[12px] bg-brand px-6 font-semibold text-white transition-colors hover:bg-brand-hover focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/25 disabled:cursor-not-allowed disabled:opacity-60">{submitting?"Subscribing...":content.primary_cta_label||"Subscribe"}</button></div>
    {content.consent_text&&<p className={`mt-3 text-xs leading-5 ${light?"text-white/70":"text-grey-50"}`}>{content.consent_text}</p>}{error&&<p id={`popup-error-${campaign.id}`} role="alert" className="mt-2 text-sm font-medium text-rose-600">{error}</p>}{message&&<p role="status" className="mt-2 text-sm font-medium text-emerald-700">{message}</p>}
  </form>
  return <div className={`mt-7 flex ${editorial?"flex-col small:flex-row small:items-center":"items-center"} gap-2 small:gap-4`}>
    {campaign.action.type!=="none"&&<button type="button" onClick={onAction} className={`group flex min-h-12 items-center justify-center gap-4 rounded-[12px] bg-brand px-7 font-semibold text-white transition-all hover:bg-brand-hover focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/25 ${editorial?"w-full small:w-auto small:min-w-[190px]":""}`}>{content.primary_cta_label||"Learn more"}<span aria-hidden className="text-xl transition-transform group-hover:translate-x-1">→</span></button>}
    {content.secondary_cta_label&&<button type="button" onClick={onClose} className={`min-h-12 rounded-[10px] px-4 font-medium transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/20 ${light?"text-white/80 hover:bg-white/10 hover:text-white":"text-grey-60 hover:bg-grey-10 hover:text-grey-90"}`}>{content.secondary_cta_label}</button>}
  </div>
}

function CloseButton({ onClose }: { onClose: () => void }) { return <button type="button" onClick={onClose} aria-label="Close promotion" className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-circle border border-grey-20 bg-grey-0/95 text-grey-80 shadow-lg transition-colors hover:border-grey-90 hover:bg-grey-90 hover:text-white focus:outline-none focus-visible:border-grey-90 focus-visible:bg-grey-90 focus-visible:text-white focus-visible:ring-4 focus-visible:ring-brand/25"><X size="19" /></button> }
function imagePosition(value?: string) { return value === "left" ? "object-left" : value === "right" ? "object-right" : "object-center" }
