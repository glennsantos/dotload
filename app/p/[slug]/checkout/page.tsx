import { use } from "react"
import CheckoutClient from "./client"

interface CheckoutPageProps {
  params: any
  searchParams?: any
}

export default function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
  // Unwrap params and searchParams using React.use()
  const unwrappedParams = use(params) as { slug: string }
  const unwrappedSearchParams = searchParams ? use(searchParams) as { [key: string]: string | string[] | undefined } : {}
  
  // Server component that passes props to the client component
  return <CheckoutClient slug={unwrappedParams.slug} error={unwrappedSearchParams.error as string | undefined} />
}
