// components/ui/concept-tabs.tsx
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

// Root
const Tabs = TabsPrimitive.Root

// Segmented-control container
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "grid w-full h-12 items-center rounded-full p-1",
      "bg-[#ECECF0] border border-[#E5E7EB]",     // light border to match figma
      "gap-3",                                     // space between pills
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

// Individual pill
const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "w-full inline-flex h-10 items-center justify-center whitespace-nowrap rounded-full px-6",
      "text-[15px] font-medium transition-all",
      // remove theme focus ring (orange)
      "focus-visible:outline-none focus-visible:ring-0",
      // inactive state: grey pill + muted text
      "data-[state=inactive]:bg-[#ECECF0] data-[state=inactive]:text-slate-600",
      // active state: white pill + subtle double-outline via box-shadow
      // 1) inner 1px border (slate-300), 2) outer 3px halo (slate-200)
      "data-[state=active]:bg-white data-[state=active]:text-slate-900",
      "data-[state=active]:shadow-[inset_0_0_0_1px_#D1D5DB,0_0_0_3px_#E5E7EB]",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("mt-4 focus-visible:outline-none focus-visible:ring-0", className)}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
