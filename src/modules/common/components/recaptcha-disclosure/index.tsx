type RecaptchaDisclosureProps = {
  className?: string
}

export default function RecaptchaDisclosure({
  className = "",
}: RecaptchaDisclosureProps) {
  return (
    <p
      className={`text-[10px] leading-4 text-gray-500 ${className}`.trim()}
    >
      This site is protected by reCAPTCHA and the Google{" "}
      <a
        href="https://policies.google.com/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 transition-colors hover:text-gray-700"
      >
        Privacy Policy
      </a>{" "}
      and{" "}
      <a
        href="https://policies.google.com/terms"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 transition-colors hover:text-gray-700"
      >
        Terms of Service
      </a>{" "}
      apply.
    </p>
  )
}
