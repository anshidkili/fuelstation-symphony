
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

type User = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  station_id: string | null;
  station_name?: string;
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check auth status on initial load
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: authData } = await supabase.auth.getSession();
        
        if (authData?.session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select(`
              id,
              full_name,
              role,
              station_id,
              email,
              stations:station_id (name)
            `)
            .eq('user_id', authData.session.user.id)
            .single();

          if (data) {
            setUser({
              id: data.id,
              full_name: data.full_name,
              role: data.role,
              station_id: data.station_id,
              station_name: data.stations?.name,
              email: data.email,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select(`
              id,
              full_name,
              role,
              station_id,
              email,
              stations:station_id (name)
            `)
            .eq('user_id', session.user.id)
            .single();

          if (data) {
            setUser({
              id: data.id,
              full_name: data.full_name,
              role: data.role,
              station_id: data.station_id,
              station_name: data.stations?.name,
              email: data.email,
            });
          }
        } catch (error) {
          console.error('Error fetching user after auth change:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast.success('Logged in successfully');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Failed to login');
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setUser(null);
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Failed to logout');
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);
      
      if (error) throw error;
      
      setUser({ ...user, ...data });
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
