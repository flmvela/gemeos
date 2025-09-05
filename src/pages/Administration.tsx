import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Users, FileText, BarChart3, Shield, Brain } from "lucide-react";
import { Link } from "react-router-dom";

const Administration = () => {
  const adminSections = [
    {
      title: "User Management",
      description: "Manage student accounts and teacher profiles",
      icon: Users,
      status: "Active",
      items: ["View all users", "Manage permissions", "Account settings"],
    },
    {
      title: "Content Management",
      description: "Oversee curricula, concepts, and learning materials",
      icon: FileText,
      status: "Active", 
      items: ["Review curricula", "Manage domains", "Content approval"],
    },
    {
      title: "Analytics & Reports",
      description: "View system metrics and generate reports",
      icon: BarChart3,
      status: "Coming Soon",
      items: ["Usage statistics", "Performance reports", "Export data"],
    },
    {
      title: "System Security",
      description: "Monitor security settings and access controls",
      icon: Shield,
      status: "Active",
      items: ["Security logs", "Access controls", "Audit trail"],
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Administration</h1>
        <p className="text-muted-foreground mt-2">
          Manage system settings, users, and monitor platform health
        </p>
      </div>

      {/* Admin Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminSections.map((section, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <section.icon className="h-6 w-6 text-primary" />
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </div>
                <Badge 
                  variant={section.status === "Active" ? "default" : "secondary"}
                >
                  {section.status}
                </Badge>
              </div>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
              <Button 
                variant={section.status === "Active" ? "default" : "secondary"} 
                className="w-full"
                disabled={section.status !== "Active"}
              >
                {section.status === "Active" ? "Manage" : "Coming Soon"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Page Permissions
            </CardTitle>
            <CardDescription>
              Manage role-based access control for application pages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/admin/page-permissions">
                Manage Permissions
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Feedback Settings
            </CardTitle>
            <CardDescription>
              Configure AI training feedback loops for each domain and learning aspect
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/admin/settings/feedback">
                Manage AI Feedback
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>System Overview</span>
          </CardTitle>
          <CardDescription>
            Quick overview of platform status and key metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-foreground">156</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-foreground">23</div>
              <div className="text-sm text-muted-foreground">Active Teachers</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-foreground">4</div>
              <div className="text-sm text-muted-foreground">Learning Domains</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Administration;