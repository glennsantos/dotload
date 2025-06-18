"use client"

import * as React from "react"
import { ThemeProvider as NextThemeProvider, type ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemeProvider 
      {...props}
      defaultTheme="dark"
      enableSystem={true}
      attribute="class"
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemeProvider>
  )
}
