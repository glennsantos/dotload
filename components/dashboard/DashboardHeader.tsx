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
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-stone-200 px-4 sm:px-6 lg:px-8 py-2">
      <div className="flex justify-between items-center h-16">
        <div className="flex items-center space-x-4">
        <Link href="/" className="block">
          <Image 
            src="/logo.png" 
            alt="Alacart Logo" 
            width={120} 
            height={32} 
            className="h-7 w-auto"
            priority
          />
        </Link>
        <div>
          <h1 className="text-2xl font-light text-stone-800">Dashboard</h1>
          <p className="text-sm text-stone-500 font-light">Welcome back, {userName}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button
          asChild 
          variant="default"
          className="h-9 px-4 text-sm font-light"
        >
          <Link href="/create-product" className="flex items-center gap-1">
            <Plus size={16} /> Create Product
          </Link>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-9 w-9 rounded-full relative overflow-hidden hover:bg-stone-100"
            >
              <div className="h-9 w-9 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600 font-medium text-sm">
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
      </div>
      <div className="h-16"></div>
    </>
  );
}
