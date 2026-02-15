'use client';

import Link from 'next/link';
import { Bike, CircleUser } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { Button } from '@/components/ui/button';
import { UnitsToggle } from '@/components/units-toggle';
import { ModeToggle } from '@/components/mode-toggle';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 flex h-14 items-center border-b border-border bg-card px-2 sm:px-4">
      <Link
        href="/"
        className="mr-2 flex items-center gap-2 text-foreground hover:text-primary sm:mr-4"
      >
        <Bike className="h-5 w-5" />
        <span className="hidden text-lg font-bold sm:inline">CycleRoute</span>
      </Link>
      <NavigationMenu className="hidden sm:flex">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
              <Link href="/">My Routes</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <UnitsToggle />
        <ModeToggle />
        <Button variant="ghost" size="icon">
          <CircleUser className="h-5 w-5" />
          <span className="sr-only">User</span>
        </Button>
      </div>
    </header>
  );
}
