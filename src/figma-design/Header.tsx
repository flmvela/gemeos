import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { LogOut, User, Settings } from "lucide-react";
import { User as UserType } from "../types/user";

interface HeaderProps {
  user: UserType;
  onNavigate: (href: string) => void;
  onSignOut?: () => void;
}

export function Header({ user, onNavigate, onSignOut }: HeaderProps) {
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <header className="border-b border-border bg-card sticky top-0 z-30">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left section - Logo and title */}
          <div>
            <h1>Gemeos</h1>
            <p className="text-muted-foreground">Learning Domain Management</p>
          </div>

          {/* Right section - User profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 p-2">
                <div className="text-right hidden sm:block">
                  <div>{user.name}</div>
                  <div className="text-muted-foreground">{user.email}</div>
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="leading-none">{user.name}</p>
                  <p className="leading-none text-muted-foreground">{user.email}</p>
                  <Badge variant="secondary" className="w-fit mt-1">
                    {user.role}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onNavigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={onSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}