"use client"

import { fetchEligiblePopup, reportPopupEvent, StorefrontPopup } from "@lib/data/popups"
import { isPopupLocallySuppressed, isPopupProtectedPath, normalizePopupPath, popupDevice, readPopupState, triggerSatisfied, writePopupState } from "@lib/util/popups"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import PopupCampaignView from "./popup-campaign"

export default function CbaPopupProvider({ countryCode }: { countryCode: string }) {
  const pathname = usePathname()
  const popupPathname = normalizePopupPath(pathname)
  const [campaign, setCampaign] = useState<StorefrontPopup | null>(null)
  const [visible, setVisible] = useState(false)
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop")

  useEffect(() => {
    setCampaign(null); setVisible(false)
    if (isPopupProtectedPath(popupPathname)) return
    const controller = new AbortController()
    const start = () => { const currentDevice = popupDevice(window.innerWidth); setDevice(currentDevice); void (async()=>{const excluded:string[]=[];while(excluded.length<5&&!controller.signal.aborted){const result=await fetchEligiblePopup({ pathname:popupPathname, country_code:countryCode.toLowerCase(), device:currentDevice, excluded_campaign_ids:excluded },controller.signal);if(!result||controller.signal.aborted)return;const state=readPopupState(result.id);let shown=false;try{shown=sessionStorage.getItem(`cba.popup.session.${result.id}`)==="1"}catch{}if((result.frequency.once_per_session&&shown)||isPopupLocallySuppressed(result,state)){excluded.push(result.id);continue}setCampaign(result);return}})().catch(()=>undefined) }
    const hasIdle = typeof window.requestIdleCallback === "function"
    let idleId: number | undefined
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    if (hasIdle) idleId = window.requestIdleCallback(start, { timeout: 1800 })
    else timeoutId = setTimeout(start, 800)
    return () => { controller.abort(); if (idleId !== undefined) window.cancelIdleCallback(idleId); if (timeoutId !== undefined) clearTimeout(timeoutId) }
  }, [popupPathname, countryCode])

  useEffect(() => {
    if (!campaign) return
    const state = { delay: false, scroll: false, exit: false }
    let timer: number | undefined, scrollFrame = 0
    const imageUrl = device === "mobile" ? campaign.content.mobile_image_url || campaign.content.desktop_image_url : campaign.content.desktop_image_url || campaign.content.mobile_image_url
    const preloadedImage = imageUrl ? new Image() : null
    if (preloadedImage && imageUrl) preloadedImage.src = imageUrl
    const resolve = () => { if (!visible && triggerSatisfied(campaign.trigger, state)) { setVisible(true); writePopupState(campaign.id, { last_impression_at: Date.now() }); try { sessionStorage.setItem(`cba.popup.session.${campaign.id}`, "1") } catch {}; void reportPopupEvent(campaign, "impression") } }
    if (campaign.trigger.delay_seconds !== undefined) timer = window.setTimeout(() => { state.delay = true; resolve() }, campaign.trigger.delay_seconds * 1000)
    const onScroll = () => { if (scrollFrame) return; scrollFrame=requestAnimationFrame(()=>{ scrollFrame=0; const max=document.documentElement.scrollHeight-window.innerHeight; const percent=max<=0?100:(window.scrollY/max)*100; if (percent >= (campaign.trigger.scroll_percentage ?? 101)) { state.scroll=true; resolve() } }) }
    const onExit = (event: MouseEvent) => { if (device !== "mobile" && event.clientY <= 8 && event.relatedTarget === null) { state.exit=true; resolve() } }
    if (campaign.trigger.scroll_percentage !== undefined) { window.addEventListener("scroll", onScroll, { passive: true }); onScroll() }
    if (campaign.trigger.exit_intent && matchMedia("(pointer: fine)").matches) document.addEventListener("mouseout", onExit)
    return () => { if (timer) clearTimeout(timer); if (scrollFrame) cancelAnimationFrame(scrollFrame); window.removeEventListener("scroll", onScroll); document.removeEventListener("mouseout", onExit); if (preloadedImage) preloadedImage.src = "" }
  }, [campaign, device, visible])

  if (!campaign || !visible) return null
  return <PopupCampaignView campaign={campaign} device={device} onClose={() => { setVisible(false); setCampaign(null) }} />
}
