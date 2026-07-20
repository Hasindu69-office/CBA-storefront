import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  icons: {
    icon: "/images/faviconCBA_preview.png",
    shortcut: "/images/faviconCBA_preview.png",
    apple: "/images/faviconCBA_preview.png",
  },
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <body>
        <main className="relative w-full min-h-screen bg-white">{props.children}</main>
      </body>
    </html>
  )
}
