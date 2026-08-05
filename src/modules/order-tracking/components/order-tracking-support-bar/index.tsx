import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function OrderTrackingSupportBar() {
  return (
    <section className="rounded-[8px] border border-[#eeeeee] bg-[#fafbfc] px-5 py-6 small:px-6">
      <div className="flex flex-col gap-4 small:flex-row small:items-center small:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-[16px] font-semibold text-[#151922]">Need help?</h2>
          <p className="mt-1 text-[14px] leading-6 text-[#5d6470]">
            Questions about delivery or your order? Our support team can help with
            tracking, delivery updates, and order changes.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <LocalizedClientLink
            href="/contact"
            className="inline-flex items-center justify-center rounded-md bg-[#ff5c0e] px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#e6520c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5c0e]"
          >
            Contact support
          </LocalizedClientLink>
          <span className="inline-flex items-center rounded-md border border-[#e5e7eb] bg-white px-4 py-2.5 text-[13px] font-medium text-[#8a919c]">
            Returns — coming later
          </span>
        </div>
      </div>
    </section>
  )
}
