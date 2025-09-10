import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { UserDropdown } from "@/components/UserDropdown"
import { BreadcrumbProvider } from "@/components/navigation/BreadcrumbProvider"
import { ReactNode } from "react"
import { useNavigate } from "react-router-dom"

interface TeacherLayoutProps {
  children: ReactNode
}

export function TeacherLayout({ children }: TeacherLayoutProps) {
  const navigate = useNavigate();

  const handleGemeosClick = () => {
    navigate('/tenant/dashboard');
  };

  return (
    <BreadcrumbProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-gray-50">
          <AppSidebar />
          
          <div className="flex-1 flex flex-col">
            {/* Header with user dropdown only */}
            <header className="h-14 border-b bg-background flex items-center justify-end px-4">
              <UserDropdown />
            </header>

            {/* Main content */}
            <main className="flex-1">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </BreadcrumbProvider>
  )
}