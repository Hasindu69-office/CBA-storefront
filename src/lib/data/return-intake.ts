"use server"

import { sdk } from "@lib/config"
import { getReturnIntakeHeaders } from "@lib/data/cookies"
import type {
  CbaReturnIntakeDetail,
  CbaReturnIntakeEligibilityPreview,
  CbaReturnIntakeEvidence,
  CbaReturnIntakeListItem,
  CbaReturnIntakeRequestType,
} from "types/return-intake"

type SubmitInput = {
  order_id: string
  request_type: CbaReturnIntakeRequestType
  preferred_resolution?: string
  reason_code?: string
  message?: string
  items: Array<{
    order_item_id: string
    quantity: number
    reason_code?: string
    condition_code?: string
    note?: string
  }>
  evidence_ids?: string[]
  staging_token?: string
  idempotency_key: string
}

type EvidenceUploadInput = {
  order_id: string
  original_file_name: string
  content_type: string
  size_bytes: number
  evidence_type: "photo" | "document" | "other"
  staging_token: string
  content_base64: string
}

type RequestEvidenceUploadInput = {
  original_file_name: string
  content_type: string
  size_bytes: number
  evidence_type: "photo" | "document" | "other"
  content_base64: string
}

export async function previewReturnIntakeEligibility(input: {
  order_id: string
  request_type: CbaReturnIntakeRequestType
  items: Array<{ order_item_id: string; quantity: number }>
}) {
  const headers = await getReturnIntakeHeaders()
  return sdk.client.fetch<{
    success: boolean
    eligibility: CbaReturnIntakeEligibilityPreview
  }>("/store/cba/v1/return-intake/eligibility", {
    method: "POST",
    headers,
    body: input,
  })
}

export async function submitReturnIntakeRequest(input: SubmitInput) {
  const headers = await getReturnIntakeHeaders()
  return sdk.client.fetch<{ success: boolean; request: CbaReturnIntakeDetail }>(
    "/store/cba/v1/return-intake",
    {
      method: "POST",
      headers,
      body: input,
    }
  )
}

export async function uploadReturnIntakeEvidence(input: EvidenceUploadInput) {
  const headers = await getReturnIntakeHeaders()
  return sdk.client.fetch<{
    success: boolean
    evidence: CbaReturnIntakeEvidence
  }>("/store/cba/v1/return-intake/evidence", {
    method: "POST",
    headers,
    body: input,
  })
}

export async function uploadRequestEvidence(
  requestNo: string,
  input: RequestEvidenceUploadInput
) {
  const headers = await getReturnIntakeHeaders()
  return sdk.client.fetch<{
    success: boolean
    evidence: CbaReturnIntakeEvidence
  }>(`/store/cba/v1/return-intake/${encodeURIComponent(requestNo)}/evidence`, {
    method: "POST",
    headers,
    body: input,
  })
}

export async function listReturnIntakeRequests(params?: {
  limit?: number
  offset?: number
  status?: string
}) {
  const headers = await getReturnIntakeHeaders()
  const search = new URLSearchParams()
  if (params?.limit != null) search.set("limit", String(params.limit))
  if (params?.offset != null) search.set("offset", String(params.offset))
  if (params?.status) search.set("status", params.status)
  const query = search.toString()
  return sdk.client.fetch<{
    success: boolean
    requests: CbaReturnIntakeListItem[]
    count: number
  }>(`/store/cba/v1/return-intake${query ? `?${query}` : ""}`, {
    method: "GET",
    headers,
    cache: "no-store",
  })
}

export async function getReturnIntakeRequest(requestNo: string) {
  const headers = await getReturnIntakeHeaders()
  return sdk.client.fetch<{ success: boolean; request: CbaReturnIntakeDetail }>(
    `/store/cba/v1/return-intake/${encodeURIComponent(requestNo)}`,
    {
      method: "GET",
      headers,
      cache: "no-store",
    }
  )
}

export async function cancelReturnIntakeRequest(requestNo: string) {
  const headers = await getReturnIntakeHeaders()
  return sdk.client.fetch<{ success: boolean; request: CbaReturnIntakeDetail }>(
    `/store/cba/v1/return-intake/${encodeURIComponent(requestNo)}/cancel`,
    {
      method: "POST",
      headers,
    }
  )
}
