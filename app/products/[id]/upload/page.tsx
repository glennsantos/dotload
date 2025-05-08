import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import UploadDigitalItem from "../upload-digital-item"

export default async function UploadDigitalItemPage({ params }: { params: { id: string } }) {
  const productId = params.id

  // Fetch the product to verify it exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
  })

  if (!product) {
    notFound()
  }

  return <UploadDigitalItem productId={productId} />
}
