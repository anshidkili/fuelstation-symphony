
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

const handleError = (error: any, message = 'An error occurred') => {
  console.error(error);
  toast.error(message);
  return { error: message, details: error };
};

// Station APIs
export const getStations = async () => {
  try {
    const { data, error } = await supabase
      .from('stations')
      .select('*')
      .order('name');

    if (error) throw error;
    return { data };
  } catch (error) {
    return handleError(error, 'Failed to fetch stations');
  }
};

export const getStationById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('stations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data };
  } catch (error) {
    return handleError(error, 'Failed to fetch station details');
  }
};

// Admin APIs
export const getAdmins = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, stations:station_id(*)')
      .eq('role', 'Admin');

    if (error) throw error;
    return { data };
  } catch (error) {
    return handleError(error, 'Failed to fetch admins');
  }
};

export const createAdmin = async (adminData: any) => {
  try {
    // First create the user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminData.email,
      password: adminData.password,
      email_confirm: true,
      user_metadata: {
        full_name: adminData.full_name,
        role: 'Admin'
      }
    });

    if (authError) throw authError;

    // Then create the profile
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        full_name: adminData.full_name,
        role: 'Admin',
        station_id: adminData.station_id,
        email: adminData.email,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (error) {
    return handleError(error, 'Failed to create admin');
  }
};

// Employee APIs
export const getEmployees = async (stationId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('station_id', stationId)
      .eq('role', 'Employee');

    if (error) throw error;
    return { data };
  } catch (error) {
    return handleError(error, 'Failed to fetch employees');
  }
};

export const createEmployee = async (employeeData: any) => {
  try {
    // First create the user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: employeeData.email,
      password: employeeData.password,
      email_confirm: true,
      user_metadata: {
        full_name: employeeData.full_name,
        role: 'Employee'
      }
    });

    if (authError) throw authError;

    // Then create the profile
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        full_name: employeeData.full_name,
        role: 'Employee',
        station_id: employeeData.station_id,
        email: employeeData.email,
        hourly_rate: employeeData.hourly_rate,
        contact_number: employeeData.contact_number,
        address: employeeData.address,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (error) {
    return handleError(error, 'Failed to create employee');
  }
};

// Customer APIs
export const getCustomers = async (stationId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('station_id', stationId)
      .eq('role', 'Credit Customer');

    if (error) throw error;
    return { data };
  } catch (error) {
    return handleError(error, 'Failed to fetch customers');
  }
};

export const createCustomer = async (customerData: any) => {
  try {
    // First create the user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: customerData.email,
      password: customerData.password,
      email_confirm: true,
      user_metadata: {
        full_name: customerData.full_name,
        role: 'Credit Customer'
      }
    });

    if (authError) throw authError;

    // Then create the profile
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        full_name: customerData.full_name,
        role: 'Credit Customer',
        station_id: customerData.station_id,
        email: customerData.email,
        contact_number: customerData.contact_number,
        address: customerData.address,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (error) {
    return handleError(error, 'Failed to create customer');
  }
};

// Dispenser APIs
export const getDispensers = async (stationId: string) => {
  try {
    const { data, error } = await supabase
      .from('dispensers')
      .select('*')
      .eq('station_id', stationId);

    if (error) throw error;
    return { data };
  } catch (error) {
    return handleError(error, 'Failed to fetch dispensers');
  }
};

export const createDispenser = async (dispenserData: any) => {
  try {
    const { data, error } = await supabase
      .from('dispensers')
      .insert({
        station_id: dispenserData.station_id,
        name: dispenserData.name,
        status: dispenserData.status,
        fuel_types: dispenserData.fuel_types
      })
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (error) {
    return handleError(error, 'Failed to create dispenser');
  }
};

export const updateDispenserStatus = async (id: string, status: 'active' | 'inactive' | 'maintenance') => {
  try {
    const { data, error } = await supabase
      .from('dispensers')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (error) {
    return handleError(error, 'Failed to update dispenser status');
  }
};

// Inventory APIs
export const getFuelInventory = async (stationId: string) => {
  try {
    const { data, error } = await supabase
      .from('fuel_inventory')
      .select('*')
      .eq('station_id', stationId);

    if (error) throw error;
    return { data };
  } catch (error) {
    return handleError(error, 'Failed to fetch fuel inventory');
  }
};

export const updateFuelInventory = async (id: string, inventoryData: any) => {
  try {
    const { data, error } = await supabase
      .from('fuel_inventory')
      .update(inventoryData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (error) {
    return handleError(error, 'Failed to update fuel inventory');
  }
};

export const getProducts = async (stationId: string) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('station_id', stationId);

    if (error) throw error;
    return { data };
  } catch (error) {
    return handleError(error, 'Failed to fetch products');
  }
};

export const createProduct = async (productData: any) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (error) {
    return handleError(error, 'Failed to create product');
  }
};

export const updateProduct = async (id: string, productData: any) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (error) {
    return handleError(error, 'Failed to update product');
  }
};

// Shift APIs
export const getShifts = async (stationId: string) => {
  try {
    const { data, error } = await supabase
      .from('shifts')
      .select('*, employees:employee_id(*)')
      .eq('station_id', stationId);

    if (error) throw error;
    return { data };
  } catch (error) {
    return handleError(error, 'Failed to fetch shifts');
  }
};

export const getActiveShifts = async (stationId: string) => {
  try {
    const { data, error } = await supabase
      .from('shifts')
      .select('*, employees:employee_id(*)')
      .eq('station_id', stationId)
      .eq('status', 'active');

    if (error) throw error;
    return { data };
  } catch (error) {
    return handleError(error, 'Failed to fetch active shifts');
  }
};

export const createShift = async (shiftData: any) => {
  try {
    const { data, error } = await supabase
      .from('shifts')
      .insert(shiftData)
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (error) {
    return handleError(error, 'Failed to create shift');
  }
};

export const endShift = async (id: string, shiftEndData: any) => {
  try {
    const { data, error } = await supabase
      .from('shifts')
      .update({
        end_time: shiftEndData.end_time,
        ending_cash: shiftEndData.ending_cash,
        status: 'completed',
        notes: shiftEndData.notes
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (error) {
    return handleError(error, 'Failed to end shift');
  }
};

// Transaction APIs
export const createTransaction = async (transactionData: any, items: any[]) => {
  try {
    // Start a transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    if (transactionError) throw transactionError;

    // Create transaction items
    const transactionItems = items.map(item => ({
      transaction_id: transaction.id,
      ...item
    }));

    const { error: itemsError } = await supabase
      .from('transaction_items')
      .insert(transactionItems);

    if (itemsError) throw itemsError;

    return { data: transaction };
  } catch (error) {
    return handleError(error, 'Failed to create transaction');
  }
};

export const getTransactions = async (stationId: string, startDate: string, endDate: string) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, transaction_items(*)')
      .eq('station_id', stationId)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error) throw error;
    return { data };
  } catch (error) {
    return handleError(error, 'Failed to fetch transactions');
  }
};

// Invoice APIs
export const createInvoice = async (invoiceData: any, items: any[]) => {
  try {
    // Start a transaction
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Create invoice items
    const invoiceItems = items.map(item => ({
      invoice_id: invoice.id,
      ...item
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems);

    if (itemsError) throw itemsError;

    return { data: invoice };
  } catch (error) {
    return handleError(error, 'Failed to create invoice');
  }
};

export const getInvoices = async (stationId: string, startDate: string, endDate: string) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, invoice_items(*), profiles:customer_id(*)')
      .eq('station_id', stationId)
      .gte('issue_date', startDate)
      .lte('issue_date', endDate);

    if (error) throw error;
    return { data };
  } catch (error) {
    return handleError(error, 'Failed to fetch invoices');
  }
};

export const updateInvoiceStatus = async (id: string, status: string) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (error) {
    return handleError(error, 'Failed to update invoice status');
  }
};

// Customer-specific APIs
export const getCustomerInvoices = async (customerId: string) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, invoice_items(*), stations:station_id(*)')
      .eq('customer_id', customerId)
      .order('issue_date', { ascending: false });

    if (error) throw error;
    return { data };
  } catch (error) {
    return handleError(error, 'Failed to fetch customer invoices');
  }
};

export const getCustomerVehicles = async (customerId: string) => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('customer_id', customerId);

    if (error) throw error;
    return { data };
  } catch (error) {
    return handleError(error, 'Failed to fetch customer vehicles');
  }
};

export const createVehicle = async (vehicleData: any) => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .insert(vehicleData)
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (error) {
    return handleError(error, 'Failed to create vehicle');
  }
};

// Expense APIs
export const getExpenses = async (stationId: string, startDate: string, endDate: string) => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('station_id', stationId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;
    return { data };
  } catch (error) {
    return handleError(error, 'Failed to fetch expenses');
  }
};

export const createExpense = async (expenseData: any) => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .insert(expenseData)
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (error) {
    return handleError(error, 'Failed to create expense');
  }
};

// Activity log APIs
export const getActivityLogs = async (filters: any = {}) => {
  try {
    let query = supabase
      .from('activity_logs')
      .select('*, profiles:user_id(*)')
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
    
    if (error) throw error;
    return { data };
  } catch (error) {
    return handleError(error, 'Failed to fetch activity logs');
  }
};

export const logActivity = async (logData: any) => {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .insert(logData)
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (error) {
    return handleError(error, 'Failed to log activity');
  }
};
