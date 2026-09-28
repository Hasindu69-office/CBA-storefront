import { normalizeEmail, validateEmail } from "./storefront-form-validation"

export type EmailChangeFieldErrors = Partial<
  Record<"new_email" | "confirm_email" | "current_password", string>
>

export function validateEmailChange(values: {
  current_email: string
  new_email: string
  confirm_email: string
  current_password: string
}) {
  const errors: EmailChangeFieldErrors = {}
  const currentEmail = normalizeEmail(values.current_email)
  const newEmail = normalizeEmail(values.new_email)
  const confirmEmail = normalizeEmail(values.confirm_email)

  const emailError = validateEmail(newEmail)
  if (emailError || newEmail.length > 254) {
    errors.new_email = "Enter a valid email address."
  } else if (newEmail === currentEmail) {
    errors.new_email = "Enter an email address different from your current email."
  }
  if (confirmEmail !== newEmail) {
    errors.confirm_email = "The email addresses do not match."
  }
  if (!values.current_password || values.current_password.length > 1024) {
    errors.current_password = "Enter your current password."
  }
  return errors
}

export function emailChangeErrorMessage(code?: string) {
  switch (code) {
    case "CURRENT_PASSWORD_INVALID":
      return "Your current password is incorrect."
    case "EMAIL_CHANGE_NOT_SUPPORTED":
    case "PASSWORD_NOT_CONFIGURED":
      return "This account uses social sign-in. Manage its email with that provider."
    case "EMAIL_UNCHANGED":
      return "Enter an email address different from your current email."
    case "EMAIL_ALREADY_IN_USE":
      return "That email address is already in use."
    case "EMAIL_VERIFICATION_EXPIRED":
      return "This email verification link has expired. Request a new one from your profile."
    case "EMAIL_VERIFICATION_INVALID":
    case "EMAIL_CHANGE_CONTEXT_INVALID":
      return "This email verification link is invalid or has already been used."
    case "AUTH_IDENTITY_MISMATCH":
      return "This request does not belong to the signed-in account."
    case "RATE_LIMITED":
      return "Too many attempts. Wait a few minutes and try again."
    case "SESSION_REVOKED":
      return "Your session has expired. Sign in again."
    case "SERVICE_UNAVAILABLE":
      return "Email settings are temporarily unavailable. Please try again later."
    default:
      return "We could not complete the email change. Please try again."
  }
}
