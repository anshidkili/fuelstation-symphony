
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

// Employee hooks
export function useEmployees(stationId: string | null) {
  return useSupabaseFetch<any[]>(async () => {
    const query = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'Employee')
      .order('full_name');
    
    if (stationId) {
      query.eq('station_id', stationId);
    }
    
    return await query;
  }, [stationId]);
}

// Dispenser hooks
export function useDispensers(stationId: string | null) {
  return useSupabaseFetch<any[]>(async () => {
    if (!stationId) {
      return { data: [], error: null, count: null, status: 200, statusText: 'OK' };
    }
    
    return await supabase
      .from('dispensers')
      .select('*')
      .eq('station_id', stationId)
      .order('name');
  }, [stationId]);
}

// Fuel inventory hooks
export function useFuelInventory(stationId: string | null) {
  return useSupabaseFetch<any[]>(async () => {
    if (!stationId) {
      return { data: [], error: null, count: null, status: 200, statusText: 'OK' };
    }
    
    return await supabase
      .from('fuel_inventory')
      .select('*')
      .eq('station_id', stationId)
      .order('fuel_type');
  }, [stationId]);
}

// Product inventory hooks
export function useProducts(stationId: string | null) {
  return useSupabaseFetch<any[]>(async () => {
    if (!stationId) {
      return { data: [], error: null, count: null, status: 200, statusText: 'OK' };
    }
    
    return await supabase
      .from('products')
      .select('*')
      .eq('station_id', stationId)
      .order('name');
  }, [stationId]);
}

// Shift hooks
export function useShifts(stationId: string | null, employeeId: string | null = null) {
  return useSupabaseFetch<any[]>(async () => {
    if (!stationId && !employeeId) {
      return { data: [], error: null, count: null, status: 200, statusText: 'OK' };
    }
    
    let query = supabase
      .from('shifts')
      .select('*, profiles(*), meter_readings(*)')
      .order('start_time', { ascending: false });
    
    if (stationId) {
      query = query.eq('station_id', stationId);
    }
    
    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }
    
    return await query;
  }, [stationId, employeeId]);
}

// Transaction hooks
export function useTransactions(stationId: string | null, shiftId: string | null = null) {
  return useSupabaseFetch<any[]>(async () => {
    if (!stationId && !shiftId) {
      return { data: [], error: null, count: null, status: 200, statusText: 'OK' };
    }
    
    let query = supabase
      .from('transactions')
      .select('*, transaction_items(*)')
      .order('created_at', { ascending: false });
    
    if (stationId) {
      query = query.eq('station_id', stationId);
    }
    
    if (shiftId) {
      query = query.eq('shift_id', shiftId);
    }
    
    return await query;
  }, [stationId, shiftId]);
}

// Dashboard/reporting hooks - Using standard queries instead of RPC calls for now
export function useSalesReport(stationId: string | null, period: 'daily' | 'monthly' | 'yearly' = 'daily') {
  return useSupabaseFetch<any[]>(async () => {
    // Using transactions table directly for now until RPC functions are created
    let query = supabase.from('transactions').select('*');
    
    if (stationId) {
      query = query.eq('station_id', stationId);
    }
    
    return await query;
  }, [stationId, period]);
}

export function useFuelSalesBreakdown(stationId: string | null, period: 'daily' | 'monthly' | 'yearly' = 'daily') {
  return useSupabaseFetch<any[]>(async () => {
    // Using transaction_items table filtered to fuel types
    let query = supabase
      .from('transaction_items')
      .select('*, transactions(*)')
      .eq('item_type', 'fuel');
    
    if (stationId) {
      query = query.eq('transactions.station_id', stationId);
    }
    
    return await query;
  }, [stationId, period]);
}

export function useProductSalesBreakdown(stationId: string | null, period: 'daily' | 'monthly' | 'yearly' = 'daily') {
  return useSupabaseFetch<any[]>(async () => {
    // Using transaction_items table filtered to product types
    let query = supabase
      .from('transaction_items')
      .select('*, transactions(*)')
      .eq('item_type', 'product');
    
    if (stationId) {
      query = query.eq('transactions.station_id', stationId);
    }
    
    return await query;
  }, [stationId, period]);
}

export function useStationComparison(period: 'daily' | 'monthly' | 'yearly' = 'monthly') {
  return useSupabaseFetch<any[]>(async () => {
    // For now, just getting all stations with their transactions
    return await supabase
      .from('stations')
      .select('*, transactions(*)');
  }, [period]);
}

export function useFinancialSummary(stationId: string | null, period: 'daily' | 'monthly' | 'yearly' = 'monthly') {
  return useSupabaseFetch<any>(async () => {
    // For now just using basic transaction data
    let query = supabase
      .from('transactions')
      .select('*');
    
    if (stationId) {
      query = query.eq('station_id', stationId);
    }
    
    return await query;
  }, [stationId, period]);
}
