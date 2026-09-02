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
      className={`inline-flex max-w-full items-center gap-1.5 whitespace-nowrap text-[10px] font-bold leading-4 text-[#6b7280] ${className}`}
    >
      <span>{amount}</span>
      <span className="shrink-0 font-semibold">with</span>
      {logo ? (
        <span className="relative inline-flex h-[13px] w-[38px] shrink-0 align-middle">
          <Image
            src={logo}
            alt={alt}
            fill
            sizes="38px"
            className="object-contain"
          />
        </span>
      ) : (
        <span className="shrink-0 font-black text-[#7a4dd8]">
          {branding?.label || "Koko"}
        </span>
      )}
    </span>
  )
}
