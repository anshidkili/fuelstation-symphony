
import { supabase, handleSupabaseError } from '@/lib/supabase';
import { UserRole } from '@/lib/constants';

// Auth services
export const authService = {
  getCurrentUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) return handleSupabaseError(error);
    return { data: data.user };
  },

  signUp: async (email: string, password: string, userData: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: userData.name,
          role: userData.role,
          station_id: userData.station_id
        }
      }
    });
    
    if (error) return handleSupabaseError(error);
    
    // Create profile record
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: data.user.id,
          full_name: userData.name,
          role: userData.role,
          station_id: userData.station_id,
          status: userData.role === UserRole.SUPER_ADMIN ? 'active' : 'pending'
        });
      
      if (profileError) return handleSupabaseError(profileError);
    }
    
    return { data };
  }
};

// Station services
export const stationService = {
  getAllStations: async () => {
    const { data, error } = await supabase
      .from('stations')
      .select('*')
      .order('name');
    
    if (error) return handleSupabaseError(error);
    return { data };
  },
  
  getStationById: async (stationId: string) => {
    const { data, error } = await supabase
      .from('stations')
      .select('*')
      .eq('id', stationId)
      .single();
    
    if (error) return handleSupabaseError(error);
    return { data };
  },
  
  createStation: async (stationData: any) => {
    const { data, error } = await supabase
      .from('stations')
      .insert(stationData)
      .select()
      .single();
    
    if (error) return handleSupabaseError(error);
    
    // Create activity log
    await activityLogService.createLog({
      action: 'create',
      entity_type: 'station',
      entity_id: data.id,
      details: { name: data.name }
    });
    
    return { data };
  },
  
  updateStation: async (stationId: string, stationData: any) => {
    const { data, error } = await supabase
      .from('stations')
      .update(stationData)
      .eq('id', stationId)
      .select()
      .single();
    
    if (error) return handleSupabaseError(error);
    
    // Create activity log
    await activityLogService.createLog({
      action: 'update',
      entity_type: 'station',
      entity_id: stationId,
      details: { name: data.name, status: data.status }
    });
    
    return { data };
  },
  
  deleteStation: async (stationId: string) => {
    const { error } = await supabase
      .from('stations')
      .delete()
      .eq('id', stationId);
    
    if (error) return handleSupabaseError(error);
    
    // Create activity log
    await activityLogService.createLog({
      action: 'delete',
      entity_type: 'station',
      entity_id: stationId,
      details: {}
    });
    
    return { success: true };
  }
};

// User/Profile services
export const userService = {
  getAllAdmins: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, stations:station_id(name)')
      .eq('role', UserRole.ADMIN);
    
    if (error) return handleSupabaseError(error);
    return { data };
  },
  
  getEmployeesByStation: async (stationId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('station_id', stationId)
      .eq('role', UserRole.EMPLOYEE);
    
    if (error) return handleSupabaseError(error);
    return { data };
  },
  
  getCustomersByStation: async (stationId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('station_id', stationId)
      .eq('role', UserRole.CREDIT_CUSTOMER);
    
    if (error) return handleSupabaseError(error);
    return { data };
  },
  
  updateUserStatus: async (userId: string, status: 'active' | 'inactive' | 'pending') => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) return handleSupabaseError(error);
    
    // Create activity log
    await activityLogService.createLog({
      action: 'update_status',
      entity_type: 'user',
      entity_id: userId,
      details: { status }
    });
    
    return { data };
  }
};

// Dispenser services
export const dispenserService = {
  getDispensersByStation: async (stationId: string) => {
    const { data, error } = await supabase
      .from('dispensers')
      .select('*')
      .eq('station_id', stationId);
    
    if (error) return handleSupabaseError(error);
    return { data };
  },
  
  createDispenser: async (dispenserData: any) => {
    const { data, error } = await supabase
      .from('dispensers')
      .insert(dispenserData)
      .select()
      .single();
    
    if (error) return handleSupabaseError(error);
    return { data };
  },
  
  updateDispenser: async (dispenserId: string, dispenserData: any) => {
    const { data, error } = await supabase
      .from('dispensers')
      .update(dispenserData)
      .eq('id', dispenserId)
      .select()
      .single();
    
    if (error) return handleSupabaseError(error);
    return { data };
  }
};

// Inventory services
export const inventoryService = {
  getFuelInventoryByStation: async (stationId: string) => {
    const { data, error } = await supabase
      .from('fuel_inventory')
      .select('*')
      .eq('station_id', stationId);
    
    if (error) return handleSupabaseError(error);
    return { data };
  },
  
  getProductsByStation: async (stationId: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('station_id', stationId);
    
    if (error) return handleSupabaseError(error);
    return { data };
  },
  
  updateFuelInventory: async (inventoryId: string, updates: any) => {
    const { data, error } = await supabase
      .from('fuel_inventory')
      .update(updates)
      .eq('id', inventoryId)
      .select()
      .single();
    
    if (error) return handleSupabaseError(error);
    return { data };
  },
  
  updateProductInventory: async (productId: string, updates: any) => {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single();
    
    if (error) return handleSupabaseError(error);
    return { data };
  }
};

// Shift services
export const shiftService = {
  getActiveShiftsByStation: async (stationId: string) => {
    const { data, error } = await supabase
      .from('shifts')
      .select('*, employees:employee_id(full_name)')
      .eq('station_id', stationId)
      .eq('status', 'active');
    
    if (error) return handleSupabaseError(error);
    return { data };
  },
  
  getShiftsByEmployee: async (employeeId: string) => {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('employee_id', employeeId)
      .order('start_time', { ascending: false });
    
    if (error) return handleSupabaseError(error);
    return { data };
  },
  
  startShift: async (shiftData: any) => {
    const { data, error } = await supabase
      .from('shifts')
      .insert(shiftData)
      .select()
      .single();
    
    if (error) return handleSupabaseError(error);
    return { data };
  },
  
  endShift: async (shiftId: string, endData: any) => {
    const { data, error } = await supabase
      .from('shifts')
      .update({
        end_time: endData.end_time,
        ending_cash: endData.ending_cash,
        status: 'completed',
        notes: endData.notes
      })
      .eq('id', shiftId)
      .select()
      .single();
    
    if (error) return handleSupabaseError(error);
    return { data };
  },
  
  recordMeterReadings: async (readings: any[]) => {
    const { data, error } = await supabase
      .from('meter_readings')
      .insert(readings)
      .select();
    
    if (error) return handleSupabaseError(error);
    return { data };
  },
  
  updateMeterReadings: async (shiftId: string, readings: any[]) => {
    // Update each meter reading one by one
    const results = await Promise.all(
      readings.map(async (reading) => {
        const { data, error } = await supabase
          .from('meter_readings')
          .update({ end_reading: reading.end_reading })
          .eq('id', reading.id)
          .select()
          .single();
        
        if (error) return { error };
        return { data };
      })
    );
    
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      return handleSupabaseError(errors[0].error);
    }
    
    return { data: results.map(result => result.data) };
  }
};

// Transaction services
export const transactionService = {
  createTransaction: async (transactionData: any, items: any[]) => {
    // Start a transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();
    
    if (transactionError) return handleSupabaseError(transactionError);
    
    // Add transaction items
    const itemsWithTransactionId = items.map(item => ({
      ...item,
      transaction_id: transaction.id
    }));
    
    const { error: itemsError } = await supabase
      .from('transaction_items')
      .insert(itemsWithTransactionId);
    
    if (itemsError) return handleSupabaseError(itemsError);
    
    // Update inventory based on transaction items
    for (const item of items) {
      if (item.item_type === 'fuel') {
        // Update fuel inventory
        const { error } = await supabase.rpc('update_fuel_inventory', {
          p_fuel_id: item.item_id,
          p_quantity: item.quantity
        });
        
        if (error) console.error('Error updating fuel inventory:', error);
      } else if (item.item_type === 'product') {
        // Update product inventory
        const { error } = await supabase.rpc('update_product_inventory', {
          p_product_id: item.item_id,
          p_quantity: item.quantity
        });
        
        if (error) console.error('Error updating product inventory:', error);
      }
    }
    
    return { data: transaction };
  },
  
  getTransactionsByStation: async (stationId: string, startDate: string, endDate: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, transaction_items(*)')
      .eq('station_id', stationId)
      .gte('created_at', startDate)
      .lte('created_at', endDate);
    
    if (error) return handleSupabaseError(error);
    return { data };
  },
  
  getTransactionsByCustomer: async (customerId: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, transaction_items(*)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    
    if (error) return handleSupabaseError(error);
    return { data };
  }
};

// Invoice services
export const invoiceService = {
  createInvoice: async (invoiceData: any, items: any[]) => {
    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single();
    
    if (invoiceError) return handleSupabaseError(invoiceError);
    
    // Add invoice items
    const itemsWithInvoiceId = items.map(item => ({
      ...item,
      invoice_id: invoice.id
    }));
    
    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsWithInvoiceId);
    
    if (itemsError) return handleSupabaseError(itemsError);
    
    return { data: invoice };
  },
  
  getInvoicesByCustomer: async (customerId: string) => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, invoice_items(*), stations:station_id(name)')
      .eq('customer_id', customerId)
      .order('issue_date', { ascending: false });
    
    if (error) return handleSupabaseError(error);
    return { data };
  },
  
  getInvoicesByStation: async (stationId: string, startDate: string, endDate: string) => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, invoice_items(*), profiles:customer_id(full_name)')
      .eq('station_id', stationId)
      .gte('issue_date', startDate)
      .lte('issue_date', endDate);
    
    if (error) return handleSupabaseError(error);
    return { data };
  },
  
  updateInvoiceStatus: async (invoiceId: string, status: string) => {
    const { data, error } = await supabase
      .from('invoices')
      .update({ status })
      .eq('id', invoiceId)
      .select()
      .single();
    
    if (error) return handleSupabaseError(error);
    return { data };
  }
};

// Vehicle services
export const vehicleService = {
  getVehiclesByCustomer: async (customerId: string) => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('customer_id', customerId);
    
    if (error) return handleSupabaseError(error);
    return { data };
  },
  
  createVehicle: async (vehicleData: any) => {
    const { data, error } = await supabase
      .from('vehicles')
      .insert(vehicleData)
      .select()
      .single();
    
    if (error) return handleSupabaseError(error);
    return { data };
  },
  
  updateVehicle: async (vehicleId: string, vehicleData: any) => {
    const { data, error } = await supabase
      .from('vehicles')
      .update(vehicleData)
      .eq('id', vehicleId)
      .select()
      .single();
    
    if (error) return handleSupabaseError(error);
    return { data };
  },
  
  deleteVehicle: async (vehicleId: string) => {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', vehicleId);
    
    if (error) return handleSupabaseError(error);
    return { success: true };
  }
};

// Expense services
export const expenseService = {
  createExpense: async (expenseData: any) => {
    const { data, error } = await supabase
      .from('expenses')
      .insert(expenseData)
      .select()
      .single();
    
    if (error) return handleSupabaseError(error);
    return { data };
  },
  
  getExpensesByStation: async (stationId: string, startDate: string, endDate: string) => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('station_id', stationId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });
    
    if (error) return handleSupabaseError(error);
    return { data };
  }
};

// Activity Log services
export const activityLogService = {
  createLog: async (logData: any) => {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { error: 'No authenticated user found' };
    }
    
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        ...logData,
        user_id: user.id
      });
    
    if (error) return handleSupabaseError(error);
    return { success: true };
  },
  
  getLogs: async (filters: any = {}) => {
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
    
    if (error) return handleSupabaseError(error);
    return { data };
  }
};

// Report services
export const reportService = {
  getSalesReport: async (stationId: string, startDate: string, endDate: string, groupBy: 'day' | 'month' | 'year') => {
    const { data, error } = await supabase.rpc('get_sales_report', {
      p_station_id: stationId, 
      p_start_date: startDate, 
      p_end_date: endDate, 
      p_group_by: groupBy
    });
    
    if (error) return handleSupabaseError(error);
    return { data };
  },
  
  getFuelSalesBreakdown: async (stationId: string, startDate: string, endDate: string) => {
    const { data, error } = await supabase.rpc('get_fuel_sales_breakdown', {
      p_station_id: stationId, 
      p_start_date: startDate, 
      p_end_date: endDate
    });
    
    if (error) return handleSupabaseError(error);
    return { data };
  },
  
  getProductSalesBreakdown: async (stationId: string, startDate: string, endDate: string) => {
    const { data, error } = await supabase.rpc('get_product_sales_breakdown', {
      p_station_id: stationId, 
      p_start_date: startDate, 
      p_end_date: endDate
    });
    
    if (error) return handleSupabaseError(error);
    return { data };
  },
  
  getStationComparison: async (startDate: string, endDate: string) => {
    const { data, error } = await supabase.rpc('get_station_comparison', {
      p_start_date: startDate, 
      p_end_date: endDate
    });
    
    if (error) return handleSupabaseError(error);
    return { data };
  },
  
  getFinancialSummary: async (stationId: string, startDate: string, endDate: string) => {
    const { data, error } = await supabase.rpc('get_financial_summary', {
      p_station_id: stationId, 
      p_start_date: startDate, 
      p_end_date: endDate
    });
    
    if (error) return handleSupabaseError(error);
    return { data };
  }
};
