import { HttpTypes } from "@medusajs/types"
import { NextRequest, NextResponse } from "next/server"
import {
  DEFAULT_COUNTRY_CODE,
  isCountryCode,
  stripCountryCodeFromPath,
} from "@lib/util/routes"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
const DEFAULT_REGION = DEFAULT_COUNTRY_CODE
const CACHE_COOKIE_NAME = process.env.CACHE_COOKIE_NAME || "_cba_cache_id"
const LEGACY_CACHE_COOKIE_NAMES = ["_medusa_cache_id"].filter(
  (name) => name !== CACHE_COOKIE_NAME
)
const LAUNCH_STATUS_CACHE_TTL_MS = 3000
const LAUNCH_STATUS_LOCKED_CACHE_TTL_MS = 1000

const launchStatusCache = {
  launched: false as boolean | null,
  checkedAt: 0,
}

function isLaunchGateEnabled() {
  return process.env.LAUNCH_GATE_ENABLED?.trim().toLowerCase() === "true"
}

function isLaunchPath(pathname: string) {
  return pathname === "/launch" || pathname.startsWith("/launch/")
}

async function getCachedLaunchStatus(): Promise<boolean> {
  const now = Date.now()
  const ttl =
    launchStatusCache.launched === true
      ? LAUNCH_STATUS_CACHE_TTL_MS
      : LAUNCH_STATUS_LOCKED_CACHE_TTL_MS
  if (
    launchStatusCache.launched !== null &&
    now - launchStatusCache.checkedAt < ttl
  ) {
    return launchStatusCache.launched
  }

  if (!BACKEND_URL) {
    return false
  }

  try {
    const response = await fetch(`${BACKEND_URL}/store/cba/v1/launch/status`, {
      headers: PUBLISHABLE_API_KEY
        ? { "x-publishable-api-key": PUBLISHABLE_API_KEY }
        : {},
      cache: "no-store",
    })
    if (!response.ok) {
      return launchStatusCache.launched === true
    }
    const json = (await response.json()) as {
      data?: { launched?: boolean }
    }
    const launched = Boolean(json?.data?.launched)
    launchStatusCache.launched = launched
    launchStatusCache.checkedAt = now
    return launched
  } catch {
    return launchStatusCache.launched === true
  }
}

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now(),
}

async function getRegionMap(cacheId: string) {
  const { regionMap, regionMapUpdated } = regionMapCache

  if (!BACKEND_URL) {
    throw new Error(
      "Middleware.ts: Error fetching regions. Did you set up regions in your Medusa Admin and define a MEDUSA_BACKEND_URL environment variable? Note that the variable is no longer named NEXT_PUBLIC_MEDUSA_BACKEND_URL."
    )
  }

  if (
    !regionMap.keys().next().value ||
    regionMapUpdated < Date.now() - 3600 * 1000
  ) {
    // Fetch regions from Medusa. We can't use the JS client here because middleware is running on Edge and the client needs a Node environment.
    const { regions } = await fetch(`${BACKEND_URL}/store/regions`, {
      headers: {
        "x-publishable-api-key": PUBLISHABLE_API_KEY!,
      },
      next: {
        revalidate: 3600,
        tags: [`regions-${cacheId}`],
      },
      cache: "force-cache",
    }).then(async (response) => {
      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.message)
      }

      return json
    })

    if (!regions?.length) {
      throw new Error(
        "No regions found. Please set up regions in your Medusa Admin."
      )
    }

    // Create a map of country codes to regions.
    regions.forEach((region: HttpTypes.StoreRegion) => {
      region.countries?.forEach((c) => {
        regionMapCache.regionMap.set(c.iso_2 ?? "", region)
      })
    })

    regionMapCache.regionMapUpdated = Date.now()
  }

  return regionMapCache.regionMap
}

/**
 * Fetches regions from Medusa and sets the region cookie.
 * @param request
 * @param response
 */
async function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, HttpTypes.StoreRegion | number>
) {
  try {
    let countryCode

    const vercelCountryCode = request.headers
      .get("x-vercel-ip-country")
      ?.toLowerCase()

    const urlCountryCode = request.nextUrl.pathname.split("/")[1]?.toLowerCase()

    if (
      urlCountryCode &&
      isCountryCode(urlCountryCode) &&
      regionMap.has(urlCountryCode)
    ) {
      countryCode = urlCountryCode
    } else if (vercelCountryCode && regionMap.has(vercelCountryCode)) {
      countryCode = vercelCountryCode
    } else if (regionMap.has(DEFAULT_REGION)) {
      countryCode = DEFAULT_REGION
    } else if (regionMap.keys().next().value) {
      countryCode = regionMap.keys().next().value
    }

    return countryCode
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Middleware.ts: Error getting the country code. Did you set up regions in your Medusa Admin and define a MEDUSA_BACKEND_URL environment variable? Note that the variable is no longer named NEXT_PUBLIC_MEDUSA_BACKEND_URL."
      )
    }
  }
}

/**
 * Middleware to handle region selection and onboarding status.
 */
export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.includes(".")) {
    return NextResponse.next()
  }

  if (isLaunchGateEnabled()) {
    const launched = await getCachedLaunchStatus()
    const onLaunchPath = isLaunchPath(request.nextUrl.pathname)

    if (!launched) {
      if (onLaunchPath) {
        return NextResponse.next()
      }
      // Use redirect (not rewrite) so the browser URL becomes /launch.
      // Otherwise location.replace("/") is a same-URL no-op after the ceremony.
      const launchUrl = request.nextUrl.clone()
      launchUrl.pathname = "/launch"
      return NextResponse.redirect(launchUrl)
    }

    if (onLaunchPath) {
      const homeUrl = request.nextUrl.clone()
      homeUrl.pathname = "/"
      homeUrl.search = ""
      return NextResponse.redirect(homeUrl)
    }
  }

  let cacheIdCookie =
    request.cookies.get(CACHE_COOKIE_NAME) ??
    firstRequestCookie(request, LEGACY_CACHE_COOKIE_NAMES)

  let cacheId = cacheIdCookie?.value || crypto.randomUUID()

  const regionMap = await getRegionMap(cacheId)

  const countryCode = regionMap && (await getCountryCode(request, regionMap))
  const firstPathSegment = request.nextUrl.pathname
    .split("/")[1]
    ?.toLowerCase()

  const urlHasCountryCode =
    countryCode && firstPathSegment === countryCode

  if (!countryCode) {
    return new NextResponse(
      "No valid regions configured. Please set up regions with countries in your Medusa Admin.",
      { status: 500 }
    )
  }

  if (urlHasCountryCode) {
    const canonicalUrl = request.nextUrl.clone()
    canonicalUrl.pathname = stripCountryCodeFromPath(
      request.nextUrl.pathname,
      countryCode
    )
    const response = NextResponse.redirect(canonicalUrl, 308)
    if (!cacheIdCookie) {
      response.cookies.set(CACHE_COOKIE_NAME, cacheId, {
        maxAge: 60 * 60 * 24,
      })
    }
    return response
  }

  const rewriteUrl = request.nextUrl.clone()
  rewriteUrl.pathname =
    request.nextUrl.pathname === "/"
      ? `/${countryCode}`
      : `/${countryCode}${request.nextUrl.pathname}`

  const response = NextResponse.rewrite(rewriteUrl)
  if (!cacheIdCookie) {
    response.cookies.set(CACHE_COOKIE_NAME, cacheId, {
      maxAge: 60 * 60 * 24,
    })
  }

  return response
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}

function firstRequestCookie(request: NextRequest, names: string[]) {
  for (const name of names) {
    const cookie = request.cookies.get(name)
    if (cookie) {
      return cookie
    }
  }
  return undefined
}
