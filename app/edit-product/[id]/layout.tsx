import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Product | Alacarte',
  description: 'Edit your product details and settings',
}

export default function EditProductLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
