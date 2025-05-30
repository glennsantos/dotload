import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Package, Globe, Clock, Zap, Check } from "lucide-react"

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
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8 py-6 flex items-center gap-2 text-lg">
              <Link href="/register">
                Get Started Free <ArrowRight size={16} />
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-stone-200 text-stone-700 hover:bg-stone-50 rounded-full text-lg px-8 py-6 flex items-center gap-2">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 py-10">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-light text-stone-900 mb-4">Why Choose Alacart?</h2>
          <p className="text-lg text-stone-600">Everything you need to start selling online</p>
        </div>
        <div className="grid md:grid-cols-3 gap-12">
          <div className="rounded-lg border text-card-foreground bg-white border-stone-200 shadow-sm">
            <div className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <Zap className="h-5 w-5 text-stone-600" />
              </div>
              <h3 className="text-xl font-medium text-stone-900 mb-4">2-Minute Setup</h3>
              <p className="text-stone-600 leading-relaxed">Create professional checkout pages in under 2 minutes with our smart wizard</p>
            </div>
          </div>
          <div className="rounded-lg border text-card-foreground bg-white border-stone-200 shadow-sm">
            <div className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <Shield className="h-5 w-5 text-stone-600" />
              </div>
              <h3 className="text-xl font-medium text-stone-900 mb-4">Secure Payments</h3>
              <p className="text-stone-600 leading-relaxed">Built-in Stripe integration with enterprise-level security and trust indicators</p>
            </div>
          </div>
          <div className="rounded-lg border text-card-foreground bg-white border-stone-200 shadow-sm">
            <div className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <Globe className="h-5 w-5 text-stone-600" />
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
                    <Check className="h-4 w-4" />
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
                      <Zap className="h-8 w-8 text-white" />
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
          <h2 className="text-3xl font-light mb-4">Ready to Start Selling?</h2>
          <p className="mb-8">Join thousands of creators already using Alacart</p>
          <Button
            asChild
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8 py-6 text-lg flex items-center gap-1.5 mx-auto w-fit"
          >
            <Link href="/register">
              Get Started Free <ArrowRight size={14} />
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
