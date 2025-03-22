
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/lib/constants';
import { toast } from 'sonner';

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
  session: any;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        
        if (currentSession?.user) {
          try {
            // Get user profile data
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*, stations:station_id(name)')
              .eq('user_id', currentSession.user.id)
              .single();

            if (profileError) throw profileError;

            if (profile) {
              const userData: User = {
                id: currentSession.user.id,
                email: currentSession.user.email || '',
                name: profile.full_name,
                role: profile.role as UserRole,
                station_id: profile.station_id,
                station_name: profile.stations?.name
              };
              
              setUser(userData);
              localStorage.setItem('fs_user', JSON.stringify(userData));
            } else {
              setUser(null);
              localStorage.removeItem('fs_user');
            }
          } catch (error) {
            console.error("Error fetching user profile:", error);
            // Fallback to localStorage if profile fetch fails
            const storedUser = localStorage.getItem('fs_user');
            if (storedUser) {
              try {
                setUser(JSON.parse(storedUser));
              } catch (e) {
                localStorage.removeItem('fs_user');
              }
            }
          }
        } else {
          setUser(null);
          localStorage.removeItem('fs_user');
        }
        
        setIsLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      
      if (currentSession?.user) {
        // Get user profile data
        supabase
          .from('profiles')
          .select('*, stations:station_id(name)')
          .eq('user_id', currentSession.user.id)
          .single()
          .then(({ data: profile, error: profileError }) => {
            if (profileError) {
              console.error("Error fetching user profile:", profileError);
              // Fallback to localStorage
              const storedUser = localStorage.getItem('fs_user');
              if (storedUser) {
                try {
                  setUser(JSON.parse(storedUser));
                } catch (e) {
                  localStorage.removeItem('fs_user');
                }
              }
              setIsLoading(false);
              return;
            }

            if (profile) {
              const userData: User = {
                id: currentSession.user.id,
                email: currentSession.user.email || '',
                name: profile.full_name,
                role: profile.role as UserRole,
                station_id: profile.station_id,
                station_name: profile.stations?.name
              };
              
              setUser(userData);
              localStorage.setItem('fs_user', JSON.stringify(userData));
            }
            
            setIsLoading(false);
          });
      } else {
        // Check localStorage as fallback for development
        const storedUser = localStorage.getItem('fs_user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            localStorage.removeItem('fs_user');
          }
        }
        
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // User profile data will be fetched by the auth state listener
        toast.success("Signed in successfully");
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast.error(error.message || "Authentication failed");
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      setUser(null);
      localStorage.removeItem('fs_user');
      toast.success("Signed out successfully");
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast.error(error.message || "Failed to sign out");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signIn, signOut }}>
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

export default useAuth;
