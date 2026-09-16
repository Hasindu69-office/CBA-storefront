export const RECAPTCHA_FORM_FIELD = "cba_recaptcha_token"
export const RECAPTCHA_TOKEN_HEADER = "x-cba-recaptcha-token"

export type RecaptchaAction =
  | "customer_login" | "customer_register" | "password_reset_request"
  | "contact_inquiry" | "product_inquiry" | "newsletter_subscribe"
  | "back_in_stock" | "order_tracking_lookup" | "order_tracking_verify"
  | "return_eligibility" | "return_submit"
  | "chatbot_session" | "chatbot_message" | "chatbot_handover"

export function recaptchaHeaders(token: unknown): Record<string, string> {
  const value = typeof token === "string" ? token.trim() : ""
  return value ? { [RECAPTCHA_TOKEN_HEADER]: value } : {}
}
