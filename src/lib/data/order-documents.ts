"use server"

import { sdk } from "@lib/config"
import {
  getAuthHeaders,
  getGuestTrackingSessionToken,
  getReturnIntakeHeaders,
} from "./cookies"
import { establishGuestSessionFromConfirmationDetailed } from "./order-tracking"
import type {
  CbaDocumentDownload,
  CbaOrderDocument,
  CbaOrderDocumentTypeFilter,
} from "types/order-documents"

export type OrderReceiptLookupResult =
  | { status: "ready"; receipt: CbaOrderDocument }
  | { status: "pending"; message: string }
  | { status: "error"; message: string }

export type OrderDocumentDownloadResult =
  | { ok: true; download: CbaDocumentDownload }
  | { ok: false; message: string }

function extractApiErrorMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== "object") {
    return fallback
  }

  const anyError = error as {
    message?: unknown
    code?: unknown
    error?: string | { message?: unknown; code?: unknown }
    response?: { data?: unknown }
    data?: unknown
  }

  const candidates: unknown[] = [
    anyError.error &&
    typeof anyError.error === "object"
      ? anyError.error.message
      : undefined,
    typeof anyError.error === "string" ? anyError.error : undefined,
    anyError.message,
    (anyError.response?.data as { message?: unknown } | undefined)?.message,
    (anyError.response?.data as { error?: { message?: unknown } } | undefined)
      ?.error?.message,
    (anyError.data as { message?: unknown } | undefined)?.message,
  ]

  for (const candidate of candidates) {
    const text = String(candidate ?? "").trim()
    if (!text) continue
    if (/^bad request$/i.test(text)) continue
    return text.slice(0, 240)
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim().slice(0, 240)
  }

  return fallback
}

export async function listAccountDocuments(params?: {
  limit?: number
  offset?: number
  type?: CbaOrderDocumentTypeFilter
}) {
  const headers = await getAuthHeaders()
  if (!("authorization" in headers)) {
    return null
  }

  const limit = params?.limit ?? 20
  const offset = params?.offset ?? 0
  const query: Record<string, string | number> = { limit, offset }
  if (params?.type) {
    query.type = params.type
  }

  return sdk.client
    .fetch<{
      success: boolean
      documents: CbaOrderDocument[]
      count: number
      limit: number
      offset: number
    }>("/store/cba/v1/account/documents", {
      method: "GET",
      query,
      headers,
      cache: "no-store",
    })
    .then((result) => result)
    .catch(() => ({
      success: false as const,
      documents: [] as CbaOrderDocument[],
      count: 0,
      limit,
      offset,
    }))
}

export async function listOrderDocuments(orderId: string) {
  if (!/^order_[A-Za-z0-9]+$/.test(orderId)) {
    return null
  }

  const headers = await getReturnIntakeHeaders()
  const hasAuth =
    "authorization" in headers || "x-cba-guest-tracking-token" in headers
  if (!hasAuth) {
    return null
  }

  return sdk.client
    .fetch<{
      success: boolean
      documents: CbaOrderDocument[]
    }>(`/store/cba/v1/orders/${orderId}/documents`, {
      method: "GET",
      headers,
      cache: "no-store",
    })
    .then((result) => result)
    .catch(async () => {
      const auth = await getAuthHeaders()
      if (!("authorization" in auth)) return null
      return sdk.client
        .fetch<{
          success: boolean
          documents: CbaOrderDocument[]
        }>(`/store/cba/v1/account/orders/${orderId}/documents`, {
          method: "GET",
          headers: auth,
          cache: "no-store",
        })
        .then((result) => result)
        .catch(() => null)
    })
}

async function listOrderDocumentsDetailed(orderId: string): Promise<{
  documents: CbaOrderDocument[]
  error?: string
}> {
  if (!/^order_[A-Za-z0-9]+$/.test(orderId)) {
    return { documents: [], error: "Invalid order id." }
  }

  const session = await establishGuestSessionFromConfirmationDetailed(orderId)
  if (!session.ok) {
    const headers = await getReturnIntakeHeaders()
    const hasAuth =
      "authorization" in headers || "x-cba-guest-tracking-token" in headers
    if (!hasAuth) {
      return { documents: [], error: session.error }
    }
  }

  const headers = await getReturnIntakeHeaders()
  const hasAuth =
    "authorization" in headers || "x-cba-guest-tracking-token" in headers
  if (!hasAuth) {
    return {
      documents: [],
      error:
        "Sign in or verify your order to download the receipt. Guest download session is missing.",
    }
  }

  try {
    const result = await sdk.client.fetch<{
      success: boolean
      documents: CbaOrderDocument[]
      message?: string
      error?: string | { message?: string }
    }>(`/store/cba/v1/orders/${orderId}/documents`, {
      method: "GET",
      headers,
      cache: "no-store",
    })
    return { documents: result.documents ?? [] }
  } catch (error) {
    const auth = await getAuthHeaders()
    if ("authorization" in auth) {
      try {
        const fallback = await sdk.client.fetch<{
          success: boolean
          documents: CbaOrderDocument[]
        }>(`/store/cba/v1/account/orders/${orderId}/documents`, {
          method: "GET",
          headers: auth,
          cache: "no-store",
        })
        return { documents: fallback.documents ?? [] }
      } catch (fallbackError) {
        return {
          documents: [],
          error: extractApiErrorMessage(
            fallbackError,
            extractApiErrorMessage(error, "Could not load order documents.")
          ),
        }
      }
    }

    return {
      documents: [],
      error: extractApiErrorMessage(error, "Could not load order documents."),
    }
  }
}

export async function downloadAccountDocument(
  documentId: string
): Promise<CbaDocumentDownload | null> {
  const headers = await getAuthHeaders()
  if (!("authorization" in headers)) {
    return null
  }

  if (!documentId?.trim()) {
    return null
  }

  return sdk.client
    .fetch<{
      success: boolean
      download: CbaDocumentDownload
    }>(`/store/cba/v1/account/documents/${encodeURIComponent(documentId)}/download`, {
      method: "POST",
      headers,
      cache: "no-store",
    })
    .then((result) => result.download ?? null)
    .catch(() => null)
}

export async function downloadOrderDocument(
  orderId: string,
  documentId: string
): Promise<CbaDocumentDownload | null> {
  const result = await downloadOrderDocumentDetailed(orderId, documentId)
  return result.ok ? result.download : null
}

export async function downloadOrderDocumentDetailed(
  orderId: string,
  documentId: string
): Promise<OrderDocumentDownloadResult> {
  if (!/^order_[A-Za-z0-9]+$/.test(orderId) || !documentId?.trim()) {
    return { ok: false, message: "Invalid order or document id." }
  }

  const session = await establishGuestSessionFromConfirmationDetailed(orderId)
  if (!session.ok) {
    const headers = await getReturnIntakeHeaders()
    const hasAuth =
      "authorization" in headers || "x-cba-guest-tracking-token" in headers
    if (!hasAuth) {
      return { ok: false, message: session.error }
    }
  }

  const headers = await getReturnIntakeHeaders()
  const hasAuth =
    "authorization" in headers || "x-cba-guest-tracking-token" in headers
  if (!hasAuth) {
    return {
      ok: false,
      message:
        "Sign in or verify your order to download the receipt. Guest download session is missing.",
    }
  }

  try {
    const result = await sdk.client.fetch<{
      success: boolean
      download: CbaDocumentDownload
      message?: string
    }>(
      `/store/cba/v1/orders/${orderId}/documents/${encodeURIComponent(documentId)}/download`,
      {
        method: "POST",
        headers,
        cache: "no-store",
      }
    )
    if (!result.download?.url) {
      return {
        ok: false,
        message: extractApiErrorMessage(
          result,
          "Download URL was not returned by the server."
        ),
      }
    }
    return { ok: true, download: result.download }
  } catch (error) {
    return {
      ok: false,
      message: extractApiErrorMessage(
        error,
        "Could not start the download. Please try again."
      ),
    }
  }
}

export async function findOrderReceipt(orderId: string) {
  const result = await getOrderReceiptForDownload(orderId)
  return result.status === "ready" ? result.receipt : null
}

export async function getOrderReceiptForDownload(
  orderId: string
): Promise<OrderReceiptLookupResult> {
  const listed = await listOrderDocumentsDetailed(orderId)
  if (listed.error) {
    return { status: "error", message: listed.error }
  }

  const receipt = listed.documents.find(
    (doc) => doc.document_type === "receipt" && doc.downloadable
  )
  if (receipt) {
    return { status: "ready", receipt }
  }

  const pendingReceipt = listed.documents.find(
    (doc) => doc.document_type === "receipt"
  )
  if (pendingReceipt) {
    return {
      status: "pending",
      message:
        "Your receipt is still being prepared. Please try again in a moment.",
    }
  }

  return {
    status: "pending",
    message:
      "No downloadable receipt was found for this order yet. If you just placed it, wait a few seconds and try again.",
  }
}

/** Prefer guest session when present so confirmation guests can download. */
export async function hasDocumentDownloadAccess() {
  const headers = await getReturnIntakeHeaders()
  return (
    "authorization" in headers || Boolean(await getGuestTrackingSessionToken())
  )
}
