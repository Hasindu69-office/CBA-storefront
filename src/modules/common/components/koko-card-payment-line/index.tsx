import type { KokoCheckoutBranding } from "@lib/data/koko-branding"
import Image from "next/image"

type KokoCardPaymentLineProps = {
  amount: string
  branding?: KokoCheckoutBranding | null
  className?: string
}

export default function KokoCardPaymentLine({
  amount,
  branding,
  className = "",
}: KokoCardPaymentLineProps) {
  const logo = branding?.image_url?.trim()
  const alt = branding?.image_alt_text?.trim() || branding?.label?.trim() || "Koko"

  return (
    <span
      className={`inline-flex min-w-0 max-w-full flex-wrap items-center gap-x-1.5 gap-y-1 whitespace-normal text-[10px] font-bold leading-4 text-[#6b7280] ${className}`}
    >
      <span className="min-w-0 break-words">{amount}</span>
      <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap">
        <span className="font-semibold">with</span>
        {logo ? (
          <span className="relative inline-flex h-3 w-[35px] shrink-0 align-middle small:h-[13px] small:w-[38px]">
            <Image
              src={logo}
              alt={alt}
              fill
              sizes="(max-width: 639px) 35px, 38px"
              className="object-contain"
            />
          </span>
        ) : (
          <span className="font-black text-[#7a4dd8]">
            {branding?.label || "Koko"}
          </span>
        )}
      </span>
    </span>
  )
}
