"use client"

import { useState } from "react"
import { useParams } from "next/navigation"

import { addToCart } from "@lib/data/cart"
import { notify } from "@lib/notifications"
import { openSideCart } from "@lib/util/side-cart-event"
import ChatbotMarkdown from "./chatbot-markdown"
import type { ChatbotAction, ChatbotMessage as Message } from "./types"

export default function ChatbotMessage({ item }: { item: Message }) {
  const customer = item.role === "user"
  const countryCode = useParams().countryCode as string
  const [addingVariantId, setAddingVariantId] = useState<string | null>(null)

  async function handleAddToCart(action: ChatbotAction) {
    if (!action.variant_id || addingVariantId) return
    setAddingVariantId(action.variant_id)
    const toastId = `chatbot-cart:${action.variant_id}`
    notify.loading("Adding item to cart...", { id: toastId })
    openSideCart({ pendingMessage: "Adding item to cart.", refresh: false })
    try {
      const cart = await addToCart({ variantId: action.variant_id, quantity: 1, countryCode })
      openSideCart({ cart, refresh: true })
      notify.success("Item added to cart.", { id: toastId })
    } catch (error) {
      openSideCart({ pendingMessage: null, refresh: false })
      notify.error(error, "Could not add this item to your cart.", { id: toastId })
    } finally {
      setAddingVariantId(null)
    }
  }

  return <article className={`cba-chatbot-message flex ${customer ? "justify-end" : "justify-start"}`}><div className={`max-w-[86%] ${customer ? "items-end" : "items-start"} flex flex-col gap-1`}><div className={`rounded-2xl px-3.5 py-2.5 text-[14px] leading-5 ${customer ? "rounded-br-md bg-brand text-white shadow-[0_5px_14px_rgba(255,92,14,.18)]" : item.isError ? "rounded-bl-md border border-amber-200 bg-amber-50 text-grey-90" : "rounded-bl-md border border-grey-20 bg-white text-grey-90 shadow-[0_4px_14px_rgba(17,24,39,.06)]"}`}>{customer || item.isError ? <p className="whitespace-pre-wrap">{item.message}</p> : <ChatbotMarkdown>{item.message}</ChatbotMarkdown>}{item.actions?.length ? <div className="mt-2 flex flex-wrap gap-2">{item.actions.map((action) => action.key === "add_to_cart" && action.variant_id ? <button key={`${item.id}-${action.key}-${action.variant_id}`} type="button" disabled={Boolean(addingVariantId)} onClick={() => void handleAddToCart(action)} className="inline-flex min-h-9 items-center rounded-full border border-brand/25 bg-brand/5 px-3 text-xs font-bold capitalize text-brand transition-colors hover:bg-brand hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 disabled:cursor-wait disabled:opacity-60">{addingVariantId === action.variant_id ? "Adding…" : "Add to cart"}</button> : <a key={`${item.id}-${action.key}`} href={action.url} className="inline-flex min-h-9 items-center rounded-full border border-brand/25 bg-brand/5 px-3 text-xs font-bold capitalize text-brand transition-colors hover:bg-brand hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30">{action.key.replaceAll("_", " ")}</a>)}</div> : null}</div><time className="px-1 text-[10px] text-grey-50">{item.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div></article>
}
