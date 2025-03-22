
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "sonner";
import { UserRole } from '@/lib/constants';
import { supabase, handleSupabaseError, Profile } from '@/lib/supabase';

// User interface enhanced with Supabase
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

// This is the fallback mock data - used when Supabase connection fails
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

  // Check if user is already authenticated on load
  useEffect(() => {
    async function checkAuth() {
      setIsLoading(true);
      try {
        // Get current session from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (session?.user) {
          // Get user profile data
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*, stations:station_id(name)')
            .eq('user_id', session.user.id)
            .single();

          if (profileError) {
            throw profileError;
          }

          if (profile) {
            // Create user object from profile data
            const userData: User = {
              id: session.user.id,
              email: session.user.email || '',
              name: profile.full_name,
              role: profile.role as UserRole,
              station_id: profile.station_id,
              station_name: profile.stations?.name
            };
            
            setUser(userData);
            localStorage.setItem('fs_user', JSON.stringify(userData));
          }
        } else {
          // Check for stored user in localStorage (fallback)
          const storedUser = localStorage.getItem('fs_user');
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch (error) {
              console.error("Failed to parse stored user", error);
              localStorage.removeItem('fs_user');
            }
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
        // Fallback to localStorage if Supabase session check fails
        const storedUser = localStorage.getItem('fs_user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (error) {
            console.error("Failed to parse stored user", error);
            localStorage.removeItem('fs_user');
          }
        }
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Try to sign in with Supabase
      const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // If Supabase auth fails, fallback to mock data (for demo purposes)
        console.warn("Supabase auth failed, using mock data:", authError.message);
        const foundUser = MOCK_USERS.find(u => u.email === email && u.password === password);
        
        if (foundUser) {
          const { password, ...userWithoutPassword } = foundUser;
          setUser(userWithoutPassword);
          localStorage.setItem('fs_user', JSON.stringify(userWithoutPassword));
          toast.success(`Welcome back, ${userWithoutPassword.name}!`);
        } else {
          toast.error("Invalid email or password");
        }
        return;
      }

      if (session) {
        // Get user profile data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*, stations:station_id(name)')
          .eq('user_id', session.user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        if (profile) {
          // Create user object from profile data
          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: profile.full_name,
            role: profile.role as UserRole,
            station_id: profile.station_id,
            station_name: profile.stations?.name
          };
          
          setUser(userData);
          localStorage.setItem('fs_user', JSON.stringify(userData));
          toast.success(`Welcome back, ${userData.name}!`);
        } else {
          toast.error("User profile not found");
        }
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
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      // Clear local storage and state
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
