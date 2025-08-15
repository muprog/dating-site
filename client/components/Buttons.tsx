'use client'
import React from 'react'
interface Props {
  style: string
  title: string
  clickEvent?: () => void
}
export default function Buttons({ style, title, clickEvent }: Props) {
  return (
    <button className={`${style}`} onClick={clickEvent}>
      {title}
    </button>
  )
}
