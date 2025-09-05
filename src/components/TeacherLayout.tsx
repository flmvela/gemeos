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
    navigate('/admin/dashboard');
  };

  return (
    <BreadcrumbProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          
          <div className="flex-1 flex flex-col">
            {/* Header with hamburger menu */}
            <header className="h-14 border-b bg-background flex items-center px-4">
              <SidebarTrigger />
              <div className="ml-4 flex-1">
                <h1 
                  className="text-lg font-semibold cursor-pointer hover:text-primary transition-colors"
                  onClick={handleGemeosClick}
                >
                  Gemeos
                </h1>
              </div>
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