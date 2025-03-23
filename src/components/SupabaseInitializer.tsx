
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SupabaseInitializer = ({ children }: { children: React.ReactNode }) => {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeSupabase = async () => {
      try {
        // Check connection by making a simple query
        const { error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact' })
          .limit(1);
        
        if (error) {
          console.error('Supabase initialization error:', error);
          setError(error.message);
          toast.error('Failed to connect to the database');
          return;
        }

        setInitialized(true);
        console.info('Supabase connection initialized successfully');
      } catch (err: any) {
        console.error('Supabase initialization error:', err);
        setError(err.message);
        toast.error('Failed to connect to the database');
      }
    };

    initializeSupabase();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md p-6 bg-card rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Connection Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-sm text-muted-foreground">
            Please check your Supabase configuration and try again.
          </p>
        </div>
      </div>
    );
  }

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Connecting to database...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default SupabaseInitializer;
