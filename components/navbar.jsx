"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

const menuItems = [
  {
    title: "Clusters",
    href: "/clusters",
    description: "Manage and monitor K3s clusters"
  },
  {
    title: "Nodes",
    href: "/nodes",
    description: "View cluster nodes and their status"
  },
  {
    title: "Namespaces",
    href: "/namespaces",
    description: "Manage Kubernetes namespaces"
  },
  {
    title: "Deployments",
    href: "/deployments",
    description: "Monitor and manage deployments"
  },
  {
    title: "Pods",
    href: "/pods",
    description: "Monitor running pods and workloads"
  },
  {
    title: "Network",
    href: "/network",
    description: "Manage services and ingresses"
  },
  {
    title: "Playground",
    href: "/playground",
    description: "Test pod creation and monitor status flow"
  }
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="hidden md:flex">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold">
              K3s Manager
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname === item.href ? "text-foreground" : "text-foreground/60"
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block w-[120px]">
          {/* Spacer to balance the layout */}
        </div>
        
        {/* Mobile Navigation */}
        <div className="flex md:hidden">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">K3s Manager</span>
          </Link>
        </div>

        <NavigationMenu className="md:hidden ml-auto">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[200px] gap-3 p-4">
                  {menuItems.map((item) => (
                    <li key={item.href}>
                      <NavigationMenuLink asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                            pathname === item.href && "bg-accent"
                          )}
                        >
                          <div className="text-sm font-medium leading-none">
                            {item.title}
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            {item.description}
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  );
}