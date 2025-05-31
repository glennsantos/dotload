import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Plus, Settings, LogOut, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardHeaderProps {
  userName: string;
  userEmail?: string;
}

export function DashboardHeader({ userName, userEmail }: DashboardHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center space-x-4">
        <Link href="/" className="block">
          <Image 
            src="/logo.png" 
            alt="Alacart Logo" 
            width={120} 
            height={32} 
            className="h-8 w-auto"
            priority
          />
        </Link>
        <div>
          <h1 className="text-3xl font-light text-stone-800">Dashboard</h1>
          <p className="text-stone-600 font-light">Welcome back, {userName}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button
          asChild variant="default"
        >
          <Link href="/create-product">
            <Plus size={16} /> Create Product
          </Link>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="default" size="lg"
              className="h-10 w-10 p-0 rounded-full flex items-center justify-center relative overflow-hidden bg-emerald-200"
            >
              <div className="h-10 w-10 rounded-full flex items-center justify-center text-emerald-600 font-medium">
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground break-all">
                  {userEmail || 'No email provided'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/api/auth/logout" className="cursor-pointer flex items-center">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
