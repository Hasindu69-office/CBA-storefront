import { ShoppingCartIcon } from "@modules/layout/components/cba-icons"

type EcommerceLoaderProps = {
  label?: string
}

const productTileDelays = ["0ms", "140ms", "280ms"]

export default function EcommerceLoader({
  label = "Loading store",
}: EcommerceLoaderProps) {
  return (
    <section
      className="fixed inset-0 z-[9999] flex h-screen w-screen items-center justify-center bg-white px-4 py-14 text-[#111820]"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <div className="flex w-full max-w-[360px] flex-col items-center text-center">
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

        <p className="mt-5 text-[13px] font-semibold uppercase tracking-normal text-[#ff5c0e]">
          Loading
        </p>
        <p className="sr-only">{label}</p>

        <div className="mt-6 grid w-full grid-cols-3 gap-3" aria-hidden="true">
          {productTileDelays.map((animationDelay, index) => (
            <div
              key={index}
              className="h-20 rounded-[8px] border border-[#eef0f2] bg-white p-2 shadow-[0_12px_30px_rgba(17,24,32,0.08)] motion-safe:animate-pulse motion-reduce:animate-none"
              style={{ animationDelay }}
            >
              <div className="h-9 rounded-[6px] bg-[#f2f4f6]" />
              <div className="mt-3 h-2 rounded-full bg-[#ff5c0e]/25" />
              <div className="mt-2 h-2 w-2/3 rounded-full bg-[#111820]/10" />
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-2" aria-hidden="true">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="h-2.5 w-2.5 rounded-full bg-[#ff5c0e] motion-safe:animate-bounce motion-reduce:animate-none"
              style={{ animationDelay: `${dot * 120}ms` }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
