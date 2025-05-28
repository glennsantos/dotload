import type React from "react"
import Link from "next/link"
import {
  HomeIcon,
  PackageIcon,
  FileTextIcon,
  UsersIcon,
  BarChartIcon,
  DollarSignIcon,
  SearchIcon,
  BookmarkIcon,
  ShoppingBagIcon,
  HelpCircleIcon,
  SettingsIcon,
} from "lucide-react"

export default function Sidebar() {
  return (
    <div className="w-[200px] bg-black text-white flex flex-col h-full">
      <div className="p-6 pb-8">
        <h1 className="text-2xl font-bold">alaCart</h1>
      </div>

      <nav className="flex-1">
        <SidebarItem icon={<HomeIcon size={18} />} label="Home" href="/dashboard" />
        <SidebarItem icon={<PackageIcon size={18} />} label="Products" href="/products" />
        <SidebarItem icon={<FileTextIcon size={18} />} label="Posts" href="/posts" />
        <SidebarItem icon={<UsersIcon size={18} />} label="Audience" href="/audience" />
        <SidebarItem icon={<BarChartIcon size={18} />} label="Analytics" href="/analytics" />
        <div className="h-12 border-b border-gray-800"></div>
        <SidebarItem icon={<DollarSignIcon size={18} />} label="Payouts" href="/payouts" />
        <SidebarItem icon={<SearchIcon size={18} />} label="Discover" href="/discover" />
        <SidebarItem icon={<BookmarkIcon size={18} />} label="Library" href="/library" />
        <div className="h-12 border-b border-gray-800"></div>
        <SidebarItem icon={<ShoppingBagIcon size={18} />} label="Start selling" href="/start-selling" />
        <SidebarItem icon={<HelpCircleIcon size={18} />} label="Help" href="/help" />
        <SidebarItem icon={<SettingsIcon size={18} />} label="Settings" href="/settings" />
      </nav>
    </div>
  )
}

function SidebarItem({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <Link href={href} className="flex items-center px-6 py-3 hover:bg-gray-900 cursor-pointer">
      <span className="mr-3 text-gray-400">{icon}</span>
      <span>{label}</span>
    </Link>
  )
}
