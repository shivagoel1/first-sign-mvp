import { useState } from "react";
import { Mail, Lock, ArrowRight, Sparkles, Baby, BookOpen, Heart, CheckCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface ParentLoginProps {
  onLogin: () => void;
  onNavigate: (page: string) => void;
}

export function ParentLogin({ onLogin, onNavigate }: ParentLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-orange-50/30">
      {/* Hero Background Section */}
      <div className="relative bg-gradient-to-br from-orange-100 via-orange-50 to-orange-50/30 py-20 md:py-32">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMDMiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40"></div>
        
        <div className="container mx-auto px-4 max-w-6xl relative">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl">FirstSignFirst</span>
            </div>
            <h1 className="text-4xl md:text-5xl mb-4">Welcome Back!</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Continue tracking your child's developmental journey
            </p>
          </div>

          {/* Login Card */}
          <div className="max-w-md mx-auto">
            <Card className="p-8 shadow-2xl border-2">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="email" className="text-base">Email Address</Label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="parent@example.com"
                      className="pl-12 h-12 text-base"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password" className="text-base">Password</Label>
                  <div className="relative mt-2">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pl-12 h-12 text-base"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                    <span className="text-sm text-muted-foreground">Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                    onClick={() => onNavigate("home")}
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 text-base"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      Login to Dashboard
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <button
                    onClick={() => onNavigate("assessment")}
                    className="text-primary hover:underline font-medium"
                  >
                    Start your first assessment
                  </button>
                </p>
              </div>
            </Card>

            {/* Physician Login Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Are you a physician?{" "}
                <button
                  onClick={() => onNavigate("physician-login")}
                  className="text-secondary-accent hover:underline font-medium"
                >
                  Login here
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}