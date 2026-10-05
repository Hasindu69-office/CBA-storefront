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

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
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
