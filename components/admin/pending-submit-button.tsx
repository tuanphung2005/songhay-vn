"use client"

import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"

type PendingSubmitButtonProps = React.ComponentProps<typeof Button> & {
  pendingText?: string
}

export function PendingSubmitButton({
  pendingText = "Đang xử lý...",
  disabled,
  children,
  ...props
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button {...props} disabled={disabled || pending}>
      {pending ? pendingText : children}
    </Button>
  )
}
