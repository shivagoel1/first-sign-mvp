import { Baby, Menu, User, Sparkles } from "lucide-react";
import { Button } from "./ui/button";

interface HeaderProps {
  onNavigate?: (page: string) => void;
  currentPage?: string;
  userType?: "parent" | "physician" | "guest";
}

export function Header({ onNavigate, currentPage, userType = "guest" }: HeaderProps) {
  return (
    <header className="border-b border-orange-200 bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => onNavigate?.("home")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg text-stone-800">FirstSignFirst</span>
          </button>

          <nav className="hidden md:flex items-center gap-6">
            {userType === "parent" && (
              <>
                <button 
                  onClick={() => onNavigate?.("dashboard")}
                  className={`text-sm transition-colors ${
                    currentPage === "dashboard" 
                      ? "text-primary" 
                      : "text-foreground hover:text-primary"
                  }`}
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => onNavigate?.("assessment")}
                  className={`text-sm transition-colors ${
                    currentPage === "assessment" 
                      ? "text-primary" 
                      : "text-foreground hover:text-primary"
                  }`}
                >
                  New Assessment
                </button>
              </>
            )}
            {userType === "physician" && (
              <>
                <button 
                  onClick={() => onNavigate?.("physician-dashboard")}
                  className={`text-sm transition-colors ${
                    currentPage === "physician-dashboard" 
                      ? "text-primary" 
                      : "text-foreground hover:text-primary"
                  }`}
                >
                  Review Queue
                </button>
              </>
            )}
            {userType === "guest" && (
              <>
                <button 
                  onClick={() => onNavigate?.("home")}
                  className={`text-sm transition-colors ${
                    currentPage === "home" 
                      ? "text-primary" 
                      : "text-foreground hover:text-primary"
                  }`}
                >
                  Home
                </button>
                <button 
                  onClick={() => onNavigate?.("parent-login")}
                  className="text-sm text-foreground hover:text-primary transition-colors"
                >
                  Parent Login
                </button>
                <button 
                  onClick={() => onNavigate?.("physician-login")}
                  className="text-sm text-foreground hover:text-primary transition-colors"
                >
                  Physician Login
                </button>
              </>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {userType !== "guest" && (
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="w-5 h-5" />
              </Button>
            )}
            {userType === "guest" && (
              <Button 
                variant="default"
                className="hidden sm:flex bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => onNavigate?.("assessment")}
              >
                Start Assessment
              </Button>
            )}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}