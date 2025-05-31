import { Metadata, ResolvingMetadata } from "next"
import ClientProductPage from "./client-page"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"

interface ProductPageProps {
  params: any
  searchParams?: any
}

// Fetch product data for both metadata and page rendering
async function getProduct(slug: string) {
  try {
    const product = await prisma.product.findFirst({
      where: { 
        slug: slug,
        isPublic: true,
        status: "active"
      },
      include: {
        user: {
          select: {
            storeName: true,
            storeLogoPath: true
          }
        }
      }
    })
    return product
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  } finally {
    await prisma.$disconnect()
  }
}

// Generate metadata for social sharing
export async function generateMetadata(
  { params }: ProductPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Fetch product data
  const product = await getProduct(params.slug)
  
  // Use default metadata from parent if product not found
  if (!product) {
    return {
      title: 'Product Not Found | alacart',
      description: 'The requested product could not be found.'
    }
  }
  
  // Base URL for absolute URLs
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://alacart.store'
  
  // Construct image URL - use product image or fallback
  const imageUrl = product.coverImagePath 
    ? product.coverImagePath.startsWith('http') 
      ? product.coverImagePath 
      : `${baseUrl}${product.coverImagePath}` 
    : `${baseUrl}/images/default-product.jpg`
  
  // Extract plain text description if it's in rich text format
  let description = product.description || 'A digital product on alacart'
  // If description contains HTML tags, extract plain text
  if (description && description.includes('<')) {
    description = description.replace(/<[^>]*>/g, '')
    // Limit description length for social media
    if (description.length > 160) {
      description = description.substring(0, 157) + '...'
    }
  }
  
  // Return metadata object
  return {
    // Basic meta tags
    title: product.name,
    description: description,
    
    // Standard meta tags
    metadataBase: new URL(baseUrl),
    openGraph: {
      title: product.name,
      description: description,
      images: [{
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: product.name
      }],
      type: 'website',
      siteName: 'alacart',
      locale: 'en_US',
    },
    
    // Twitter meta tags
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: description,
      images: [imageUrl],
      creator: '@alacart'
    },
    
    // Additional meta tags for better SEO
    alternates: {
      canonical: `${baseUrl}/p/${params.slug}`,
    },
    
    // Explicit meta tags for social sharing
    other: {
      'og:title': product.name,
      'og:description': description,
      'og:image': imageUrl,
      'twitter:title': product.name,
      'twitter:description': description,
      'twitter:image': imageUrl
    }
  }
}

import { use } from "react"

export default function PublicProductPage({ params, searchParams }: ProductPageProps) {
  // Unwrap params and searchParams using React.use()
  const unwrappedParams = use(params) as { slug: string }
  const unwrappedSearchParams = searchParams ? use(searchParams) as { [key: string]: string | string[] | undefined } : {}
  
  // Fetch product data and unwrap the Promise using use()
  const productPromise = getProduct(unwrappedParams.slug)
  const product = use(productPromise)
  
  // If product not found, return 404 page
  if (!product) {
    notFound()
  }
  
  // Pass the product data to the client component
  return <ClientProductPage product={product} slug={unwrappedParams.slug} />
}
