export const LAUNCH_KEY_STORAGE_KEY = "cba_launch_unlock_secret"
export const LAUNCH_STATUS_POLL_MS = 3000

export function isLaunchGateEnabled(): boolean {
  return process.env.LAUNCH_GATE_ENABLED?.trim().toLowerCase() === "true"
}

export function getLaunchUnlockSecret(): string {
  return process.env.LAUNCH_UNLOCK_SECRET?.trim() || ""
}

export function isLaunchResetAllowed(): boolean {
  return process.env.LAUNCH_ALLOW_RESET?.trim().toLowerCase() === "true"
}

export function getMedusaLaunchHeaders(
  extra?: HeadersInit
): Record<string, string> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  }
  const publishable = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY?.trim()
  if (publishable) {
    headers["x-publishable-api-key"] = publishable
  }
  if (extra) {
    const entries =
      extra instanceof Headers
        ? Array.from(extra.entries())
        : Array.isArray(extra)
          ? extra
          : Object.entries(extra)
    for (const [key, value] of entries) {
      headers[key] = String(value)
    }
  }
  return headers
}

export function getMedusaBackendUrl(): string {
  return (
    process.env.MEDUSA_BACKEND_URL?.trim() ||
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL?.trim() ||
    ""
  )
}
