'use client';

import { SignedIn, SignOutButton, useUser } from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeftFromLineIcon, Moon, Sun, User } from "lucide-react";
import { Button } from "./ui/button";
import { useTheme } from "next-themes";
import Link from "next/link";

export function UserAvatar() {
  const { user } = useUser();
  const { setTheme, theme } = useTheme();

  if (!user) {
    return null;
  }

  const toggleTheme = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none">
        {user.imageUrl ? (
          <img
            src={user.imageUrl}
            alt={user.fullName || "User avatar"}
            className="w-8 h-8 rounded-full ring-2 ring-primary/10 transition-all hover:ring-primary/30"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
            <User className="w-4 h-4 text-primary" />
          </div>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.fullName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/contact" className="cursor-pointer">
            Customer Support
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <div className="flex items-center justify-between w-full">
            Theme
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="h-8 w-8 hover:bg-transparent"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="focus:bg-red-500 focus:text-white">
          <SignedIn>
            <div className="flex items-center justify-between w-full">
              Sign out
              <Button 
                asChild 
                variant="ghost" 
                size="icon"
                className="p-3 border-1 hover:border-red-500 hover:bg-transparent"
              >
                <SignOutButton redirectUrl="/sign-in">
                  <ArrowLeftFromLineIcon className="stroke-red-500" />
                </SignOutButton>
              </Button>
            </div>
          </SignedIn>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
