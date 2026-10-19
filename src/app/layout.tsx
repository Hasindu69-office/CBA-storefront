import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import NotificationProvider from "@modules/common/components/notification-provider"
import HomeNavigationLoader from "@modules/common/components/home-navigation-loader"
import RouteScrollRestoration from "@modules/layout/components/route-scroll-restoration"
import FloatingUtilityLayer from "@modules/layout/components/floating-utility-layer"
import GtmBootstrap from "@modules/analytics/gtm-bootstrap"
import GtmPageViewTrackerBoundary from "@modules/analytics/gtm-page-view-tracker-boundary"
import MetaPixelBootstrap from "@modules/analytics/meta-pixel-bootstrap"
import MetaPageViewTrackerBoundary from "@modules/analytics/meta-page-view-tracker-boundary"
import { getStorefrontTypography } from "@lib/data/typography"
import { customFontFaceCss, typographyCssVariables } from "@lib/util/typography"
import type { CSSProperties } from "react"
import "@fontsource-variable/inter/wght.css"
import "@fontsource-variable/noto-sans-sinhala/wght.css"
import "@fontsource-variable/noto-sans-tamil/wght.css"
import "styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    images: [{ url: "/favicon.ico" }],
  },
  twitter: {
    card: "summary",
    images: ["/favicon.ico"],
  },
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const typography = await getStorefrontTypography()
  const variables = typographyCssVariables(typography) as CSSProperties
  const customFaces = customFontFaceCss(typography)
  return (
    <html lang={typography.locale} data-mode="light" style={variables}>
      <head>
        {typography.google_stylesheet_url && <><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" /><link rel="stylesheet" href={typography.google_stylesheet_url} /></>}
        {customFaces && <style>{customFaces}</style>}
      </head>
      <body>
        <GtmBootstrap />
        <GtmPageViewTrackerBoundary />
        <MetaPixelBootstrap />
        <MetaPageViewTrackerBoundary />
        <main className="relative w-full min-h-screen bg-white">{props.children}</main>
        <HomeNavigationLoader />
        <RouteScrollRestoration />
        <NotificationProvider />
        <FloatingUtilityLayer />
      </body>
    </html>
  )
}
