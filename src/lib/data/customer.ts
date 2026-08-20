"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidatePath, revalidateTag } from "next/cache"
import { headers as nextHeaders } from "next/headers"
import { redirect } from "next/navigation"
import { localizedPath } from "@lib/util/routes"
import {
  getAuthHeaders,
  getCacheTag,
  getCartId,
  removeAuthToken,
  removeCartId,
  setAuthToken,
} from "./cookies"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^[+()\d\s-]{7,24}$/
const SAFE_MEDUSA_ID_PATTERN = /^[a-z]+_[A-Za-z0-9_-]+$/
const POSTAL_CODE_PATTERN = /^[A-Za-z0-9\s-]{3,16}$/
const OAUTH_PROVIDERS = ["google", "facebook", "apple"] as const
type OAuthProvider = (typeof OAUTH_PROVIDERS)[number]

export const retrieveCustomer =
  async (): Promise<HttpTypes.StoreCustomer | null> => {
    const authHeaders = await getAuthHeaders()

    if (!("authorization" in authHeaders) || !authHeaders.authorization) {
      return null
    }

    return await sdk.client
      .fetch<{ customer: HttpTypes.StoreCustomer }>(`/store/customers/me`, {
        method: "GET",
        query: {
          fields: "*orders",
        },
        headers: authHeaders,
        cache: "no-store",
      })
      .then(({ customer }) => customer)
      .catch(() => null)
  }

export const updateCustomer = async (body: HttpTypes.StoreUpdateCustomer) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const updateRes = await sdk.store.customer
    .update(body, {}, headers)
    .then(({ customer }) => customer)
    .catch(medusaError)

  const cacheTag = await getCacheTag("customers")
  revalidateTag(cacheTag)

  return updateRes
}

export async function signup(_currentState: unknown, formData: FormData) {
  const password = text(formData.get("password"))
  const confirmPassword = text(formData.get("confirm_password"))
  const customerForm = {
    email: text(formData.get("email")).toLowerCase(),
    first_name: text(formData.get("first_name")),
    last_name: text(formData.get("last_name")),
    phone: text(formData.get("phone")),
  }
  const validationError = validateSignup(customerForm, password, confirmPassword, formData)
  if (validationError) {
    return validationError
  }

  try {
    const token = await sdk.auth.register("customer", "emailpass", {
      email: customerForm.email,
      password: password,
    })

    const headers = {
      authorization: `Bearer ${token as string}`,
    }

    const { customer: createdCustomer } = await sdk.store.customer.create(
      customerForm,
      {},
      headers
    )

    const loginToken = await sdk.auth.login("customer", "emailpass", {
      email: customerForm.email,
      password,
    })

    await setAuthToken(loginToken as string)

    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag)

    await transferCart().catch((error) => {
      console.error("Customer signup succeeded, but cart transfer failed.", safeServerError(error))
    })

    return createdCustomer
  } catch (error: any) {
    console.error("Customer signup failed.", safeServerError(error))
    return authErrorMessage(error)
  }
}

export async function login(_currentState: unknown, formData: FormData) {
  const email = text(formData.get("email")).toLowerCase()
  const password = text(formData.get("password"))

  const validationError = validateLogin(email, password)
  if (validationError) {
    return validationError
  }

  try {
    await sdk.auth
      .login("customer", "emailpass", { email, password })
      .then(async (token) => {
        await setAuthToken(token as string)
        const customerCacheTag = await getCacheTag("customers")
        revalidateTag(customerCacheTag)
      })
  } catch (error: any) {
    return authErrorMessage(error)
  }

  try {
    await transferCart()
  } catch (error: any) {
    return authErrorMessage(error)
  }
}

export async function requestPasswordReset(_currentState: unknown, formData: FormData) {
  const email = text(formData.get("email")).toLowerCase()
  if (!EMAIL_PATTERN.test(email)) {
    return "Enter a valid email address."
  }
  try {
    await sdk.client.fetch("/auth/customer/emailpass/reset-password", {
      method: "POST",
      body: { identifier: email },
      cache: "no-store",
    })
  } catch (error) {
    console.error("Password reset request failed.", safeServerError(error))
  }
  return "If an account exists for this email address, a password reset link will be sent."
}

export async function resetPassword(_currentState: unknown, formData: FormData) {
  const email = text(formData.get("email")).toLowerCase()
  const token = text(formData.get("token"))
  const password = text(formData.get("password"))
  const confirmPassword = text(formData.get("confirm_password"))
  if (!EMAIL_PATTERN.test(email)) {
    return "Enter a valid email address."
  }
  if (!/^[A-Za-z0-9._-]{20,2048}$/.test(token)) {
    return "This password reset link is invalid."
  }
  if (!isStrongPassword(password)) {
    return "Password must be at least 8 characters and include letters and numbers."
  }
  if (password !== confirmPassword) {
    return "Passwords do not match."
  }
  try {
    await sdk.client.fetch("/auth/customer/emailpass/update", {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: { email, password },
      cache: "no-store",
    })
    return "Password updated. You can sign in with your new password."
  } catch (error) {
    console.error("Password reset update failed.", safeServerError(error))
    return "We could not update the password. Request a new reset link and try again."
  }
}

export async function startOAuthLogin(_currentState: unknown, formData: FormData) {
  const provider = text(formData.get("provider")) as OAuthProvider
  const countryCode = text(formData.get("country_code")) || "lk"

  if (!OAUTH_PROVIDERS.includes(provider)) {
    return "This sign-on provider is not supported."
  }

  const callbackUrl = `${await storefrontOrigin()}/oauth/${provider}/callback`
  let location = ""

  try {
    const result = await sdk.auth.login("customer", provider, {
      callback_url: callbackUrl,
    })
    if (typeof result === "string") {
      await setAuthToken(result)
      await transferCart()
      redirect(localizedPath(`/${countryCode}/account`))
    }
    if (!("location" in result) || !result.location) {
      return "This sign-on provider requires additional verification."
    }
    location = result.location
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error
    }
    return authErrorMessage(error)
  }

  redirect(location)
}

export async function completeOAuthLogin({
  provider,
  query,
  countryCode,
}: {
  provider: string
  query: Record<string, string>
  countryCode: string
}) {
  if (!OAUTH_PROVIDERS.includes(provider as OAuthProvider)) {
    redirect(localizedPath(`/${countryCode}/account?auth_error=unsupported_provider`))
  }

  try {
    const tokenResult = await sdk.auth.callback("customer", provider, query)
    if (typeof tokenResult !== "string") {
      redirect(localizedPath(`/${countryCode}/account?auth_error=additional_verification_required`))
    }

    await setAuthToken(tokenResult)
    const existingCustomer = await retrieveCustomer()

    if (!existingCustomer) {
      const profile = decodeAuthProfile(tokenResult)
      if (!profile.email) {
        await removeAuthToken()
        redirect(localizedPath(`/${countryCode}/account?auth_error=missing_email`))
      }

      const headers = {
        ...(await getAuthHeaders()),
      }

      await sdk.store.customer.create(
        {
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
        },
        {},
        headers
      )

      const refreshed = await sdk.auth.refresh(headers)
      await setAuthToken(refreshed.token)
    }

    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag)
    revalidatePath("/account")
    revalidatePath("/")
    await transferCart()
    redirect(localizedPath(`/${countryCode}/account`))
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error
    }
    await removeAuthToken()
    redirect(localizedPath(`/${countryCode}/account?auth_error=oauth_failed`))
  }
}

export async function signout(countryCode: string) {
  await sdk.auth.logout()

  await removeAuthToken()

  const customerCacheTag = await getCacheTag("customers")
  revalidateTag(customerCacheTag)

  await removeCartId()

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)

  redirect(localizedPath(`/${countryCode}/account`))
}

export async function transferCart() {
  const cartId = await getCartId()

  if (!cartId) {
    return
  }

  const headers = await getAuthHeaders()

  await sdk.store.cart.transferCart(cartId, {}, headers)

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)
}

function validateLogin(email: string, password: string) {
  if (!EMAIL_PATTERN.test(email)) {
    return "Enter a valid email address."
  }
  if (!password) {
    return "Password is required."
  }
  return null
}

function validateSignup(
  customer: { email: string; first_name: string; last_name: string; phone: string },
  password: string,
  confirmPassword: string,
  formData: FormData
) {
  if (!customer.first_name || !customer.last_name) {
    return "First name and last name are required."
  }
  if (!EMAIL_PATTERN.test(customer.email)) {
    return "Enter a valid email address."
  }
  if (customer.phone && !PHONE_PATTERN.test(customer.phone)) {
    return "Enter a valid phone number."
  }
  if (!isStrongPassword(password)) {
    return "Password must be at least 8 characters and include letters and numbers."
  }
  if (password !== confirmPassword) {
    return "Passwords do not match."
  }
  if (formData.get("terms") !== "on") {
    return "You must agree to the terms and privacy policy."
  }
  return null
}

function isStrongPassword(value: string) {
  return value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value)
}

function authErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "")
  if (/email.*exist|already.*email|duplicate/i.test(message)) {
    return "An account already exists with this email address."
  }
  if (/invalid|unauthorized|password|credentials|identity/i.test(message)) {
    return "Please check your account details and try again."
  }
  if (/duplicate|already exists/i.test(message)) {
    return "An account already exists with this email address."
  }
  if (/network|fetch|ECONNREFUSED|ENOTFOUND|timeout/i.test(message)) {
    return "We could not reach the account service. Please try again."
  }
  return "We could not complete the request. Please try again."
}

function safeServerError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "")
  return message.replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]")
    .replace(/password[^,}\s]*/gi, "password=[redacted]")
    .slice(0, 500)
}

async function storefrontOrigin() {
  const configured =
    process.env.NEXT_PUBLIC_STOREFRONT_URL || process.env.NEXT_PUBLIC_BASE_URL
  if (configured) {
    return configured.replace(/\/+$/, "")
  }
  const headers = await nextHeaders()
  const host = headers.get("x-forwarded-host") ?? headers.get("host") ?? "localhost:8000"
  const proto = headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")
  return `${proto}://${host}`
}

function decodeAuthProfile(token: string) {
  const payload = token.split(".")[1]
  if (!payload) {
    return { email: "", first_name: "", last_name: "" }
  }
  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
    user_metadata?: Record<string, unknown>
  }
  const metadata = parsed.user_metadata ?? {}
  const name = text(metadata.name)
  const firstName = text(metadata.given_name) || name.split(" ")[0] || ""
  const lastName = text(metadata.family_name) || name.split(" ").slice(1).join(" ")
  return {
    email: text(metadata.email).toLowerCase(),
    first_name: firstName,
    last_name: lastName,
  }
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function isNextRedirect(error: unknown) {
  return typeof (error as { digest?: unknown })?.digest === "string" &&
    String((error as { digest: string }).digest).startsWith("NEXT_REDIRECT")
}

export const addCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const isDefaultBilling = (currentState.isDefaultBilling as boolean) || false
  const isDefaultShipping = (currentState.isDefaultShipping as boolean) || false

  const address = {
    first_name: text(formData.get("first_name")),
    last_name: text(formData.get("last_name")),
    company: text(formData.get("company")),
    address_1: text(formData.get("address_1")),
    address_2: text(formData.get("address_2")),
    city: text(formData.get("city")),
    postal_code: text(formData.get("postal_code")),
    province: text(formData.get("province")),
    country_code: text(formData.get("country_code")).toLowerCase(),
    phone: text(formData.get("phone")),
    is_default_billing: isDefaultBilling,
    is_default_shipping: isDefaultShipping,
  }

  const validationError = validateCustomerAddress(address)
  if (validationError) {
    return { success: false, error: validationError }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .createAddress(address, {}, headers)
    .then(async ({ customer }) => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const deleteCustomerAddress = async (
  addressId: string
): Promise<{ success: boolean; error: string | null }> => {
  if (!SAFE_MEDUSA_ID_PATTERN.test(addressId)) {
    return { success: false, error: "Address ID is invalid" }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return await sdk.store.customer
    .deleteAddress(addressId, headers)
    .then(async () => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const updateCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const addressId =
    (currentState.addressId as string) || (formData.get("addressId") as string)

  if (!addressId || !SAFE_MEDUSA_ID_PATTERN.test(addressId)) {
    return { success: false, error: "Address ID is invalid" }
  }

  const address = {
    first_name: text(formData.get("first_name")),
    last_name: text(formData.get("last_name")),
    company: text(formData.get("company")),
    address_1: text(formData.get("address_1")),
    address_2: text(formData.get("address_2")),
    city: text(formData.get("city")),
    postal_code: text(formData.get("postal_code")),
    province: text(formData.get("province")),
    country_code: text(formData.get("country_code")).toLowerCase(),
  } as HttpTypes.StoreUpdateCustomerAddress

  const phone = text(formData.get("phone"))

  if (phone) {
    address.phone = phone
  }

  const validationError = validateCustomerAddress({
    ...address,
    phone,
  })
  if (validationError) {
    return { success: false, error: validationError }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .updateAddress(addressId, address, {}, headers)
    .then(async () => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

function validateCustomerAddress(address: {
  first_name?: string | null
  last_name?: string | null
  address_1?: string | null
  city?: string | null
  postal_code?: string | null
  country_code?: string | null
  phone?: string | null
}) {
  if (!address.first_name || !address.last_name) {
    return "First name and last name are required."
  }
  if (!address.address_1) {
    return "Street address is required."
  }
  if (!address.city) {
    return "City is required."
  }
  if (!address.country_code) {
    return "Country is required."
  }
  if (address.postal_code && !POSTAL_CODE_PATTERN.test(address.postal_code)) {
    return "Enter a valid postal code."
  }
  if (address.phone && !PHONE_PATTERN.test(address.phone)) {
    return "Enter a valid phone number."
  }
  return null
}
