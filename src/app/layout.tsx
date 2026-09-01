import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import Script from "next/script"
import NotificationProvider from "@modules/common/components/notification-provider"
import RouteScrollRestoration from "@modules/layout/components/route-scroll-restoration"
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
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1361822756100417');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1361822756100417&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        <main className="relative w-full min-h-screen bg-white">{props.children}</main>
        <RouteScrollRestoration />
        <NotificationProvider />
      </body>
    </html>
  )
}
