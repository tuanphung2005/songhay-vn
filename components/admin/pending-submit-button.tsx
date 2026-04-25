"use client"

import { useRef } from "react"
import { LoaderCircle } from "lucide-react"
import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"

const SUBMIT_GUARD_WINDOW_MS = 1200

type PendingSubmitButtonProps = React.ComponentProps<typeof Button> & {
  pendingText?: string
}

export function PendingSubmitButton({
  pendingText = "Đang xử lý...",
  disabled,
  onClick,
  children,
  ...props
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus()
  const lastSubmitAtRef = useRef(0)

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    onClick?.(event)

    if (event.defaultPrevented) return
    if (props.type && props.type !== "submit") return
    if (pending) {
      event.preventDefault()
      return
    }

    const now = Date.now()
    if (now - lastSubmitAtRef.current < SUBMIT_GUARD_WINDOW_MS) {
      event.preventDefault()
      return
    }

    const form = event.currentTarget.form
    if (!form) return
    if (!form.reportValidity()) return

    lastSubmitAtRef.current = now
  }

  return (
    <Button
      {...props}
      onClick={handleClick}
      disabled={disabled || pending}
      aria-busy={pending}
    >
      {pending ? (
        <span className="inline-flex items-center gap-1.5">
          <LoaderCircle className="size-4 animate-spin" />
          {pendingText}
        </span>
      ) : (
        children
      )}
    </Button>
  )
}
