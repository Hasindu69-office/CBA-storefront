import React, { useEffect, useRef, useState } from "react"
import {
  normalizeSriLankanPhone,
  sanitizeSriLankanPhoneNationalInput,
  SRI_LANKA_PHONE_NATIONAL_EXAMPLE,
  SRI_LANKA_PHONE_NATIONAL_MAX_LENGTH,
  toSriLankanPhoneNational,
  validateSriLankanPhone,
} from "@lib/util/storefront-form-validation"

type SriLankanPhoneInputProps = {
  name: string
  label: string
  value?: string | null
  defaultValue?: string | null
  error?: string
  required?: boolean
  disabled?: boolean
  id?: string
  className?: string
  inputClassName?: string
  placeholder?: string
  autoComplete?: string
  "data-testid"?: string
  onValueChange?: (internationalValue: string, nationalValue: string) => void
  onValueBlur?: (internationalValue: string, nationalValue: string) => void
}

export default function SriLankanPhoneInput({
  name,
  label,
  value,
  defaultValue,
  error,
  required,
  disabled,
  id,
  className,
  inputClassName,
  placeholder = SRI_LANKA_PHONE_NATIONAL_EXAMPLE,
  autoComplete = "tel-national",
  onValueChange,
  onValueBlur,
  ...rest
}: SriLankanPhoneInputProps) {
  const isControlled = value !== undefined
  const [nationalValue, setNationalValue] = useState(
    toSriLankanPhoneNational(defaultValue)
  )
  const displayedValue = isControlled
    ? toSriLankanPhoneNational(value)
    : nationalValue
  const internationalValue = normalizeSriLankanPhone(displayedValue)
  const inputId = id ?? name.replace(/[^A-Za-z0-9_-]+/g, "-")
  const errorId = `${inputId}-error`
  const hiddenInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isControlled) setNationalValue(toSriLankanPhoneNational(defaultValue))
  }, [defaultValue, isControlled])

  const updateValue = (nextValue: string) => {
    const nextNationalValue = sanitizeSriLankanPhoneNationalInput(nextValue)
    const nextInternationalValue = normalizeSriLankanPhone(nextNationalValue)
    if (!isControlled) setNationalValue(nextNationalValue)
    // Keep FormData-based validators in sync before their change callback runs.
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = nextInternationalValue
    }
    onValueChange?.(nextInternationalValue, nextNationalValue)
  }

  return (
    <div className={["flex w-full flex-col gap-1", className].filter(Boolean).join(" ")}>
      <label htmlFor={inputId} className="text-[12px] font-semibold text-[#252a33]">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div
        className={`flex h-11 w-full overflow-hidden rounded-md border bg-white focus-within:border-ui-border-interactive ${
          error ? "border-rose-400" : "border-ui-border-base"
        }`}
        aria-describedby={error ? errorId : undefined}
      >
        <span
          className="flex items-center border-r border-ui-border-base bg-white px-3 text-sm font-semibold text-ui-fg-subtle"
          aria-label="Sri Lanka country code, plus 94"
        >
          +94
        </span>
        <input
          {...rest}
          id={inputId}
          name={`${name}__national`}
          type="tel"
          value={displayedValue}
          onChange={(event) => updateValue(event.currentTarget.value)}
          onBlur={() => onValueBlur?.(internationalValue, displayedValue)}
          placeholder={placeholder}
          maxLength={SRI_LANKA_PHONE_NATIONAL_MAX_LENGTH}
          inputMode="numeric"
          autoComplete={autoComplete}
          disabled={disabled}
          data-phone-input-for={name}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errorId : undefined}
          className={["min-w-0 flex-1 bg-transparent px-3 text-sm outline-none", inputClassName]
            .filter(Boolean)
            .join(" ")}
        />
        <input
          ref={hiddenInputRef}
          type="hidden"
          name={name}
          value={internationalValue}
          data-phone-hidden="true"
          readOnly
        />
      </div>
      {error && (
        <p id={errorId} className="text-[12px] font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  )
}

export function phoneInputError(value: string, required = true) {
  return validateSriLankanPhone(value, { required }) ?? undefined
}
