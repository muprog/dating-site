import Image from 'next/image'
import React from 'react'
interface Props {
  image: string
  title: string
  description: string
}

export default function CoreFeaturesBox({ image, title, description }: Props) {
  return (
    <div className='w-[160px] h-[160px] border border-black/20 rounded-lg py-4 px-2 flex flex-col gap-1'>
      <div>
        <Image
          src={`/landing_page/${image}`}
          alt='image'
          width={20}
          height={20}
        />
      </div>
      <div className='font-bold'>{title}</div>
      <div className='font-sans text-[12px]'>{description}</div>
    </div>
  )
}
