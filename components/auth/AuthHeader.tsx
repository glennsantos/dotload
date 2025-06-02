import Link from 'next/link';
import Image from 'next/image';

export default function AuthHeader() {
  return (
    <div className="flex flex-col items-center mb-8">
      <Link href="/" className="mb-4">
        <Image 
          src="/logo.png" 
          alt="Alacart Logo" 
          width={160} 
          height={42.67} 
          className="h-auto"
          priority
        />
      </Link>
    </div>
  );
}
