"use client"

import type { ComponentProps } from "react"
import { Toaster as Sonner } from "sonner"

type ToasterProps = ComponentProps<typeof Sonner>

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "border border-zinc-200 bg-white text-zinc-900 shadow-lg",
          description: "text-zinc-600",
          actionButton: "bg-zinc-900 text-white",
          cancelButton: "bg-zinc-100 text-zinc-900",
        },
      }}
      {...props}
    />
  )
}
