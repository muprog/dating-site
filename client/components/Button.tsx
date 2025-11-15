'use client'

import React from 'react'

type ButtonProps = {
  title: string
  btnType?: 'button' | 'submit' | 'reset'
  btnStyle?: string
  // onClick?: () => void
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
}

export default function Button({
  title,
  btnType = 'button',
  btnStyle = 'bg-pink-500 text-white p-2 rounded',
  onClick,
  // onClick1,
  disabled = false,
}: ButtonProps) {
  return (
    <button type={btnType} onClick={onClick} className={btnStyle}>
      {title}
    </button>
  )
}
