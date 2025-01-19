import React from "react"
import Image from "next/image"

const Logo = () => {
  return (
    <div>
      <Image
        src="/logo.png"
        alt="Logo"
        className="w-12 h-12"
        width={100}
        height={100}
      />
    </div>
  )
}

export default Logo
