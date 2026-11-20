import {
  getLaunchUnlockSecret,
  getMedusaBackendUrl,
  getMedusaLaunchHeaders,
  isLaunchGateEnabled,
} from "./config"

export type LaunchStatusPayload = {
  launched: boolean
  gate_enabled: boolean
}

type MedusaLaunchResponse = {
  success?: boolean
  data?: { launched?: boolean }
  error?: { message?: string }
}

export async function fetchBackendLaunchStatus(): Promise<boolean> {
  const backendUrl = getMedusaBackendUrl()
  if (!backendUrl) {
    return false
  }

  const response = await fetch(`${backendUrl}/store/cba/v1/launch/status`, {
    method: "GET",
    headers: getMedusaLaunchHeaders(),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Launch status request failed (${response.status}).`)
  }

  const json = (await response.json()) as MedusaLaunchResponse
  return Boolean(json?.data?.launched)
}

export async function getLaunchStatusPayload(): Promise<LaunchStatusPayload> {
  const gate_enabled = isLaunchGateEnabled()
  if (!gate_enabled) {
    return { launched: true, gate_enabled: false }
  }

  const launched = await fetchBackendLaunchStatus()
  return { launched, gate_enabled: true }
}

export async function postBackendLaunchAction(
  action: "unlock" | "reset",
  secret: string
): Promise<{ launched: boolean }> {
  const backendUrl = getMedusaBackendUrl()
  if (!backendUrl) {
    throw new Error("MEDUSA_BACKEND_URL is not configured.")
  }

  const expected = getLaunchUnlockSecret()
  if (!expected) {
    throw new Error("LAUNCH_UNLOCK_SECRET is not configured.")
  }
  if (!secret || secret !== expected) {
    const error = new Error("Invalid launch key.")
    ;(error as Error & { status?: number }).status = 401
    throw error
  }

  const response = await fetch(`${backendUrl}/store/cba/v1/launch/${action}`, {
    method: "POST",
    headers: getMedusaLaunchHeaders({
      "x-launch-secret": secret,
    }),
    body: JSON.stringify({ secret }),
    cache: "no-store",
  })

  const json = (await response.json().catch(() => ({}))) as MedusaLaunchResponse
  if (!response.ok || json.success === false) {
    const error = new Error(
      json.error?.message || `Launch ${action} failed (${response.status}).`
    )
    ;(error as Error & { status?: number }).status = response.status
    throw error
  }

  return { launched: Boolean(json.data?.launched) }
}
