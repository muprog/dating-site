'use client'

import React from 'react'

type ButtonProps = {
  title: string
  btnType?: 'button' | 'submit' | 'reset' // ✅ only HTML button types allowed
  btnStyle?: string // ✅ custom Tailwind or CSS classes
  onClick?: () => void // ✅ optional click handler
  disabled?: boolean
}

export default function Button({
  title,
  btnType = 'button',
  btnStyle = 'bg-pink-500 text-white p-2 rounded',
  onClick,
  disabled = false,
}: ButtonProps) {
  return (
    <button type={btnType} onClick={onClick} className={btnStyle}>
      {title}
    </button>
  )
}
