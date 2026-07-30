"use client"

import { toast } from "sonner"
import type { ExternalToast, ToastT } from "sonner"

type ToastId = ToastT["id"]
type ToastOptions = ExternalToast

const SENSITIVE_PATTERN =
  /(bearer\s+[a-z0-9._-]+|authorization|cookie|password|secret|token|api[_-]?key|stack|trace|database|sql|postgres|redis|smtp|sendgrid|stripe_[a-z]*_[a-z0-9]+)/i

const NETWORK_PATTERN =
  /(network|fetch|failed to fetch|econnrefused|enotfound|timeout|timed out|no response|socket|offline)/i

const DEFAULT_ERROR = "We could not complete the request. Please try again."

export function clientSafeErrorMessage(
  error: unknown,
  fallback = DEFAULT_ERROR
) {
  const message = rawErrorMessage(error).trim()

  if (!message) {
    return fallback
  }

  if (NETWORK_PATTERN.test(message)) {
    return "We could not reach the service. Please check your connection and try again."
  }

  if (SENSITIVE_PATTERN.test(message) || looksLikeStackTrace(message)) {
    return fallback
  }

  return normalizeSentence(message).slice(0, 220)
}

export const notify = {
  success(message: string, options?: ToastOptions) {
    return toast.success(message, { duration: 3500, ...options })
  },

  error(errorOrMessage: unknown, fallback = DEFAULT_ERROR, options?: ToastOptions) {
    return toast.error(clientSafeErrorMessage(errorOrMessage, fallback), {
      duration: 6500,
      ...options,
    })
  },

  info(message: string, options?: ToastOptions) {
    return toast.info(message, { duration: 4500, ...options })
  },

  warning(message: string, options?: ToastOptions) {
    return toast.warning(message, { duration: 5500, ...options })
  },

  loading(message: string, options?: ToastOptions) {
    return toast.loading(message, { duration: Infinity, ...options })
  },

  promise<T>(
    promise: Promise<T>,
    messages: Parameters<typeof toast.promise<T>>[1]
  ) {
    return toast.promise(promise, messages)
  },

  dismiss(id?: ToastId) {
    toast.dismiss(id)
  },
}

function rawErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>
    const nested = record.error
    if (nested && typeof nested === "object") {
      const nestedMessage = (nested as Record<string, unknown>).message
      if (typeof nestedMessage === "string") {
        return nestedMessage
      }
    }
    if (typeof record.message === "string") {
      return record.message
    }
  }

  return ""
}

function looksLikeStackTrace(message: string) {
  return /\n\s*at\s+/.test(message) || /https?:\/\/\S+:\d+:\d+/.test(message)
}

function normalizeSentence(message: string) {
  const normalized = message.replace(/\s+/g, " ").trim()
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : ""
}
