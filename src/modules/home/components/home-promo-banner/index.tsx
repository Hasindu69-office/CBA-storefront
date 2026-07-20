import Image from "next/image"

import type { HomepageCmsSection } from "@lib/data/homepage"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type HomePromoBannerProps = {
  sections: HomepageCmsSection[]
}

const PROMO_BANNER_PLACEMENT = "after_category_slider"
const FALLBACK_BANNER_IMAGE = "/images/bannerimg-trimmed.png"
const FALLBACK_BANNER_ALT = "CBA Smart Business Tech promotion"

const HomePromoBanner = ({ sections }: HomePromoBannerProps) => {
  const banner = sections
    .filter(
      (section) =>
        section.type === "promo_banner" &&
        section.config?.placement === PROMO_BANNER_PLACEMENT
    )
    .sort((left, right) => left.sort_order - right.sort_order)[0]

  const item = banner?.items
    ?.slice()
    .sort((left, right) => left.sort_order - right.sort_order)
    .find((entry) => entry.media?.url || entry.media_url)

  const imageUrl =
    item?.media?.url ?? item?.media_url ?? (!banner ? FALLBACK_BANNER_IMAGE : null)

  if (!imageUrl) {
    return null
  }

  const image = (
    <Image
      src={imageUrl}
      alt={
        item?.media?.alt_text ??
        item?.media_alt_text ??
        item?.title ??
        FALLBACK_BANNER_ALT
      }
      width={1627}
      height={512}
      sizes="(min-width: 1280px) 1280px, (min-width: 768px) calc(100vw - 96px), calc(100vw - 32px)"
      className="h-auto w-full"
    />
  )

  return (
    <section className="-mt-14 bg-white pt-0 pb-1 small:-mt-16 small:pb-2" aria-label="Homepage promotion">
      <div className="content-container">
        {isSafeStorefrontPath(item?.url) ? (
          <LocalizedClientLink
            href={item!.url!.trim()}
            className="block w-full overflow-hidden rounded-[14px] shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 small:rounded-[18px]"
          >
            {image}
          </LocalizedClientLink>
        ) : (
          <div className="w-full overflow-hidden rounded-[14px] shadow-sm small:rounded-[18px]">
            {image}
          </div>
        )}
      </div>
    </section>
  )
}

function isSafeStorefrontPath(value?: string | null) {
  const path = value?.trim()
  return Boolean(path && path.startsWith("/") && !path.startsWith("//") && !path.includes("\\"))
}

export default HomePromoBanner
