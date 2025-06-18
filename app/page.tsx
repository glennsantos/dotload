import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Shield, Package, Globe, Clock, Zap, Check, LayoutDashboard, Plus, Sparkles } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { AuthButtons } from "@/components/auth/auth-buttons";
import { HeroSection } from "@/components/home/hero-section";
import { CTASection } from "@/components/home/cta-section";

// HeroSection moved to client component

// CTASection moved to client component

// Auth buttons moved to client component

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-background to-background/90">
      {/* Header */}
      <header className="border-b border-border/50 py-4 backdrop-blur-sm bg-background/80">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="group">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Dotload Logo" width={40} height={40} className="group-hover:scale-105 transition-transform" />
              <span className="text-xl font-semibold text-foreground">dotload</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <AuthButtons />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Welcome to the future of digital commerce
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="text-foreground">Sell anything</span>
              <br />
              <span className="text-primary">anywhere</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Create beautiful checkout pages for your digital products in minutes. 
              No coding required, just focus on what you do best.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg">
              Start Selling Today
            </Button>
            <Button variant="outline" size="lg" className="border-border/50 px-8 py-6 text-lg">
              View Demo
            </Button>
          </div>

          <div className="pt-8">
            <p className="text-sm text-muted-foreground mb-4">Trusted by creators worldwide</p>
            <div className="flex items-center justify-center gap-8 opacity-60">
              {/* Add logos or stats here */}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to help creators like you build, sell, and scale
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Lightning Fast Setup",
                description: "Create professional checkout pages in under 2 minutes with our intuitive builder"
              },
              {
                icon: Shield,
                title: "Enterprise Security",
                description: "Bank-grade security with built-in fraud protection and secure payment processing"
              },
              {
                icon: Globe,
                title: "Get Paid Instantly",
                description: "Accept GCash, Debit/Credit Card, and more"
              }
            ].map((feature, index) => (
              <div key={index} className="group">
                <div className="claude-card rounded-xl p-8 h-full transition-all duration-300 group-hover:shadow-claude-lg">
                  <div className="mb-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
                Built for creators, by creators
              </h2>
              
              <div className="space-y-6">
                {[
                  "Professional checkout pages with conversion optimization",
                  "Digital product delivery with smart download limits",
                  "Product variants and inventory management",
                  "Advanced analytics and sales insights",
                  "Custom branding and mobile-responsive design",
                  "Promo codes and discount campaigns"
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-muted-foreground">{feature}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="claude-gradient rounded-2xl p-8">
                <div className="claude-card rounded-xl p-8 text-center">
                  <div className="w-16 h-16 bg-primary rounded-xl mx-auto mb-6 flex items-center justify-center">
                    <Zap className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    Ready to get started?
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Join thousands of creators already using dotload to sell their products
                  </p>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Create Your Store
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50 text-center">
        <div className="container mx-auto px-4">
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} Dotload. Built for creators, by creators.
          </p>
        </div>
      </footer>
    </div>
  )
}
