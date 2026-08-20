import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import NotificationProvider from "@modules/common/components/notification-provider"
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
        <main className="relative w-full min-h-screen bg-white">{props.children}</main>
        <NotificationProvider />
      </body>
    </html>
  )
}
