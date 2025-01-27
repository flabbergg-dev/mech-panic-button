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
  buttonActive?: boolean
  className?: string
  buttonClassName?: string
  disabled?: boolean
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
  buttonText,
  buttonActive,
  className,
  buttonClassName,
  variant,
  disabled,
}: ModalProps) => {
  return (
    <ResponsiveModal open={isOpen}>
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
      <ResponsiveModalContent className={className}>
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>{dialogText}</ResponsiveModalTitle>
          <ResponsiveModalDescription>{children}</ResponsiveModalDescription>
        </ResponsiveModalHeader>
      </ResponsiveModalContent>
    </ResponsiveModal>
  )
}
