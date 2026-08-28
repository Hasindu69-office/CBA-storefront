"use client"

import { prepareKokoRedirectAction } from "@lib/data/koko"
import { localizedPath } from "@lib/util/routes"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

type Props = {
  countryCode: string
  cartId: string
}

export default function KokoRedirectClient({ countryCode, cartId }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const startedRef = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [fields, setFields] = useState<Record<string, string> | null>(null)
  const [actionUrl, setActionUrl] = useState<string | null>(null)
  const [amountLabel, setAmountLabel] = useState<string | null>(null)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    void (async () => {
      if (process.env.NODE_ENV !== "production") {
        console.info("[koko] prepare-redirect starting", { cart_id: cartId })
      }
      const prepared = await prepareKokoRedirectAction()
      if (!prepared.ok) {
        setError(prepared.message)
        return
      }
      setActionUrl(prepared.data.action_url)
      setFields(prepared.data.fields)
      setAmountLabel(`${prepared.data.currency_code} ${prepared.data.amount}`)
    })()
  }, [cartId])

  useEffect(() => {
    if (!fields || !actionUrl || !formRef.current) return
    const timer = window.setTimeout(() => formRef.current?.submit(), 150)
    return () => window.clearTimeout(timer)
  }, [fields, actionUrl])

  if (error) {
    return (
      <div className="w-full max-w-md rounded-md border border-gray-100 bg-white p-6 shadow-sm">
        <h1 className="text-[22px] font-bold text-[#111111]">Payment could not start</h1>
        <p className="mt-3 text-[14px] text-[#626978]">{error}</p>
        <Link
          href={localizedPath(`/${countryCode}/checkout`)}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-brand px-5 text-[14px] font-bold text-white hover:bg-brand-hover"
        >
          Return to checkout
        </Link>
      </div>
    )
  }

  if (!fields || !actionUrl) {
    return (
      <div className="w-full max-w-md rounded-md border border-gray-100 bg-white p-6 text-center shadow-sm">
        <h1 className="text-[22px] font-bold text-[#111111]">Preparing Koko</h1>
        <p className="mt-3 text-[14px] text-[#626978]">
          Please wait while we securely redirect you to complete payment.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md rounded-md border border-gray-100 bg-white p-6 shadow-sm">
      <h1 className="text-[22px] font-bold text-[#111111]">Continuing to Koko</h1>
      <p className="mt-3 text-[14px] text-[#626978]">
        Your browser will post you to Koko to pay
        {amountLabel ? ` ${amountLabel}` : ""} in 3 installments. If nothing happens, use the button below.
      </p>
      <form ref={formRef} method="POST" action={actionUrl} className="mt-6">
        {Object.entries(fields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <button
          type="submit"
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-brand px-5 text-[14px] font-bold text-white hover:bg-brand-hover"
        >
          Continue to Koko
        </button>
      </form>
      <Link
        href={localizedPath(`/${countryCode}/checkout`)}
        className="mt-4 inline-flex w-full items-center justify-center text-[13px] font-semibold text-[#626978] underline"
      >
        Cancel and return to checkout
      </Link>
    </div>
  )
}
