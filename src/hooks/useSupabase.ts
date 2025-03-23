
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { PostgrestSingleResponse } from '@supabase/supabase-js';

// Generic hook for fetching data from Supabase
export function useSupabaseFetch<T>(
  fetchFn: () => Promise<PostgrestSingleResponse<T>>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await fetchFn();
        
        if (error) {
          throw new Error(error.message);
        }

        if (isMounted) {
          setData(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'An unexpected error occurred');
          toast.error(err.message || 'An unexpected error occurred');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, dependencies);

  return { data, isLoading, error };
}

// Station hooks
export function useStations() {
  return useSupabaseFetch<any[]>(async () => {
    return await supabase
      .from('stations')
      .select('*')
      .order('name');
  }, []);
}

export function useStation(stationId: string | null) {
  return useSupabaseFetch<any>(async () => {
    if (!stationId) {
      return { data: null, error: null, count: null, status: 200, statusText: 'OK' };
    }
    
    return await supabase
      .from('stations')
      .select('*')
      .eq('id', stationId)
      .single();
  }, [stationId]);
}

// Basic function to fetch profiles
export function useProfiles() {
  return useSupabaseFetch<any[]>(async () => {
    return await supabase
      .from('profiles')
      .select('*')
      .order('full_name');
  }, []);
}
