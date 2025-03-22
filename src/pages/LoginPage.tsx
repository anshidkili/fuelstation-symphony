
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="flex-1 flex flex-col justify-center items-center p-4">
        <div className="text-center mb-6 animate-fade-in">
          <h1 className="text-4xl font-bold font-display mb-2">Fuel Symphony</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            The complete management system for your fuel station operations
          </p>
        </div>

        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
      
      <footer className="py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Fuel Symphony. All rights reserved.
      </footer>
    </div>
  );
}
