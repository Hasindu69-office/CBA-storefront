"use client"

import { LAUNCH_KEY_STORAGE_KEY } from "@lib/launch/config"

export function readLaunchKey(): string {
  if (typeof window === "undefined") {
    return ""
  }
  return sessionStorage.getItem(LAUNCH_KEY_STORAGE_KEY)?.trim() || ""
}

export function storeLaunchKey(secret: string) {
  if (typeof window === "undefined") {
    return
  }
  const value = secret.trim()
  if (!value) {
    return
  }
  sessionStorage.setItem(LAUNCH_KEY_STORAGE_KEY, value)
}

export function captureLaunchKeyFromSearch(search: string) {
  const params = new URLSearchParams(search)
  const key =
    params.get("launch_key")?.trim() || params.get("launchKey")?.trim() || ""
  if (key) {
    storeLaunchKey(key)
  }
  return key
}
