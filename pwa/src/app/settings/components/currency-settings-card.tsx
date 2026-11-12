"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CURRENCIES, usePreferencesStore } from "@/stores/preferences"

/**
 * Lets the user pick which currency's symbol is used to render every money
 * amount in the app (see pwa/src/lib/money.ts's formatCents()).
 *
 * This is a pure display preference: it never converts or re-interprets
 * previously stored amounts — it only changes the symbol/formatting used
 * when rendering the same stored integer-cents value.
 */
export function CurrencySettingsCard() {
  const currency = usePreferencesStore((state) => state.currency)
  const setCurrency = usePreferencesStore((state) => state.setCurrency)

  return (
    <div className="space-y-2">
      <h3 className="font-semibold mb-1">Currency</h3>
      <p className="text-sm text-muted-foreground mb-2">
        Choose the currency used to display amounts throughout the app. This only changes how amounts are
        displayed — it does not convert any existing balances or transactions.
      </p>
      <Select value={currency} onValueChange={setCurrency}>
        <SelectTrigger aria-label="Currency" className="w-full sm:w-72">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CURRENCIES.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              {c.code} - {c.name} ({c.symbol})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
