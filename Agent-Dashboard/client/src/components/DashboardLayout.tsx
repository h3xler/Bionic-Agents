/**
 * Dashboard Layout with Sidebar Navigation
 */

import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  Bot, 
  DollarSign, 
  Settings,
  Activity,
  DoorOpen,
  Server,
  Building2
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Rooms", href: "/rooms", icon: DoorOpen },
  { name: "Sessions", href: "/sessions", icon: Users },
  { name: "Agents", href: "/agents", icon: Bot },
  { name: "Tenants", href: "/tenants", icon: Building2 },
  { name: "Runtime", href: "/runtime", icon: Server },
  { name: "Costs", href: "/costs", icon: DollarSign },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b px-6">
            <Activity className="h-6 w-6 text-primary" />
            <span className="ml-2 text-lg font-semibold">LiveKit Dashboard</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = location === item.href || 
                (item.href !== "/" && location.startsWith(item.href));
              
              return (
                <Link key={item.name} href={item.href}>
                  <span
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t p-4">
            <Link href="/settings">
              <span className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer">
                <Settings className="h-5 w-5" />
                Settings
              </span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="pl-64">
        <main className="min-h-screen p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
