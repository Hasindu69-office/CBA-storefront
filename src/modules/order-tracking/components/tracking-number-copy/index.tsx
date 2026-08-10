"use client"

import { useState } from "react"

type TrackingNumberCopyProps = {
  value: string
}

export default function TrackingNumberCopy({ value }: TrackingNumberCopyProps) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <code className="max-w-full break-all rounded bg-[#f6f7f9] px-2 py-1 text-[13px] font-semibold text-[#151922]">
        {value}
      </code>
      <button
        type="button"
        onClick={() => void copy()}
        className="rounded border border-[#e5e7eb] px-2.5 py-1 text-[12px] font-semibold text-[#3b414c] transition hover:border-[#ff5c0e] hover:text-[#ff5c0e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5c0e]"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  )
}
