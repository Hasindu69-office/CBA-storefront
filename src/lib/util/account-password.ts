export const ACCOUNT_PASSWORD_PROVIDERS = [
  "emailpass",
  "google",
  "facebook",
  "apple",
] as const

export type AccountPasswordProvider = (typeof ACCOUNT_PASSWORD_PROVIDERS)[number]

export type AccountSecurity = {
  password_enabled: boolean
  linked_providers: AccountPasswordProvider[]
}

export type PasswordChangeFieldErrors = Partial<
  Record<"current_password" | "new_password" | "confirm_password", string>
>

export function validatePasswordChange(values: {
  current_password: string
  new_password: string
  confirm_password: string
}) {
  const fieldErrors: PasswordChangeFieldErrors = {}

  if (!values.current_password) {
    fieldErrors.current_password = "Enter your current password."
  }
  if (
    values.new_password.length < 8 ||
    values.new_password.length > 128 ||
    !/[A-Za-z]/.test(values.new_password) ||
    !/\d/.test(values.new_password)
  ) {
    fieldErrors.new_password =
      "Use 8–128 characters with at least one letter and one number."
  } else if (values.new_password === values.current_password) {
    fieldErrors.new_password = "Choose a password different from your current password."
  }
  if (values.confirm_password !== values.new_password) {
    fieldErrors.confirm_password = "The passwords do not match."
  }

  return fieldErrors
}

export function passwordChangeErrorMessage(code?: string) {
  switch (code) {
    case "CURRENT_PASSWORD_INVALID":
      return "Your current password is incorrect."
    case "PASSWORD_NOT_CONFIGURED":
      return "This account uses a social sign-in provider and does not have a password to change."
    case "PASSWORD_POLICY_FAILED":
      return "Use 8–128 characters with at least one letter and one number."
    case "PASSWORD_REUSE_NOT_ALLOWED":
      return "Choose a password different from your current password."
    case "RATE_LIMITED":
      return "Too many attempts. Wait a few minutes and try again."
    case "SERVICE_UNAVAILABLE":
      return "Password settings are temporarily unavailable. Please try again later."
    default:
      return "We could not update your password. Please try again."
  }
}

export function socialProviderNames(providers: AccountPasswordProvider[]) {
  const labels: Record<AccountPasswordProvider, string> = {
    emailpass: "Email and password",
    google: "Google",
    facebook: "Facebook",
    apple: "Apple",
  }
  return providers
    .filter((provider) => provider !== "emailpass")
    .map((provider) => labels[provider])
}
