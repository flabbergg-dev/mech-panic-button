"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalDescription,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalTrigger,
} from "@/components/ui/responsive-dialog"

type ModalProps = {
  children: React.ReactNode
  dialogText: string
  buttonText: string
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  buttonActive?: boolean
  className?: string
  buttonClassName?: string
  disabled?: boolean
  side?: "top" | "bottom" | "left" | "right" | null
  variant?:
    | "link"
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | null
}

export const Modal = ({
  children,
  dialogText,
  isOpen,
  onOpenChange,
  buttonText,
  buttonActive,
  className,
  buttonClassName,
  variant,
  disabled,
  side = "bottom",
}: ModalProps) => {
  return (
    <ResponsiveModal open={isOpen} onOpenChange={onOpenChange}>
      {buttonActive === true ? (
        <ResponsiveModalTrigger asChild>
          <Button
            variant={variant}
            className={buttonClassName}
            disabled={disabled ? true : false}
          >
            {buttonText}
          </Button>
        </ResponsiveModalTrigger>
      ) : null}
      <ResponsiveModalContent className={className} side={side}>
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>{dialogText}</ResponsiveModalTitle>
        </ResponsiveModalHeader>
        {/* Moved the children outside of ResponsiveModalDescription to avoid p > div nesting */}
        {children}
      </ResponsiveModalContent>
    </ResponsiveModal>
  )
}
