
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SupabaseInitializer = () => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initializeSupabase = async () => {
      try {
        // Check connection by making a simple query
        const { error } = await supabase.from('profiles').select('count').limit(1);
        
        if (error) {
          console.error('Supabase initialization error:', error);
          toast.error('Failed to connect to the database');
          return;
        }

        setInitialized(true);
        console.log('Supabase connection initialized successfully');
      } catch (error) {
        console.error('Supabase initialization error:', error);
        toast.error('Failed to connect to the database');
      }
    };

    initializeSupabase();
  }, []);

  return null; // This is a utility component, no UI rendering needed
};

export default SupabaseInitializer;
