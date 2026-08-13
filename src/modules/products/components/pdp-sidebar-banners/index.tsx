import type { PdpBannerContent } from "@lib/data/pdp-banners"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type PdpBannerLayout = "sidebar" | "standalone"

type PdpSidebarBannersProps = {
  banners: PdpBannerContent
  layout?: PdpBannerLayout
}

export default function PdpSidebarBanners({
  banners,
  layout = "sidebar",
}: PdpSidebarBannersProps) {
  const items = [banners.primary, banners.secondary].filter(Boolean)

  if (!items.length) {
    return null
  }

  const isStandalone = layout === "standalone"

  return (
    <aside
      aria-label={isStandalone ? "Product promotions" : undefined}
      className={
        isStandalone
          ? items.length > 1
            ? "grid gap-4 small:grid-cols-2"
            : "flex flex-col gap-4"
          : "flex h-full min-h-0 flex-col gap-4"
      }
    >
      {items.map((banner) => (
        <PdpSidebarBannerCard
          key={banner!.placement}
          banner={banner!}
          layout={layout}
          fillHeight={!isStandalone && items.length > 1}
          standaloneCount={isStandalone ? items.length : undefined}
        />
      ))}
    </aside>
  )
}

function PdpSidebarBannerCard({
  banner,
  layout,
  fillHeight = false,
  standaloneCount,
}: {
  banner: NonNullable<PdpBannerContent["primary"]>
  layout: PdpBannerLayout
  fillHeight?: boolean
  standaloneCount?: number
}) {
  const image = (
    <img
      src={banner.imageUrl}
      alt={banner.imageAltText}
      className="h-full w-full object-cover"
    />
  )

  const className = getBannerCardClassName(layout, fillHeight, standaloneCount)

  if (banner.href) {
    return (
      <LocalizedClientLink href={banner.href} className={className}>
        {image}
      </LocalizedClientLink>
    )
  }

  return <div className={className}>{image}</div>
}

function getBannerCardClassName(
  layout: PdpBannerLayout,
  fillHeight: boolean,
  standaloneCount?: number
) {
  const base =
    "block overflow-hidden rounded-[16px] bg-[#24262b] transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"

  if (layout === "standalone") {
    if (standaloneCount === 1) {
      return `${base} aspect-[21/9] w-full small:aspect-[3/1]`
    }
    return `${base} aspect-[16/10] w-full`
  }

  if (fillHeight) {
    return `${base} min-h-0 flex-1`
  }

  return `${base} aspect-[298/315] w-full`
}
