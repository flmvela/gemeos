import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Segmented Tabs: canonical segmented control styling built on top of Radix Tabs
// Uses semantic tokens only (see index.css and tailwind.config.ts)

export const SegmentedTabs = Tabs;

export const SegmentedTabsList = React.forwardRef<
  React.ElementRef<typeof TabsList>,
  React.ComponentPropsWithoutRef<typeof TabsList>
>(({ className, ...props }, ref) => (
  <TabsList
    ref={ref}
    className={cn(
      "w-full justify-start rounded-full bg-muted h-12 p-1 border",
      className
    )}
    {...props}
  />
));
SegmentedTabsList.displayName = "SegmentedTabsList";

export const SegmentedTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsTrigger>,
  React.ComponentPropsWithoutRef<typeof TabsTrigger>
>(({ className, ...props }, ref) => (
  <TabsTrigger
    ref={ref}
    className={cn(
      "flex-1 rounded-full h-10 px-6 text-sm font-medium transition-all",
      // inactive: transparent over grey container
      "data-[state=inactive]:bg-transparent data-[state=inactive]:text-foreground",
      // active: white pill with subtle double border effect
      "data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:border-2 data-[state=active]:border-border data-[state=active]:shadow-[0_0_0_3px_hsl(var(--muted))]",
      // focus
      "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
SegmentedTabsTrigger.displayName = "SegmentedTabsTrigger";

export const SegmentedTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsContent>,
  React.ComponentPropsWithoutRef<typeof TabsContent>
>(({ className, ...props }, ref) => (
  <TabsContent ref={ref} className={cn("mt-0", className)} {...props} />
));
SegmentedTabsContent.displayName = "SegmentedTabsContent";
