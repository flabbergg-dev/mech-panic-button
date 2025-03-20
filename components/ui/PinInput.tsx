'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Input } from './input'

interface PinInputProps {
  length?: number
  onComplete?: (value: string) => void
}

export function PinInput({ length = 6, onComplete }: PinInputProps) {
  const [code, setCode] = useState<string[]>(Array(length).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)

    // Move to next input if value is entered
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Check if code is complete
    if (newCode.every(digit => digit) && onComplete) {
      onComplete(newCode.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Move to previous input on backspace if current input is empty
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain')
    const numbers = pastedData.replace(/\D/g, '').split('').slice(0, length)
    
    const newCode = [...code]
    numbers.forEach((num, index) => {
      if (index < length) newCode[index] = num
    })
    setCode(newCode)

    // Focus the next empty input or the last input
    const nextEmptyIndex = newCode.findIndex(digit => !digit)
    const focusIndex = nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex
    inputRefs.current[focusIndex]?.focus()

    if (newCode.every(digit => digit) && onComplete) {
      onComplete(newCode.join(''))
    }
  }

  return (
    <div className="flex gap-2 justify-center">
      {code.map((digit, index) => (
        <Input
          key={index}
          type="text"
          value={digit}
          maxLength={1}
          className="w-8 h-8 md:w-12 md:h-12 text-center text-2xl"
          onChange={e => handleChange(index, e.target.value)}
          onKeyDown={e => handleKeyDown(index, e)}
          onPaste={handlePaste}
          ref={(el: HTMLInputElement | null) => {
            inputRefs.current[index] = el
          }}
        />
      ))}
    </div>
  )
}
