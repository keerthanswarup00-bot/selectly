"use client"

import * as React from "react"

interface RadioGroupContextValue {
  value: string
  onValueChange: (value: string) => void
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null)

export function RadioGroup({
  value,
  onValueChange,
  className,
  children,
}: {
  value: string
  onValueChange: (value: string) => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div className={className} role="radiogroup">
        {children}
      </div>
    </RadioGroupContext.Provider>
  )
}

export function RadioGroupItem({
  value,
  id,
}: {
  value: string
  id: string
}) {
  const ctx = React.useContext(RadioGroupContext)
  return (
    <input
      type="radio"
      id={id}
      value={value}
      checked={ctx?.value === value}
      onChange={() => ctx?.onValueChange(value)}
      className="h-4 w-4 accent-foreground"
    />
  )
}
