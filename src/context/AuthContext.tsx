
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "sonner";
import { UserRole } from '@/lib/constants';

// This is a temporary mock for Supabase auth
// In the real implementation, this would use Supabase authentication
interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  station_id?: string;
  station_name?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock data - this would come from Supabase
const MOCK_USERS = [
  {
    id: "1",
    email: "superadmin@fuelstation.com",
    password: "password",
    name: "John Super",
    role: UserRole.SUPER_ADMIN,
  },
  {
    id: "2",
    email: "admin@fuelstation.com",
    password: "password",
    name: "Jane Admin",
    role: UserRole.ADMIN,
    station_id: "1",
    station_name: "Downtown Fuel Station",
  },
  {
    id: "3",
    email: "employee@fuelstation.com",
    password: "password",
    name: "Bob Employee",
    role: UserRole.EMPLOYEE,
    station_id: "1",
    station_name: "Downtown Fuel Station",
  },
  {
    id: "4",
    email: "customer@company.com",
    password: "password",
    name: "Alice Customer",
    role: UserRole.CREDIT_CUSTOMER,
    station_id: "1",
    station_name: "Downtown Fuel Station",
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if there's a stored user session
    const storedUser = localStorage.getItem('fs_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user", error);
        localStorage.removeItem('fs_user');
      }
    }
    setIsLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Mock authentication - will be replaced with Supabase auth
      const foundUser = MOCK_USERS.find(u => u.email === email && u.password === password);
      
      if (foundUser) {
        const { password, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword);
        localStorage.setItem('fs_user', JSON.stringify(userWithoutPassword));
        toast.success(`Welcome back, ${userWithoutPassword.name}!`);
      } else {
        toast.error("Invalid email or password");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      // Mock logout - will be replaced with Supabase auth
      setUser(null);
      localStorage.removeItem('fs_user');
      toast.success("You have been signed out successfully");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
