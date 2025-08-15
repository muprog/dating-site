import Image from 'next/image'
import React from 'react'
interface Props {
  image: string
  quote: string
  name: string
}
export default function HeroCard({ image, quote, name }: Props) {
  return (
    <div className='w-[250px] h-[250px] flex flex-col gap-1'>
      <div className='relative w-[200px] h-[150px]'>
        <Image
          src={`/landing_page/${image}`}
          alt={`${name}`}
          fill
          className='object-cover object-top rounded-[10px]'
        />
      </div>
      <div className='font-bold'>{quote}</div>
      <div className='text-pink-950/50 text-[12px] font-medium '>{name}</div>
    </div>
  )
}
