import Script from "next/script"
import { getGtmId, isValidGtmId } from "@lib/analytics/gtm"

/**
 * Loads the Google Tag Manager base snippet once for the app.
 * Noscript iframe is rendered first so it sits immediately after <body>.
 * SPA route changes use GtmPageViewTracker → virtualPageView.
 */
export default function GtmBootstrap() {
  const gtmId = getGtmId()

  if (!isValidGtmId(gtmId)) {
    return null
  }

  return (
    <>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(gtmId)}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
          title="Google Tag Manager"
        />
      </noscript>
      <Script id="google-tag-manager" strategy="afterInteractive">
        {`
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');
`}
      </Script>
    </>
  )
}
