import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, UserPlus } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const Clients = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Clients</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Clients</h1>
        <p className="text-muted-foreground mt-2">
          Manage client organizations and their users
        </p>
      </div>

      {/* Coming Soon Card */}
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Client Management</CardTitle>
          <CardDescription className="text-lg">
            This feature is coming soon
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-6">
            The client management system will allow you to:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="p-4 bg-muted/50 rounded-lg">
              <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="font-medium">Manage Organizations</div>
              <div className="text-sm text-muted-foreground">Create and configure client organizations</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <UserPlus className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="font-medium">User Access</div>
              <div className="text-sm text-muted-foreground">Control user permissions and access levels</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <Building2 className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="font-medium">Domain Assignment</div>
              <div className="text-sm text-muted-foreground">Assign learning domains to client organizations</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Clients;