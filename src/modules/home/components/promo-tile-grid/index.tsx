import Image from "next/image"

import type { HomepageCmsItem, HomepageCmsSection } from "@lib/data/homepage"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type HomepagePromoTileGridProps = {
  sections: HomepageCmsSection[]
}

const PLACEMENT = "homepage_promo_tile_grid"
const FALLBACK_TILES = [
  {
    title: "Print. Scan. Performance.",
    description:
      "Reliable access control and ID printing solutions for offices, institutions and business premises.",
    eyebrow: "",
    image: "/images/Printerimage.png",
    alt: "Office multifunction printer",
    itemClassName: "",
    cardClassName: "medium:aspect-[1.9/1]",
    textClassName: "max-w-[220px] md:max-w-[250px] medium:max-w-[280px] large:ml-16 large:mt-16",
    titleClassName: "text-[23px] font-normal sm:text-[24px] md:text-[26px] medium:text-[30px] large:text-[31px] text-white",
    descriptionClassName: "text-white/90 uppercase",
  },
  {
    title: "Fast Counting. Trusted Accuracy.",
    description: "",
    eyebrow: "",
    image: "/images/projectorimg.png",
    alt: "Portable projector",
    itemClassName: "medium:col-span-1",
    cardClassName: "medium:aspect-[0.92/1]",
    textClassName: "mt-6 max-w-[250px] text-left md:mt-8 md:max-w-[280px] medium:mx-auto medium:mt-10 medium:max-w-[300px] medium:text-center",
    titleClassName: "text-[24px] font-bold sm:text-[26px] md:text-[27px] medium:text-[30px] text-white",
    descriptionClassName: "text-white/90",
  },
  {
    title: "Work Smarter. Stay Equipped.",
    description: "Mega Power in mini size",
    eyebrow: "",
    image: "/images/ipadimg.png",
    alt: "Tablet with keyboard case",
    itemClassName: "medium:basis-[40%]",
    cardClassName: "medium:aspect-[2.78/1]",
    textClassName: "mt-5 max-w-[245px] md:mt-6 md:max-w-[270px] medium:mt-7 medium:max-w-[280px]",
    titleClassName: "text-[24px] font-bold sm:text-[26px] md:text-[27px] medium:text-[30px] text-black",
    descriptionClassName: "text-black/55",
  },
  {
    title: "Count with Confidence",
    description: "",
    eyebrow: "",
    image: "/images/moneycounter.png",
    alt: "Money counting machine",
    itemClassName: "medium:basis-[calc((60%_-_48px)/2)]",
    cardClassName: "medium:aspect-[1.42/1]",
    textClassName: "mt-5 max-w-[190px] md:mt-6 md:max-w-[205px] medium:mt-7 medium:max-w-[210px]",
    titleClassName: "text-[19px] font-bold md:text-[20px] medium:text-[21px] text-white",
    descriptionClassName: "text-white/80",
  },
  {
    title: "Work neat. Stay secure.",
    description: "",
    eyebrow: "SHREDDERS",
    image: "/images/shredder.png",
    alt: "Office paper shredder",
    itemClassName: "medium:basis-[calc((60%_-_48px)/2)]",
    cardClassName: "medium:aspect-[1.42/1]",
    textClassName: "mt-5 max-w-[190px] md:max-w-[200px] medium:mt-6 medium:max-w-[205px]",
    titleClassName: "text-[19px] font-bold md:text-[20px] medium:text-[21px] text-black",
    descriptionClassName: "text-black/65",
  },
] as const

const HomepagePromoTileGrid = ({ sections }: HomepagePromoTileGridProps) => {
  const section = sections.find(isPromoTileGridSection)
  if (!section) {
    return null
  }

  const items = section.items
    .filter((item) => item.config?.placement === PLACEMENT)
    .slice()
    .sort((left, right) => left.sort_order - right.sort_order)
    .slice(0, FALLBACK_TILES.length)

  if (items.length !== FALLBACK_TILES.length || items.some((item) => !item.title)) {
    return null
  }

  return (
    <section
      className="bg-white pb-8 pt-1.5 sm:pb-9 md:pb-10 medium:pb-12 medium:pt-2 large:pt-0"
      aria-label="Homepage product promotions"
    >
      <div className="content-container">
        <div className="grid w-full gap-4 sm:gap-5 md:gap-6 medium:gap-7">
          <div className="grid gap-4 sm:gap-5 md:gap-6 medium:grid-cols-[minmax(0,2.08fr)_minmax(0,1fr)] medium:gap-7">
            {items.slice(0, 2).map((item, index) => (
              <PromoTile key={tileKey(item, index)} item={item} index={index} priority />
            ))}
          </div>
          <div className="grid gap-4 sm:gap-5 md:gap-6 medium:grid-cols-[minmax(0,2.12fr)_minmax(0,1fr)_minmax(0,1fr)] medium:gap-7">
            {items.slice(2).map((item, offset) => (
              <PromoTile
                key={tileKey(item, offset + 2)}
                item={item}
                index={offset + 2}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function PromoTile({
  item,
  index,
  priority = false,
}: {
  item: HomepageCmsItem
  index: number
  priority?: boolean
}) {
  const fallback = FALLBACK_TILES[index]
  const imageUrl = item.media?.url ?? item.media_url ?? fallback.image
  const eyebrow = stringValue(item.config?.eyebrow) || fallback.eyebrow
  const content = (
    <article
      className={[
        "group relative h-full w-full aspect-[1.55/1] min-h-[190px] overflow-hidden rounded-[18px] bg-[#f4f4f4] px-5 py-5 shadow-sm sm:min-h-[198px] sm:px-6 md:min-h-[206px] medium:aspect-[1.45/1] medium:px-7 medium:py-6",
        "transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(15,23,42,0.12)]",
        fallback.cardClassName,
      ].join(" ")}
    >
      <Image
        src={imageUrl}
        alt={item.media?.alt_text ?? item.media_alt_text ?? fallback.alt}
        fill
        priority={priority}
        sizes={imageSizes(index)}
        className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.012]"
      />
      <div className={["relative z-10", fallback.textClassName].join(" ")}>
        {eyebrow && (
          <p className="mb-1.5 text-[10px] font-medium uppercase leading-4 tracking-normal text-current">
            {eyebrow}
          </p>
        )}
        <h2 className={["leading-[1.08] tracking-normal", fallback.titleClassName].join(" ")}>
          {item.title}
        </h2>
        {(item.subtitle || fallback.description) && (
          <p className={["mt-4 text-[11px] leading-[1.55] tracking-normal md:mt-5 medium:mt-7", fallback.descriptionClassName].join(" ")}>
            {item.subtitle || fallback.description}
          </p>
        )}
      </div>
    </article>
  )

  if (!isSafeStorefrontPath(item.url)) {
    return <div className={["h-full w-full", fallback.itemClassName].join(" ")}>{content}</div>
  }

  return (
    <LocalizedClientLink
      href={item.url!.trim()}
      className={[
        "block h-full w-full rounded-[18px] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
        fallback.itemClassName,
      ].join(" ")}
    >
      {content}
    </LocalizedClientLink>
  )
}

function isPromoTileGridSection(section: HomepageCmsSection) {
  return section.type === "promo_banner" && section.config?.placement === PLACEMENT
}

function tileKey(item: HomepageCmsItem, index: number) {
  return `${item.reference_id ?? item.media_url ?? item.title ?? "tile"}-${index}`
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : ""
}

function isSafeStorefrontPath(value?: string | null) {
  const path = value?.trim()
  return Boolean(path && path.startsWith("/") && !path.startsWith("//") && !path.includes("\\"))
}

function imageSizes(index: number) {
  if (index === 0) {
    return "(min-width: 1280px) 774px, (min-width: 1024px) 66vw, calc(100vw - 32px)"
  }
  if (index === 1) {
    return "(min-width: 1280px) 372px, (min-width: 1024px) 33vw, calc(100vw - 32px)"
  }
  if (index === 2) {
    return "(min-width: 1280px) 572px, (min-width: 1024px) 43vw, calc(100vw - 32px)"
  }
  return "(min-width: 1280px) 272px, (min-width: 1024px) 28vw, calc(100vw - 32px)"
}

export default HomepagePromoTileGrid
