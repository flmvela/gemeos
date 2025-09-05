import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu } from "lucide-react";
import { NavigationItem } from "@/types/user";

interface NavigationOverlayProps {
  navigationItems: NavigationItem[];
  onNavigate: (href: string) => void;
}

export function NavigationOverlay({ navigationItems, onNavigate }: NavigationOverlayProps) {
  const handleNavigation = (href: string) => {
    onNavigate(href);
  };

  const groupedItems = {
    insights: navigationItems.filter((item) => ["dashboard", "analytics", "reports"].includes(item.id)),
    content: navigationItems.filter((item) => ["domains", "concepts", "goals", "exercises"].includes(item.id)),
    management: navigationItems.filter((item) => ["users", "settings"].includes(item.id)),
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="fixed top-4 left-4 z-40 shadow-lg bg-background border-border hover:bg-accent">
          <Menu className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 ml-4 mt-1" side="bottom">
        <DropdownMenuLabel className="font-semibold text-primary">Gemeos Navigation</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs text-muted-foreground font-medium px-2 py-1">INSIGHTS & ANALYTICS</DropdownMenuLabel>
        {groupedItems.insights.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem key={item.id} onClick={() => handleNavigation(item.href)} className="flex items-center gap-3 px-3 py-2 cursor-pointer">
              <Icon className="h-4 w-4 text-primary" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{item.label}</span>
                {item.description && <span className="text-xs text-muted-foreground">{item.description}</span>}
              </div>
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs text-muted-foreground font-medium px-2 py-1">CONTENT MANAGEMENT</DropdownMenuLabel>
        {groupedItems.content.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem key={item.id} onClick={() => handleNavigation(item.href)} className="flex items-center gap-3 px-3 py-2 cursor-pointer">
              <Icon className="h-4 w-4 text-primary" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{item.label}</span>
                {item.description && <span className="text-xs text-muted-foreground">{item.description}</span>}
              </div>
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs text-muted-foreground font-medium px-2 py-1">SYSTEM MANAGEMENT</DropdownMenuLabel>
        {groupedItems.management.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem key={item.id} onClick={() => handleNavigation(item.href)} className="flex items-center gap-3 px-3 py-2 cursor-pointer">
              <Icon className="h-4 w-4 text-primary" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{item.label}</span>
                {item.description && <span className="text-xs text-muted-foreground">{item.description}</span>}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
