
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
    try {
      const response = await supabase
        .from('stations')
        .select('*')
        .order('name');
      return response;
    } catch (error) {
      console.error('Error fetching stations:', error);
      return { data: null, error: error as any };
    }
  }, []);
}

export function useStation(stationId: string | null) {
  return useSupabaseFetch<any>(async () => {
    if (!stationId) {
      return { data: null, error: null } as PostgrestSingleResponse<any>;
    }
    
    try {
      const response = await supabase
        .from('stations')
        .select('*')
        .eq('id', stationId)
        .single();
      return response;
    } catch (error) {
      console.error('Error fetching station:', error);
      return { data: null, error: error as any };
    }
  }, [stationId]);
}

// Basic function to fetch profiles
export function useProfiles() {
  return useSupabaseFetch<any[]>(async () => {
    try {
      const response = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      return response;
    } catch (error) {
      console.error('Error fetching profiles:', error);
      return { data: null, error: error as any };
    }
  }, []);
}
