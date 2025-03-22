
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

const NotFound = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = window.location.pathname;

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location
    );
  }, [location]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4 animate-fade-in">
        <h1 className="text-7xl font-bold mb-6 font-display">404</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Oops! We couldn't find the page you were looking for.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button onClick={() => navigate("/dashboard")} className="w-full sm:w-auto">
            {user ? "Back to Dashboard" : "Back to Login"}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate("/")} 
            className="w-full sm:w-auto"
          >
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
