import type { SVGProps } from "react"

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number
}

const baseProps = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
})

export function SearchIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

export function UserIcon({ size = 26, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export function HeartIcon({ size = 26, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />
    </svg>
  )
}

export function ShoppingCartIcon({ size = 26, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 2-1.6L22 6H6" />
    </svg>
  )
}

export function HomeIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
    </svg>
  )
}

export function StoreIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <path d="M4 10h16" />
      <path d="M5 10l1-6h12l1 6" />
      <path d="M6 10v10h12V10" />
      <path d="M9 20v-5h6v5" />
      <path d="M6 10a3 3 0 0 0 6 0" />
      <path d="M12 10a3 3 0 0 0 6 0" />
    </svg>
  )
}

export function PhoneIcon({ size = 14, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2.1Z" />
    </svg>
  )
}

export function HeadphonesIcon({ size = 14, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3v5Z" />
      <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v5Z" />
    </svg>
  )
}

export function TruckIcon({ size = 14, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <path d="M10 17h4V5H2v12h3" />
      <path d="M14 8h4l4 4v5h-3" />
      <circle cx="7.5" cy="17.5" r="2.5" />
      <circle cx="16.5" cy="17.5" r="2.5" />
    </svg>
  )
}

export function FileTextIcon({ size = 14, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </svg>
  )
}

export function CoinsIcon({ size = 14, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <circle cx="8" cy="8" r="6" />
      <path d="M18.1 10.4A6 6 0 1 1 10.4 18" />
      <path d="M8 6v4" />
      <path d="M6 8h4" />
    </svg>
  )
}

export function ChevronDownIcon({ size = 14, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export function LayoutGridIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

export function MenuIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  )
}

export function XIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

export function TagIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg {...baseProps(size)} {...props}>
      <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </svg>
  )
}
