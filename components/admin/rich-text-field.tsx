"use client"

import { RichTextField as ModularRichTextField } from "./rich-text-field/index"
import { RichTextFieldProps } from "./rich-text-field/types"

export function RichTextField(props: RichTextFieldProps) {
  return <ModularRichTextField {...props} />
}
