import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  GraduationCap, 
  LayoutDashboard, 
  BookOpen, 
  LogOut, 
  User,
  Settings,
  Menu,
  X,
  Users
} from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { user, profile, role, signOut, isLoading } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getDashboardLink = () => {
    switch (role) {
      case "admin":
        return "/admin";
      case "faculty":
        return "/faculty";
      default:
        return "/dashboard";
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b-2 border-border/50 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 mx-auto max-w-7xl">
        <Link to="/" className="flex items-center gap-3 transition-all hover:opacity-80 group">
          <div className="flex h-20 w-16  items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <img 
              src="/V Connect V03.png" 
              alt="Vhub Logo" 
              className="h-full w-full object-contain"
            />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Vhub
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2">
          <Link 
            to="/courses" 
            className="px-4 py-2 text-sm font-semibold text-muted-foreground rounded-lg transition-all hover:text-foreground hover:bg-muted/50"
          >
            Courses
          </Link>
          {user && (
            <Link 
              to={getDashboardLink()} 
              className="px-4 py-2 text-sm font-semibold text-muted-foreground rounded-lg transition-all hover:text-foreground hover:bg-muted/50"
            >
              Dashboard
            </Link>
          )}
        </div>

        {/* Auth Section */}
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="h-9 w-20 animate-pulse rounded-lg bg-muted" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile?.full_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    <p className="text-xs leading-none text-primary capitalize">{role}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(getDashboardLink())}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/courses")}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Browse Courses
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                {role === "admin" && (
                  <>
                    <DropdownMenuItem onClick={() => navigate("/admin/users")}>
                      <Users className="mr-2 h-4 w-4" />
                      User Management
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/admin/settings")}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                asChild 
                className="hidden sm:flex h-9 font-semibold"
              >
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button 
                size="sm" 
                asChild
                className="h-9 font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-md hover:shadow-lg transition-all"
              >
                <Link to="/auth?tab=signup">Get Started</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-border/50 bg-background/95 backdrop-blur-xl animate-slide-down">
          <div className="container px-4 py-4 space-y-2">
            <Link
              to="/courses"
              className="block px-4 py-3 text-sm font-semibold rounded-lg hover:bg-muted/50 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Courses
            </Link>
            {user && (
              <Link
                to={getDashboardLink()}
                className="block px-4 py-3 text-sm font-semibold rounded-lg hover:bg-muted/50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
            )}
            {!user && (
              <>
                <Link
                  to="/auth"
                  className="block px-4 py-3 text-sm font-semibold rounded-lg hover:bg-muted/50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/auth?tab=signup"
                  className="block px-4 py-3 text-sm font-semibold rounded-lg bg-gradient-to-r from-primary to-purple-600 text-white hover:from-primary/90 hover:to-purple-600/90 transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
