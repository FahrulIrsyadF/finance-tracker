"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Menu,
  Tag,
  PieChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/insights", label: "Insight", icon: PieChart },
  { href: "/transactions", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/wallets", label: "Wallet", icon: Wallet },
  { href: "/categories", label: "Lainnya", icon: Menu },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border h-16 safe-area-pb">
      <div className="flex h-full max-w-md mx-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          
          if (href === "/categories") {
            // For Kategori, use DropdownMenu
            return (
              <div key={href} className="flex-1 flex">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={cn(
                      "flex-1 flex flex-col items-center justify-center gap-1 text-xs transition-colors outline-none w-full",
                      active || pathname.startsWith("/budgets") || pathname.startsWith("/recurring")
                        ? "text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", (active || pathname.startsWith("/budgets") || pathname.startsWith("/recurring")) && "stroke-[2.5px]")} />
                    <span>{label}</span>
                  </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="center" className="w-48 mb-2">
                  <DropdownMenuItem render={<Link href="/categories" className="flex items-center w-full cursor-pointer" />}>
                    <Tag className="mr-2 h-4 w-4" />
                    <span>Manajemen Kategori</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/budgets" className="flex items-center w-full cursor-pointer" />}>
                    <PieChart className="mr-2 h-4 w-4" />
                    <span>Batas Anggaran (Budget)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/recurring" className="flex items-center w-full cursor-pointer" />}>
                    <ArrowLeftRight className="mr-2 h-4 w-4" />
                    <span>Transaksi Rutin</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
          }

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 text-xs transition-colors",
                active
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "stroke-[2.5px]")} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
