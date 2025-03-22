
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

// Generic hook for fetching data from Supabase
export function useSupabaseFetch<T>(
  fetchFn: () => Promise<{ data?: T; error?: any }>,
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
        const response = await fetchFn();
        
        if (response.error) {
          throw new Error(response.error);
        }

        if (isMounted && response.data) {
          setData(response.data);
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
  return useSupabaseFetch(async () => {
    const { data, error } = await supabase
      .from('stations')
      .select('*')
      .order('name');
    
    if (error) return { error: error.message };
    return { data };
  }, []);
}

export function useStation(stationId: string | null) {
  return useSupabaseFetch(async () => {
    if (!stationId) return { data: null };
    
    const { data, error } = await supabase
      .from('stations')
      .select('*')
      .eq('id', stationId)
      .single();
    
    if (error) return { error: error.message };
    return { data };
  }, [stationId]);
}

// User/Profile hooks
export function useAdmins() {
  return useSupabaseFetch(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, stations:station_id(name)')
      .eq('role', 'admin');
    
    if (error) return { error: error.message };
    return { data };
  }, []);
}

export function useEmployees(stationId: string | null) {
  return useSupabaseFetch(async () => {
    if (!stationId) return { data: [] };
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('station_id', stationId)
      .eq('role', 'employee');
    
    if (error) return { error: error.message };
    return { data };
  }, [stationId]);
}

export function useCustomers(stationId: string | null) {
  return useSupabaseFetch(async () => {
    if (!stationId) return { data: [] };
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('station_id', stationId)
      .eq('role', 'credit_customer');
    
    if (error) return { error: error.message };
    return { data };
  }, [stationId]);
}

// Dispenser hooks
export function useDispensers(stationId: string | null) {
  return useSupabaseFetch(async () => {
    if (!stationId) return { data: [] };
    
    const { data, error } = await supabase
      .from('dispensers')
      .select('*')
      .eq('station_id', stationId);
    
    if (error) return { error: error.message };
    return { data };
  }, [stationId]);
}

// Inventory hooks
export function useFuelInventory(stationId: string | null) {
  return useSupabaseFetch(async () => {
    if (!stationId) return { data: [] };
    
    const { data, error } = await supabase
      .from('fuel_inventory')
      .select('*')
      .eq('station_id', stationId);
    
    if (error) return { error: error.message };
    return { data };
  }, [stationId]);
}

export function useProducts(stationId: string | null) {
  return useSupabaseFetch(async () => {
    if (!stationId) return { data: [] };
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('station_id', stationId);
    
    if (error) return { error: error.message };
    return { data };
  }, [stationId]);
}

// Shift hooks
export function useActiveShifts(stationId: string | null) {
  return useSupabaseFetch(async () => {
    if (!stationId) return { data: [] };
    
    const { data, error } = await supabase
      .from('shifts')
      .select('*, employees:employee_id(full_name)')
      .eq('station_id', stationId)
      .eq('status', 'active');
    
    if (error) return { error: error.message };
    return { data };
  }, [stationId]);
}

// Transaction hooks
export function useTransactions(stationId: string | null, startDate: string, endDate: string) {
  return useSupabaseFetch(async () => {
    if (!stationId) return { data: [] };
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*, transaction_items(*)')
      .eq('station_id', stationId)
      .gte('created_at', startDate)
      .lte('created_at', endDate);
    
    if (error) return { error: error.message };
    return { data };
  }, [stationId, startDate, endDate]);
}

// Invoice hooks
export function useInvoices(stationId: string | null, startDate: string, endDate: string) {
  return useSupabaseFetch(async () => {
    if (!stationId) return { data: [] };
    
    const { data, error } = await supabase
      .from('invoices')
      .select('*, invoice_items(*), profiles:customer_id(full_name)')
      .eq('station_id', stationId)
      .gte('issue_date', startDate)
      .lte('issue_date', endDate);
    
    if (error) return { error: error.message };
    return { data };
  }, [stationId, startDate, endDate]);
}

// Customer-specific hooks
export function useCustomerInvoices(customerId: string | null) {
  return useSupabaseFetch(async () => {
    if (!customerId) return { data: [] };
    
    const { data, error } = await supabase
      .from('invoices')
      .select('*, invoice_items(*), stations:station_id(name)')
      .eq('customer_id', customerId)
      .order('issue_date', { ascending: false });
    
    if (error) return { error: error.message };
    return { data };
  }, [customerId]);
}

export function useCustomerVehicles(customerId: string | null) {
  return useSupabaseFetch(async () => {
    if (!customerId) return { data: [] };
    
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('customer_id', customerId);
    
    if (error) return { error: error.message };
    return { data };
  }, [customerId]);
}

// Activity log hooks
export function useActivityLogs(filters: any = {}) {
  return useSupabaseFetch(async () => {
    let query = supabase
      .from('activity_logs')
      .select('*, profiles:user_id(full_name, role)')
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (filters.entity_type) {
      query = query.eq('entity_type', filters.entity_type);
    }
    
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    
    if (filters.start_date && filters.end_date) {
      query = query
        .gte('created_at', filters.start_date)
        .lte('created_at', filters.end_date);
    }
    
    const { data, error } = await query;
    
    if (error) return { error: error.message };
    return { data };
  }, [filters]);
}

// Report hooks
export function useSalesReport(stationId: string | null, startDate: string, endDate: string, groupBy: 'day' | 'month' | 'year') {
  return useSupabaseFetch(async () => {
    if (!stationId) return { data: [] };
    
    const { data, error } = await supabase.rpc('get_sales_report', {
      p_station_id: stationId, 
      p_start_date: startDate, 
      p_end_date: endDate, 
      p_group_by: groupBy
    });
    
    if (error) return { error: error.message };
    return { data };
  }, [stationId, startDate, endDate, groupBy]);
}
