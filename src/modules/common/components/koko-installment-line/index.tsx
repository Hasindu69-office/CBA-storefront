import type { KokoCheckoutBranding } from "@lib/data/koko-branding"
import Image from "next/image"

type KokoInstallmentLineProps = {
  installment: string
  branding?: KokoCheckoutBranding | null
  className?: string
}

export default function KokoInstallmentLine({
  installment,
  branding,
  className = "",
}: KokoInstallmentLineProps) {
  const logo = branding?.image_url?.trim()
  const alt = branding?.image_alt_text?.trim() || branding?.label?.trim() || "Koko"

  return (
    <p
      className={`flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[15px] leading-6 text-[#111111] ${className}`}
    >
      <span>or 3 x</span>
      <span className="font-black">{installment}</span>
      <span>with</span>
      {logo ? (
        <span className="relative inline-flex h-[18px] w-[52px] align-middle">
          <Image
            src={logo}
            alt={alt}
            fill
            sizes="52px"
            className="object-contain"
          />
        </span>
      ) : (
        <span className="font-black text-[#7a4dd8]">{branding?.label || "Koko"}</span>
      )}
    </p>
  )
}
