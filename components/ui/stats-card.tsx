"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  className?: string
  iconClassName?: string
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  className,
  iconClassName
}: StatsCardProps) {
  return (
    <div className={cn("bg-white rounded-xl p-6 shadow-md border border-stone-100", className)}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-light text-stone-600">{title}</h3>
          <p className="text-2xl font-normal mt-1">{value}</p>
          {subtitle && <p className="text-xs text-stone-500 mt-1">{subtitle}</p>}
        </div>
        <div className={cn("p-2 rounded-xl bg-emerald-100", iconClassName)}>
          {icon}
        </div>
      </div>
    </div>
  )
}
