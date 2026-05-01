"use client"

import * as React from "react"
import { Skeleton as BoneyardSkeleton } from "boneyard-js/react"

interface BoneyardSkeletonProps extends Omit<React.ComponentProps<typeof BoneyardSkeleton>, "loading" | "children"> {
  children?: React.ReactNode
  loading?: boolean
}

/**
 * A wrapper for boneyard-js Skeleton component.
 * Use this to wrap components that should have a skeleton loading state.
 */
export function Skeleton({ name, loading = false, children, ...props }: BoneyardSkeletonProps) {
  return (
    <BoneyardSkeleton name={name} loading={loading} {...props}>
      {children}
    </BoneyardSkeleton>
  )
}
