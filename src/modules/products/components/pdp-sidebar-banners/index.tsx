import type { PdpBannerContent } from "@lib/data/pdp-banners"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type PdpSidebarBannersProps = {
  banners: PdpBannerContent
  matchCompanionHeight?: boolean
}

export default function PdpSidebarBanners({
  banners,
  matchCompanionHeight = false,
}: PdpSidebarBannersProps) {
  const items = [banners.primary, banners.secondary].filter(Boolean)

  if (!items.length) {
    return null
  }

  return (
    <aside
      className={
        matchCompanionHeight
          ? "flex h-full min-h-0 flex-col gap-4"
          : "flex flex-col gap-4"
      }
    >
      {items.map((banner) => (
        <PdpSidebarBannerCard
          key={banner!.placement}
          banner={banner!}
          fillHeight={matchCompanionHeight && items.length > 1}
        />
      ))}
    </aside>
  )
}

function PdpSidebarBannerCard({
  banner,
  fillHeight = false,
}: {
  banner: NonNullable<PdpBannerContent["primary"]>
  fillHeight?: boolean
}) {
  const image = (
    <img
      src={banner.imageUrl}
      alt={banner.imageAltText}
      className="h-full w-full object-cover"
    />
  )

  const className = fillHeight
    ? "block min-h-0 flex-1 overflow-hidden rounded-[16px] bg-[#24262b] transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
    : "block aspect-[298/315] w-full overflow-hidden rounded-[16px] bg-[#24262b] transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"

  if (banner.href) {
    return (
      <LocalizedClientLink href={banner.href} className={className}>
        {image}
      </LocalizedClientLink>
    )
  }

  return <div className={className}>{image}</div>
}
