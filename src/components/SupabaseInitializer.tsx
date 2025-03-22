
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface SupabaseInitializerProps {
  children: React.ReactNode;
}

export function SupabaseInitializer({ children }: SupabaseInitializerProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSupabase = async () => {
      try {
        // Simple check to see if we can connect to Supabase
        const { error } = await supabase.from('stations').select('count', { count: 'exact', head: true });
        
        if (error) {
          throw new Error(`Failed to connect to Supabase: ${error.message}`);
        }
        
        setIsInitialized(true);
      } catch (err: any) {
        console.error('Supabase initialization error:', err);
        setError(err.message);
        // Continue anyway, to allow the app to work with mock data
        setIsInitialized(true);
      }
    };

    checkSupabase();
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Connecting to database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.warn('Using mock data due to Supabase connection error');
  }

  return <>{children}</>;
}
