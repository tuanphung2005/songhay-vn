"use client"

import type { ReactNode } from "react"

type ConfirmActionFormProps = {
  action: (formData: FormData) => void | Promise<void>
  confirmMessage: string
  children: ReactNode
  className?: string
  fields?: Array<{ name: string; value: string }>
}

export function ConfirmActionForm({ action, confirmMessage, children, className, fields = [] }: ConfirmActionFormProps) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault()
        }
      }}
    >
      {fields.map((field) => (
        <input key={field.name} type="hidden" name={field.name} value={field.value} />
      ))}
      {children}
    </form>
  )
}
