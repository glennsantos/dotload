import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Package, Globe, Clock } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-stone-200 py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Image src="/logo.png" alt="Alacart Logo" width={120} height={32} />
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-stone-700 hover:text-emerald-600 text-sm font-medium">
              Sign In
            </Link>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full">
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl lg:text-6xl font-light text-stone-900 mb-8 leading-tight">
          <span className="block font-light">Create Professional</span>
            <div className="block font-medium">Checkout Pages</div>
            <span className="block font-light">in Minutes</span>
          </h1>
          <p className="max-w-2xl mx-auto text-stone-600 mb-10">
            The fastest way to sell digital and physical products online. Build stunning,
            conversion-optimized checkout pages with zero coding required.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-20">
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6 py-2 flex items-center gap-2">
              <Link href="/register">
                Get Started Free <ArrowRight size={16} />
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-stone-200 text-stone-700 hover:bg-stone-50 rounded-full">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-light text-stone-900 mb-4">Why Choose Alacart?</h2>
          <p className="text-lg text-stone-600">Everything you need to start selling online</p>
        </div>
        <div className="grid md:grid-cols-3 gap-12">
          <div className="rounded-lg border text-card-foreground bg-white border-stone-200 shadow-sm">
            <div className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap h-5 w-5 text-stone-600">
                  <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-medium text-stone-900 mb-4">2-Minute Setup</h3>
              <p className="text-stone-600 leading-relaxed">Create professional checkout pages in under 2 minutes with our smart wizard</p>
            </div>
          </div>
          <div className="rounded-lg border text-card-foreground bg-white border-stone-200 shadow-sm">
            <div className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield h-5 w-5 text-stone-600">
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-medium text-stone-900 mb-4">Secure Payments</h3>
              <p className="text-stone-600 leading-relaxed">Built-in Stripe integration with enterprise-level security and trust indicators</p>
            </div>
          </div>
          <div className="rounded-lg border text-card-foreground bg-white border-stone-200 shadow-sm">
            <div className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe h-5 w-5 text-stone-600">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                  <path d="M2 12h20"></path>
                </svg>
              </div>
              <h3 className="text-xl font-medium text-stone-900 mb-4">Digital &amp; Physical</h3>
              <p className="text-stone-600 leading-relaxed">Support for both digital downloads and physical products with inventory management</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-light text-stone-900 mb-8">Everything You Need to Succeed</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {[
                "Professional checkout pages with conversion optimization",
                "Digital product delivery with download limits",
                "Physical product inventory and shipping management",
                "Product variants (size, color, version) support",
                "Promo codes and discount management",
                "Real-time analytics and sales tracking",
                "Mobile responsive pages",
                "Custom branding and themes"
              ].map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="text-emerald-500 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <p className="text-stone-700">{feature}</p>
                </div>
              ))}
            </div>

            <div className="relative">
              <div className="bg-stone-100 rounded-2xl p-12">
                <div className="bg-white rounded-xl shadow-sm p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-emerald-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap h-8 w-8 text-white">
                        <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-stone-900 mb-3">Professional Results</h3>
                    <p className="text-stone-600">Get enterprise-level checkout pages with minimal effort</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-stone-900 text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Selling?</h2>
          <p className="mb-8">Join thousands of creators already using Alacart</p>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6 py-2 flex items-center gap-2 mx-auto">
            <Link href="/register">
              Get Started Free <ArrowRight size={16} />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-stone-200 text-center text-stone-500 text-sm">
        <div className="container mx-auto px-4">
          <p>  {new Date().getFullYear()} Alacart. Built for creators, by creators.</p>
        </div>
      </footer>
    </div>
  )
}
