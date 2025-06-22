"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"

interface CurrencyInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  currency?: string
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, currency = "USD", ...props }, ref) => {
    const formatValue = (value: string) => {
      const numbers = value.replace(/[^0-9.]/g, "")
      const decimal = parseFloat(numbers)
      if (isNaN(decimal)) return ""
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
      }).format(decimal)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      const formattedValue = formatValue(value)
      e.target.value = formattedValue
      props.onChange?.(e)
    }

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="decimal"
        onChange={handleChange}
        className={className}
      />
    )
  }
)
CurrencyInput.displayName = "CurrencyInput"

export { CurrencyInput } 