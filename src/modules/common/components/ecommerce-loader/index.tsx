"use client"

import { useEffect, useState } from "react"
import { ShoppingCartIcon } from "@modules/layout/components/cba-icons"

type EcommerceLoaderProps = {
  label?: string
}

export default function EcommerceLoader({
  label = "Loading store",
}: EcommerceLoaderProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const progressTimer = window.setInterval(() => {
      setProgress((currentProgress) => {
        if (currentProgress >= 100) {
          window.clearInterval(progressTimer)
          return 100
        }

        return Math.min(currentProgress + 5, 100)
      })
    }, 75)

    return () => window.clearInterval(progressTimer)
  }, [])

  return (
    <section
      className="fixed inset-0 z-[9999] flex h-screen w-screen items-center justify-center bg-white px-4 py-14 text-[#111820]"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <div className="flex flex-col items-center text-center">
        <div className="relative flex h-28 w-28 items-center justify-center small:h-32 small:w-32">
          <div className="absolute inset-0 rounded-full border border-[#ff5c0e]/15 bg-[#ff5c0e]/5 motion-safe:animate-ping" />
          <div className="absolute inset-3 rounded-full border border-[#111820]/10 bg-white shadow-[0_18px_45px_rgba(17,24,32,0.12)]" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white small:h-24 small:w-24">
            <img
              src="/images/ebizCBAlogo.png"
              alt=""
              className="h-9 w-auto object-contain small:h-10"
              draggable={false}
            />
            <span className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#ff5c0e] text-white shadow-lg motion-safe:animate-bounce motion-reduce:animate-none">
              <ShoppingCartIcon size={19} aria-hidden="true" />
            </span>
          </div>
        </div>

        <p
          className="mt-5 text-[13px] font-semibold uppercase tracking-normal text-[#ff5c0e]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          {progress}% Loading
        </p>
        <p className="sr-only">{label}</p>
      </div>
    </section>
  )
}
