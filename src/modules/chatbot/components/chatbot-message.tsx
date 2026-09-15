"use client"

import { useState } from "react"
import { useParams } from "next/navigation"

import { addToCart } from "@lib/data/cart"
import { notify } from "@lib/notifications"
import { openSideCart } from "@lib/util/side-cart-event"
import ChatbotMarkdown from "./chatbot-markdown"
import { convertToLocale } from "@lib/util/money"
import type { ChatbotAction, ChatbotMessage as Message, ChatbotSolutionProduct } from "./types"

type Props={item:Message;busy?:boolean;onSolutionAnswer?:(answer:{question_id:string;value:string},label:string)=>void}
export default function ChatbotMessage({ item,busy=false,onSolutionAnswer }: Props) {
  const customer = item.role === "user"
  const countryCode = useParams().countryCode as string
  const [addingVariantId, setAddingVariantId] = useState<string | null>(null)
  const [answer,setAnswer]=useState("")

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

  function submitTextAnswer(){const value=answer.trim();if(!item.follow_up||!value||value.length>240||!onSolutionAnswer)return;onSolutionAnswer({question_id:item.follow_up.question_id,value},value);setAnswer("")}

  const productAction=(product:ChatbotSolutionProduct):ChatbotAction|null=>product.default_variant?.id&&!product.has_multiple_variants&&product.inventory.purchasable&&product.price.status==="available"?{key:"add_to_cart",url:product.url,product_id:product.id,variant_id:product.default_variant.id}:null

  return <article className={`cba-chatbot-message flex ${customer ? "justify-end" : "justify-start"}`}><div className={`max-w-[94%] ${customer ? "items-end" : "items-start"} flex flex-col gap-2`}><div className={`rounded-2xl px-3.5 py-2.5 text-[14px] leading-5 ${customer ? "max-w-[86%] rounded-br-md bg-brand text-white shadow-[0_5px_14px_rgba(255,92,14,.18)]" : item.isError ? "rounded-bl-md border border-amber-200 bg-amber-50 text-grey-90" : "rounded-bl-md border border-grey-20 bg-white text-grey-90 shadow-[0_4px_14px_rgba(17,24,39,.06)]"}`}>{customer || item.isError ? <p className="whitespace-pre-wrap">{item.message}</p> : <ChatbotMarkdown>{item.message}</ChatbotMarkdown>}{item.actions?.length ? <div className="mt-2 flex flex-wrap gap-2">{item.actions.map((action) => action.key === "add_to_cart" && action.variant_id ? <button key={`${item.id}-${action.key}-${action.variant_id}`} type="button" disabled={Boolean(addingVariantId)} onClick={() => void handleAddToCart(action)} className="inline-flex min-h-9 items-center rounded-full border border-brand/25 bg-brand/5 px-3 text-xs font-bold capitalize text-brand transition-colors hover:bg-brand hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 disabled:cursor-wait disabled:opacity-60">{addingVariantId === action.variant_id ? "Adding…" : "Add to cart"}</button> : <a key={`${item.id}-${action.key}`} href={action.url} className="inline-flex min-h-9 items-center rounded-full border border-brand/25 bg-brand/5 px-3 text-xs font-bold capitalize text-brand transition-colors hover:bg-brand hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30">{action.key.replaceAll("_", " ")}</a>)}</div> : null}</div>{item.follow_up?<div className="w-full rounded-2xl border border-orange-200 bg-white p-3"><p className="text-[11px] font-semibold text-grey-50">Question {Math.min(item.follow_up.progress.answered+1,item.follow_up.progress.total)} of {item.follow_up.progress.total}</p>{item.follow_up.type==="single_choice"?<div className="mt-2 grid gap-2">{item.follow_up.options.map(option=><button key={option.value} disabled={busy} onClick={()=>onSolutionAnswer?.({question_id:item.follow_up!.question_id,value:option.value},option.label)} className="min-h-10 rounded-xl border border-grey-20 px-3 text-left text-xs font-semibold hover:border-brand hover:text-brand disabled:opacity-50">{option.label}</button>)}</div>:<form className="mt-2 flex gap-2" onSubmit={e=>{e.preventDefault();submitTextAnswer()}}><input aria-label={item.follow_up.label} maxLength={240} value={answer} onChange={e=>setAnswer(e.target.value)} disabled={busy} className="min-w-0 flex-1 rounded-xl border border-grey-30 px-3 text-xs outline-none focus:border-brand"/><button disabled={busy||!answer.trim()} className="rounded-xl bg-brand px-3 text-xs font-bold text-white disabled:opacity-40">Continue</button></form>}</div>:null}{item.solution?<div className="grid w-full gap-3" aria-label={`${item.solution.name} products`}>{item.solution.roles.map(role=><section key={role.id} className="rounded-2xl border border-grey-20 bg-white p-3"><div className="flex items-center justify-between gap-2"><h3 className="text-xs font-bold text-grey-90">{role.label}</h3><span className={`text-[10px] font-semibold ${role.available?"text-emerald-700":"text-amber-700"}`}>{role.available?(role.required?"Required":"Optional"):"Unavailable"}</span></div>{role.notes?<p className="mt-1 text-[11px] text-grey-60">{role.notes}</p>:null}<div className="mt-2 grid gap-2">{role.products.map(product=>{const action=productAction(product);return <div key={product.id} className="rounded-xl bg-grey-5 p-2.5"><a href={product.url} className="text-xs font-bold text-grey-90 hover:text-brand">{product.title}</a><div className="mt-1 flex items-center justify-between gap-2"><span className="text-[11px] text-grey-60">{product.price.calculated_amount!==null&&product.price.status==="available"?convertToLocale({amount:product.price.calculated_amount,currency_code:product.price.currency_code.toUpperCase()}):"Price unavailable"}</span><span className="text-[10px] text-grey-50">{product.inventory.status.replaceAll("_"," ")}</span></div><div className="mt-2 flex gap-2"><a href={product.url} className="rounded-full border border-brand/25 px-2.5 py-1 text-[10px] font-bold text-brand">View</a>{action?<button disabled={Boolean(addingVariantId)} onClick={()=>void handleAddToCart(action)} className="rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold text-white disabled:opacity-50">{addingVariantId===action.variant_id?"Adding…":"Add to cart"}</button>:null}</div></div>})}</div></section>)}</div>:null}<time className="px-1 text-[10px] text-grey-50">{item.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div></article>
}
