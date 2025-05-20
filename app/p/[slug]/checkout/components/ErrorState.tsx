import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface ErrorStateProps {
  error: string | null;
  slug: string;
}

export default function ErrorState({ error, slug }: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="text-red-500 text-xl mb-4">{error || "Product not found"}</div>
      <Link href={`/p/${slug}`} className="text-blue-600 hover:underline flex items-center">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Return to Product
      </Link>
    </div>
  );
}
