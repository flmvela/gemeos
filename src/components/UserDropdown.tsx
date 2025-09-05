import { LogOut, User, Mail, ShieldCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const UserDropdown = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
    );
  }

  const userEmail = session?.email;
  const userName = session?.current_tenant?.tenant?.name || 'User';
  const userRole = session?.current_tenant?.role?.display_name || session?.current_tenant?.role?.name;
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const getInitials = () => {
    if (userName) {
      return userName.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (userEmail) {
      return userEmail[0].toUpperCase();
    }
    return 'U';
  };

  const displayName = userName || userEmail || 'User';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            {userEmail && (
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs leading-none text-muted-foreground">
                  {userEmail}
                </p>
              </div>
            )}
            {userRole && (
              <div className="flex items-center gap-1 mt-1">
                <ShieldCheck className="h-3 w-3 text-muted-foreground" />
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  {userRole}
                </Badge>
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};