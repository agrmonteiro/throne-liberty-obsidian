import React, { useState, useEffect } from 'react'
import { parsePtBR } from '../engine/fmt'

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value: number
  onChange: (value: number) => void
  integer?: boolean
}

export function NumericInput({ value, onChange, integer = false, min, max, onFocus, onBlur, ...props }: Props) {
  const [raw, setRaw] = useState(String(value))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setRaw(String(value))
  }, [value, focused])

  function parse(s: string): number {
    return integer ? parseInt(s, 10) : parsePtBR(s)
  }

  function clamp(v: number): number {
    if (max !== undefined && v > Number(max)) v = Number(max)
    if (min !== undefined && v < Number(min)) v = Number(min)
    return v
  }

  return (
    <input
      {...props}
      type="text"
      inputMode={integer ? 'numeric' : 'decimal'}
      value={raw}
      onChange={(e) => {
        const s = e.target.value.replace(',', '.')
        setRaw(s)
        const parsed = parse(s)
        if (!isNaN(parsed)) onChange(clamp(parsed))
      }}
      onFocus={(e) => {
        setFocused(true)
        onFocus?.(e)
      }}
      onBlur={(e) => {
        setFocused(false)
        if (isNaN(parse(raw))) setRaw(String(value))
        onBlur?.(e)
      }}
    />
  )
}
