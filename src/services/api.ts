
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/lib/constants';
import { toast } from 'sonner';

// Authentication service
export const authService = {
  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { data: null, error: error.message };
    }
  },

  signUp: async (email: string, password: string, userData: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.fullName,
            role: userData.role,
          }
        }
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { data: null, error: error.message };
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('Sign out error:', error);
      return { error: error.message };
    }
  },

  getCurrentSession: async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Get session error:', error);
      return { data: null, error: error.message };
    }
  }
};

// Station service
export const stationService = {
  getAllStations: async () => {
    try {
      const { data, error } = await supabase
        .from('stations')
        .select('*')
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Get stations error:', error);
      return { data: null, error: error.message };
    }
  },

  getStationById: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('stations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Get station error:', error);
      return { data: null, error: error.message };
    }
  },

  createStation: async (stationData: any) => {
    try {
      const { data, error } = await supabase
        .from('stations')
        .insert(stationData)
        .select()
        .single();

      if (error) throw error;
      toast.success('Station created successfully');
      return { data, error: null };
    } catch (error: any) {
      console.error('Create station error:', error);
      toast.error('Failed to create station');
      return { data: null, error: error.message };
    }
  },

  updateStation: async (id: string, stationData: any) => {
    try {
      const { data, error } = await supabase
        .from('stations')
        .update(stationData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast.success('Station updated successfully');
      return { data, error: null };
    } catch (error: any) {
      console.error('Update station error:', error);
      toast.error('Failed to update station');
      return { data: null, error: error.message };
    }
  },

  deleteStation: async (id: string) => {
    try {
      const { error } = await supabase
        .from('stations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Station deleted successfully');
      return { error: null };
    } catch (error: any) {
      console.error('Delete station error:', error);
      toast.error('Failed to delete station');
      return { error: error.message };
    }
  }
};

// User management service
export const userService = {
  getAllUsers: async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, stations:station_id(name)')
        .order('full_name');

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Get users error:', error);
      return { data: null, error: error.message };
    }
  },

  getUsersByRole: async (role: UserRole) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, stations:station_id(name)')
        .eq('role', role)
        .order('full_name');

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Get users by role error:', error);
      return { data: null, error: error.message };
    }
  },

  getUsersByStation: async (stationId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('station_id', stationId)
        .order('full_name');

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Get users by station error:', error);
      return { data: null, error: error.message };
    }
  },

  updateUserStatus: async (userId: string, status: 'active' | 'inactive' | 'pending') => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      toast.success(`User status updated successfully`);
      return { data, error: null };
    } catch (error: any) {
      console.error('Update user status error:', error);
      toast.error('Failed to update user status');
      return { data: null, error: error.message };
    }
  },

  updateUserProfile: async (userId: string, profileData: any) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      toast.success('Profile updated successfully');
      return { data, error: null };
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast.error('Failed to update profile');
      return { data: null, error: error.message };
    }
  }
};

// Inventory service
export const inventoryService = {
  getFuelInventory: async (stationId: string) => {
    try {
      const { data, error } = await supabase
        .from('fuel_inventory')
        .select('*')
        .eq('station_id', stationId);

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Get fuel inventory error:', error);
      return { data: null, error: error.message };
    }
  },

  getProducts: async (stationId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('station_id', stationId);

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Get products error:', error);
      return { data: null, error: error.message };
    }
  },

  updateFuelInventory: async (id: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('fuel_inventory')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast.success('Fuel inventory updated successfully');
      return { data, error: null };
    } catch (error: any) {
      console.error('Update fuel inventory error:', error);
      toast.error('Failed to update fuel inventory');
      return { data: null, error: error.message };
    }
  },

  updateProduct: async (id: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast.success('Product updated successfully');
      return { data, error: null };
    } catch (error: any) {
      console.error('Update product error:', error);
      toast.error('Failed to update product');
      return { data: null, error: error.message };
    }
  }
};

// Shift management service
export const shiftService = {
  getShifts: async (filters: any = {}) => {
    try {
      let query = supabase
        .from('shifts')
        .select('*, employees:employee_id(full_name)');
      
      if (filters.stationId) {
        query = query.eq('station_id', filters.stationId);
      }
      
      if (filters.employeeId) {
        query = query.eq('employee_id', filters.employeeId);
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Get shifts error:', error);
      return { data: null, error: error.message };
    }
  },

  startShift: async (shiftData: any) => {
    try {
      const { data, error } = await supabase
        .from('shifts')
        .insert(shiftData)
        .select()
        .single();

      if (error) throw error;
      toast.success('Shift started successfully');
      return { data, error: null };
    } catch (error: any) {
      console.error('Start shift error:', error);
      toast.error('Failed to start shift');
      return { data: null, error: error.message };
    }
  },

  endShift: async (id: string, endData: any) => {
    try {
      const { data, error } = await supabase
        .from('shifts')
        .update({
          end_time: endData.end_time,
          ending_cash: endData.ending_cash,
          status: 'completed',
          notes: endData.notes
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast.success('Shift ended successfully');
      return { data, error: null };
    } catch (error: any) {
      console.error('End shift error:', error);
      toast.error('Failed to end shift');
      return { data: null, error: error.message };
    }
  }
};

// Transaction service
export const transactionService = {
  createTransaction: async (transactionData: any, items: any[]) => {
    try {
      // Insert transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select()
        .single();
      
      if (transactionError) throw transactionError;
      
      // Insert transaction items
      const transactionItems = items.map(item => ({
        ...item,
        transaction_id: transaction.id
      }));
      
      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(transactionItems);
      
      if (itemsError) throw itemsError;
      
      toast.success('Transaction created successfully');
      return { data: transaction, error: null };
    } catch (error: any) {
      console.error('Create transaction error:', error);
      toast.error('Failed to create transaction');
      return { data: null, error: error.message };
    }
  },

  getTransactions: async (filters: any = {}) => {
    try {
      let query = supabase
        .from('transactions')
        .select('*, transaction_items(*)');
      
      if (filters.stationId) {
        query = query.eq('station_id', filters.stationId);
      }
      
      if (filters.customerId) {
        query = query.eq('customer_id', filters.customerId);
      }
      
      if (filters.startDate && filters.endDate) {
        query = query
          .gte('created_at', filters.startDate)
          .lte('created_at', filters.endDate);
      }
      
      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Get transactions error:', error);
      return { data: null, error: error.message };
    }
  }
};

// Invoice service
export const invoiceService = {
  createInvoice: async (invoiceData: any, items: any[]) => {
    try {
      // Insert invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single();
      
      if (invoiceError) throw invoiceError;
      
      // Insert invoice items
      const invoiceItems = items.map(item => ({
        ...item,
        invoice_id: invoice.id
      }));
      
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);
      
      if (itemsError) throw itemsError;
      
      toast.success('Invoice created successfully');
      return { data: invoice, error: null };
    } catch (error: any) {
      console.error('Create invoice error:', error);
      toast.error('Failed to create invoice');
      return { data: null, error: error.message };
    }
  },

  getInvoices: async (filters: any = {}) => {
    try {
      let query = supabase
        .from('invoices')
        .select('*, invoice_items(*), profiles:customer_id(full_name), stations:station_id(name)');
      
      if (filters.stationId) {
        query = query.eq('station_id', filters.stationId);
      }
      
      if (filters.customerId) {
        query = query.eq('customer_id', filters.customerId);
      }
      
      if (filters.startDate && filters.endDate) {
        query = query
          .gte('issue_date', filters.startDate)
          .lte('issue_date', filters.endDate);
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Get invoices error:', error);
      return { data: null, error: error.message };
    }
  },

  updateInvoiceStatus: async (id: string, status: string) => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast.success('Invoice status updated successfully');
      return { data, error: null };
    } catch (error: any) {
      console.error('Update invoice status error:', error);
      toast.error('Failed to update invoice status');
      return { data: null, error: error.message };
    }
  }
};

// Vehicle service for credit customers
export const vehicleService = {
  getVehicles: async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('customer_id', customerId);

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Get vehicles error:', error);
      return { data: null, error: error.message };
    }
  },

  createVehicle: async (vehicleData: any) => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .insert(vehicleData)
        .select()
        .single();

      if (error) throw error;
      toast.success('Vehicle added successfully');
      return { data, error: null };
    } catch (error: any) {
      console.error('Create vehicle error:', error);
      toast.error('Failed to add vehicle');
      return { data: null, error: error.message };
    }
  },

  updateVehicle: async (id: string, vehicleData: any) => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .update(vehicleData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast.success('Vehicle updated successfully');
      return { data, error: null };
    } catch (error: any) {
      console.error('Update vehicle error:', error);
      toast.error('Failed to update vehicle');
      return { data: null, error: error.message };
    }
  },

  deleteVehicle: async (id: string) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Vehicle deleted successfully');
      return { error: null };
    } catch (error: any) {
      console.error('Delete vehicle error:', error);
      toast.error('Failed to delete vehicle');
      return { error: error.message };
    }
  }
};

// Activity logging service
export const logService = {
  createLog: async (logData: any) => {
    try {
      const { error } = await supabase
        .from('activity_logs')
        .insert({
          ...logData,
          user_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('Create log error:', error);
      return { error: error.message };
    }
  },

  getLogs: async (filters: any = {}) => {
    try {
      let query = supabase
        .from('activity_logs')
        .select('*, profiles:user_id(full_name, role)')
        .order('created_at', { ascending: false });
      
      if (filters.entityType) {
        query = query.eq('entity_type', filters.entityType);
      }
      
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      
      if (filters.startDate && filters.endDate) {
        query = query
          .gte('created_at', filters.startDate)
          .lte('created_at', filters.endDate);
      }
      
      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Get logs error:', error);
      return { data: null, error: error.message };
    }
  }
};

// Report service
export const reportService = {
  getSalesReport: async (stationId: string, startDate: string, endDate: string, groupBy: string = 'day') => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('station_id', stationId)
        .eq('status', 'completed')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error) throw error;
      
      // Process data to group by date according to groupBy parameter
      // This is a simplified version, in production you might want to use a database function
      const groupedData = data.reduce((acc: any, transaction: any) => {
        const date = new Date(transaction.created_at);
        let key;
        
        if (groupBy === 'day') {
          key = date.toISOString().split('T')[0]; // YYYY-MM-DD
        } else if (groupBy === 'month') {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
        } else if (groupBy === 'year') {
          key = `${date.getFullYear()}`; // YYYY
        }
        
        if (!acc[key]) {
          acc[key] = {
            period: key,
            total_amount: 0,
            count: 0
          };
        }
        
        acc[key].total_amount += parseFloat(transaction.total_amount);
        acc[key].count += 1;
        
        return acc;
      }, {});
      
      return { 
        data: Object.values(groupedData).sort((a: any, b: any) => a.period.localeCompare(b.period)),
        error: null
      };
    } catch (error: any) {
      console.error('Get sales report error:', error);
      return { data: null, error: error.message };
    }
  },

  getStationComparison: async (startDate: string, endDate: string) => {
    try {
      const { data: stations, error: stationsError } = await supabase
        .from('stations')
        .select('id, name');
      
      if (stationsError) throw stationsError;
      
      const stationData = await Promise.all(
        stations.map(async (station: any) => {
          const { data: transactions, error: transactionsError } = await supabase
            .from('transactions')
            .select('*')
            .eq('station_id', station.id)
            .eq('status', 'completed')
            .gte('created_at', startDate)
            .lte('created_at', endDate);
          
          if (transactionsError) throw transactionsError;
          
          const { data: expenses, error: expensesError } = await supabase
            .from('expenses')
            .select('*')
            .eq('station_id', station.id)
            .gte('date', startDate)
            .lte('date', endDate);
          
          if (expensesError) throw expensesError;
          
          const totalSales = transactions.reduce((sum: number, t: any) => sum + parseFloat(t.total_amount), 0);
          const totalExpenses = expenses.reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0);
          
          return {
            station_id: station.id,
            station_name: station.name,
            total_sales: totalSales,
            transaction_count: transactions.length,
            expenses: totalExpenses,
            profit: totalSales - totalExpenses
          };
        })
      );
      
      return { data: stationData, error: null };
    } catch (error: any) {
      console.error('Get station comparison error:', error);
      return { data: null, error: error.message };
    }
  }
};

// Dispenser service
export const dispenserService = {
  getDispensers: async (stationId: string) => {
    try {
      const { data, error } = await supabase
        .from('dispensers')
        .select('*')
        .eq('station_id', stationId);

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Get dispensers error:', error);
      return { data: null, error: error.message };
    }
  },

  createDispenser: async (dispenserData: any) => {
    try {
      const { data, error } = await supabase
        .from('dispensers')
        .insert(dispenserData)
        .select()
        .single();

      if (error) throw error;
      toast.success('Dispenser added successfully');
      return { data, error: null };
    } catch (error: any) {
      console.error('Create dispenser error:', error);
      toast.error('Failed to add dispenser');
      return { data: null, error: error.message };
    }
  },

  updateDispenser: async (id: string, dispenserData: any) => {
    try {
      const { data, error } = await supabase
        .from('dispensers')
        .update(dispenserData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast.success('Dispenser updated successfully');
      return { data, error: null };
    } catch (error: any) {
      console.error('Update dispenser error:', error);
      toast.error('Failed to update dispenser');
      return { data: null, error: error.message };
    }
  },

  deleteDispenser: async (id: string) => {
    try {
      const { error } = await supabase
        .from('dispensers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Dispenser deleted successfully');
      return { error: null };
    } catch (error: any) {
      console.error('Delete dispenser error:', error);
      toast.error('Failed to delete dispenser');
      return { error: error.message };
    }
  }
};
