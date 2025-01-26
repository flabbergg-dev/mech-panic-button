import { Ripple } from "@/components/ui/Ripple"

type RippleCompProps = {
  children?: React.ReactNode
}

export function RippleComp({ children }: RippleCompProps) {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background">
      <div className="z-10 whitespace-pre-wrap text-center text-5xl font-medium tracking-tighter text-white">
        {children}
      </div>
      <Ripple />
    </div>
  )
}
