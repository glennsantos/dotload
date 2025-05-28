import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Settings, LogOut } from "lucide-react";

interface DashboardHeaderProps {
  userName: string;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">Dashboard</h1>
        <p className="text-stone-600 font-light">Welcome back, {userName}</p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          asChild
          className="justify-center whitespace-nowrap text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-light"
        >
          <Link href="/create-product">
            <Plus size={16} /> Create Product
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="border-stone-200 text-stone-700 hover:bg-stone-50 rounded-md"
        >
          <Link href="/settings">
            <Settings size={16} />
            <span className="font-light sr-only md:not-sr-only md:ml-2">Settings</span>
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="border-stone-200 text-stone-700 hover:bg-stone-50 rounded-md"
        >
          <Link href="/api/auth/logout">
            <LogOut size={16} />
            <span className="font-light sr-only md:not-sr-only md:ml-2">Logout</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
