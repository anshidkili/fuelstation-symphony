
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserRole } from '@/lib/constants';

export interface CreateAdminInput {
  email: string;
  full_name: string;
  station_id: string;
}

// Auth Service Functions
export const createAdmin = async (adminData: CreateAdminInput) => {
  try {
    const { email, full_name, station_id } = adminData;

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: 'temp-password-' + Math.random().toString(36).slice(2, 8),
      email_confirm: true,
      user_metadata: {
        full_name,
        role: UserRole.ADMIN
      }
    });

    if (authError) throw authError;

    // Create profile for the admin
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        station_id,
        status: 'active'
      })
      .eq('user_id', authData.user.id);

    if (profileError) throw profileError;

    // Log the action
    await logActivity({
      action: 'create',
      entity_type: 'admin',
      entity_id: authData.user.id,
      details: { station_id }
    });

    toast.success('Admin created successfully');
    return { success: true, user: authData.user };
  } catch (error: any) {
    console.error('Error creating admin:', error);
    toast.error(error.message || 'Failed to create admin');
    return { success: false, error: error.message };
  }
};

export const updateAdminStatus = async (userId: string, status: 'active' | 'inactive' | 'pending') => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('user_id', userId)
      .eq('role', UserRole.ADMIN);

    if (error) throw error;

    await logActivity({
      action: 'update_status',
      entity_type: 'admin',
      entity_id: userId,
      details: { status }
    });

    toast.success(`Admin ${status === 'active' ? 'activated' : status === 'inactive' ? 'deactivated' : 'status updated'}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating admin status:', error);
    toast.error(error.message || 'Failed to update admin status');
    return { success: false, error: error.message };
  }
};

export const createStation = async (stationData: any) => {
  try {
    const { data, error } = await supabase
      .from('stations')
      .insert(stationData)
      .select()
      .single();

    if (error) throw error;

    await logActivity({
      action: 'create',
      entity_type: 'station',
      entity_id: data.id,
      details: stationData
    });

    toast.success('Station created successfully');
    return { success: true, station: data };
  } catch (error: any) {
    console.error('Error creating station:', error);
    toast.error(error.message || 'Failed to create station');
    return { success: false, error: error.message };
  }
};

export const updateStation = async (stationId: string, stationData: any) => {
  try {
    const { data, error } = await supabase
      .from('stations')
      .update(stationData)
      .eq('id', stationId)
      .select()
      .single();

    if (error) throw error;

    await logActivity({
      action: 'update',
      entity_type: 'station',
      entity_id: stationId,
      details: stationData
    });

    toast.success('Station updated successfully');
    return { success: true, station: data };
  } catch (error: any) {
    console.error('Error updating station:', error);
    toast.error(error.message || 'Failed to update station');
    return { success: false, error: error.message };
  }
};

// Employee Management
export const createEmployee = async (employeeData: any) => {
  try {
    const { email, full_name, station_id, hourly_rate, contact_number, address } = employeeData;

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: 'temp-password-' + Math.random().toString(36).slice(2, 8),
      email_confirm: true,
      user_metadata: {
        full_name,
        role: UserRole.EMPLOYEE
      }
    });

    if (authError) throw authError;

    // Update profile for the employee
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        station_id,
        hourly_rate,
        contact_number,
        address,
        status: 'active'
      })
      .eq('user_id', authData.user.id);

    if (profileError) throw profileError;

    await logActivity({
      action: 'create',
      entity_type: 'employee',
      entity_id: authData.user.id,
      details: { station_id, hourly_rate }
    });

    toast.success('Employee created successfully');
    return { success: true, user: authData.user };
  } catch (error: any) {
    console.error('Error creating employee:', error);
    toast.error(error.message || 'Failed to create employee');
    return { success: false, error: error.message };
  }
};

// Customer Management
export const createCreditCustomer = async (customerData: any) => {
  try {
    const { email, full_name, station_id, contact_number, address } = customerData;

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: 'temp-password-' + Math.random().toString(36).slice(2, 8),
      email_confirm: true,
      user_metadata: {
        full_name,
        role: UserRole.CREDIT_CUSTOMER
      }
    });

    if (authError) throw authError;

    // Update profile for the customer
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        station_id,
        contact_number,
        address,
        status: 'active'
      })
      .eq('user_id', authData.user.id);

    if (profileError) throw profileError;

    await logActivity({
      action: 'create',
      entity_type: 'credit_customer',
      entity_id: authData.user.id,
      details: { station_id }
    });

    toast.success('Credit customer created successfully');
    return { success: true, user: authData.user };
  } catch (error: any) {
    console.error('Error creating credit customer:', error);
    toast.error(error.message || 'Failed to create credit customer');
    return { success: false, error: error.message };
  }
};

// Dispenser Management
export const createDispenser = async (dispenserData: any) => {
  try {
    const { data, error } = await supabase
      .from('dispensers')
      .insert(dispenserData)
      .select()
      .single();

    if (error) throw error;

    await logActivity({
      action: 'create',
      entity_type: 'dispenser',
      entity_id: data.id,
      details: dispenserData
    });

    toast.success('Dispenser created successfully');
    return { success: true, dispenser: data };
  } catch (error: any) {
    console.error('Error creating dispenser:', error);
    toast.error(error.message || 'Failed to create dispenser');
    return { success: false, error: error.message };
  }
};

export const updateDispenserStatus = async (dispenserId: string, status: 'active' | 'inactive' | 'maintenance') => {
  try {
    const { data, error } = await supabase
      .from('dispensers')
      .update({ status })
      .eq('id', dispenserId)
      .select()
      .single();

    if (error) throw error;

    await logActivity({
      action: 'update_status',
      entity_type: 'dispenser',
      entity_id: dispenserId,
      details: { status }
    });

    toast.success(`Dispenser ${status === 'active' ? 'activated' : status === 'inactive' ? 'deactivated' : 'set to maintenance'}`);
    return { success: true, dispenser: data };
  } catch (error: any) {
    console.error('Error updating dispenser status:', error);
    toast.error(error.message || 'Failed to update dispenser status');
    return { success: false, error: error.message };
  }
};

// Inventory Management
export const addFuelInventory = async (fuelData: any) => {
  try {
    const { data, error } = await supabase
      .from('fuel_inventory')
      .insert(fuelData)
      .select()
      .single();

    if (error) throw error;

    await logActivity({
      action: 'create',
      entity_type: 'fuel_inventory',
      entity_id: data.id,
      details: fuelData
    });

    toast.success('Fuel inventory added successfully');
    return { success: true, fuel: data };
  } catch (error: any) {
    console.error('Error adding fuel inventory:', error);
    toast.error(error.message || 'Failed to add fuel inventory');
    return { success: false, error: error.message };
  }
};

export const updateFuelInventory = async (fuelId: string, updateData: any) => {
  try {
    const { data, error } = await supabase
      .from('fuel_inventory')
      .update(updateData)
      .eq('id', fuelId)
      .select()
      .single();

    if (error) throw error;

    await logActivity({
      action: 'update',
      entity_type: 'fuel_inventory',
      entity_id: fuelId,
      details: updateData
    });

    toast.success('Fuel inventory updated successfully');
    return { success: true, fuel: data };
  } catch (error: any) {
    console.error('Error updating fuel inventory:', error);
    toast.error(error.message || 'Failed to update fuel inventory');
    return { success: false, error: error.message };
  }
};

export const addProduct = async (productData: any) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();

    if (error) throw error;

    await logActivity({
      action: 'create',
      entity_type: 'product',
      entity_id: data.id,
      details: productData
    });

    toast.success('Product added successfully');
    return { success: true, product: data };
  } catch (error: any) {
    console.error('Error adding product:', error);
    toast.error(error.message || 'Failed to add product');
    return { success: false, error: error.message };
  }
};

// Shift Management
export const startShift = async (shiftData: any) => {
  try {
    const { data, error } = await supabase
      .from('shifts')
      .insert(shiftData)
      .select()
      .single();

    if (error) throw error;

    // Create meter readings for each dispenser
    if (shiftData.meterReadings && Array.isArray(shiftData.meterReadings)) {
      const meterReadingsWithShiftId = shiftData.meterReadings.map((reading: any) => ({
        ...reading,
        shift_id: data.id
      }));
      
      const { error: meterError } = await supabase
        .from('meter_readings')
        .insert(meterReadingsWithShiftId);
      
      if (meterError) throw meterError;
    }

    await logActivity({
      action: 'start',
      entity_type: 'shift',
      entity_id: data.id,
      details: shiftData
    });

    toast.success('Shift started successfully');
    return { success: true, shift: data };
  } catch (error: any) {
    console.error('Error starting shift:', error);
    toast.error(error.message || 'Failed to start shift');
    return { success: false, error: error.message };
  }
};

export const endShift = async (shiftId: string, endData: any) => {
  try {
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

    if (error) throw error;

    // Update meter readings
    if (endData.meterReadings && Array.isArray(endData.meterReadings)) {
      for (const reading of endData.meterReadings) {
        const { error: meterError } = await supabase
          .from('meter_readings')
          .update({ end_reading: reading.end_reading })
          .eq('id', reading.id);
        
        if (meterError) throw meterError;
      }
    }

    await logActivity({
      action: 'end',
      entity_type: 'shift',
      entity_id: shiftId,
      details: endData
    });

    toast.success('Shift ended successfully');
    return { success: true, shift: data };
  } catch (error: any) {
    console.error('Error ending shift:', error);
    toast.error(error.message || 'Failed to end shift');
    return { success: false, error: error.message };
  }
};

// Transaction Management
export const createTransaction = async (transactionData: any) => {
  try {
    // First, create the transaction
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        station_id: transactionData.station_id,
        shift_id: transactionData.shift_id,
        customer_id: transactionData.customer_id,
        transaction_type: transactionData.transaction_type,
        payment_method: transactionData.payment_method,
        total_amount: transactionData.total_amount,
        status: transactionData.status || 'completed'
      })
      .select()
      .single();

    if (error) throw error;
    if (!transaction) throw new Error('Failed to create transaction');

    // Then, create transaction items
    if (transactionData.items && Array.isArray(transactionData.items)) {
      const transactionItems = transactionData.items.map((item: any) => ({
        transaction_id: transaction.id,
        item_type: item.item_type,
        item_id: item.item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }));
      
      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(transactionItems);
      
      if (itemsError) throw itemsError;

      // Update inventory based on transaction items
      for (const item of transactionData.items) {
        if (item.item_type === 'fuel') {
          // Update fuel inventory
          await supabase.rpc('update_fuel_inventory', {
            p_fuel_id: item.item_id,
            p_quantity: item.quantity
          });
        } else if (item.item_type === 'product') {
          // Update product inventory
          await supabase.rpc('update_product_inventory', {
            p_product_id: item.item_id,
            p_quantity: item.quantity
          });
        }
      }
    }

    await logActivity({
      action: 'create',
      entity_type: 'transaction',
      entity_id: transaction.id,
      details: {
        amount: transactionData.total_amount,
        type: transactionData.transaction_type,
        payment_method: transactionData.payment_method
      }
    });

    toast.success('Transaction completed successfully');
    return { success: true, transaction };
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    toast.error(error.message || 'Failed to create transaction');
    return { success: false, error: error.message };
  }
};

// Invoice Management
export const createInvoice = async (invoiceData: any) => {
  try {
    // First, create the invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        customer_id: invoiceData.customer_id,
        station_id: invoiceData.station_id,
        invoice_number: invoiceData.invoice_number,
        issue_date: invoiceData.issue_date,
        due_date: invoiceData.due_date,
        total_amount: invoiceData.total_amount,
        discount: invoiceData.discount || 0,
        tax: invoiceData.tax || 0,
        status: invoiceData.status || 'unpaid'
      })
      .select()
      .single();

    if (error) throw error;
    if (!invoice) throw new Error('Failed to create invoice');

    // Then, create invoice items
    if (invoiceData.items && Array.isArray(invoiceData.items)) {
      const invoiceItems = invoiceData.items.map((item: any) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }));
      
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);
      
      if (itemsError) throw itemsError;
    }

    await logActivity({
      action: 'create',
      entity_type: 'invoice',
      entity_id: invoice.id,
      details: {
        amount: invoiceData.total_amount,
        customer: invoiceData.customer_id
      }
    });

    toast.success('Invoice created successfully');
    return { success: true, invoice };
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    toast.error(error.message || 'Failed to create invoice');
    return { success: false, error: error.message };
  }
};

export const updateInvoiceStatus = async (invoiceId: string, status: string) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .update({ status })
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) throw error;

    await logActivity({
      action: 'update_status',
      entity_type: 'invoice',
      entity_id: invoiceId,
      details: { status }
    });

    toast.success(`Invoice marked as ${status}`);
    return { success: true, invoice: data };
  } catch (error: any) {
    console.error('Error updating invoice status:', error);
    toast.error(error.message || 'Failed to update invoice status');
    return { success: false, error: error.message };
  }
};

// Vehicle Management
export const createVehicle = async (vehicleData: any) => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .insert(vehicleData)
      .select()
      .single();

    if (error) throw error;

    await logActivity({
      action: 'create',
      entity_type: 'vehicle',
      entity_id: data.id,
      details: vehicleData
    });

    toast.success('Vehicle added successfully');
    return { success: true, vehicle: data };
  } catch (error: any) {
    console.error('Error adding vehicle:', error);
    toast.error(error.message || 'Failed to add vehicle');
    return { success: false, error: error.message };
  }
};

// Expense Management
export const createExpense = async (expenseData: any) => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .insert(expenseData)
      .select()
      .single();

    if (error) throw error;

    await logActivity({
      action: 'create',
      entity_type: 'expense',
      entity_id: data.id,
      details: expenseData
    });

    toast.success('Expense recorded successfully');
    return { success: true, expense: data };
  } catch (error: any) {
    console.error('Error recording expense:', error);
    toast.error(error.message || 'Failed to record expense');
    return { success: false, error: error.message };
  }
};

// Activity Logging
export const logActivity = async ({
  action,
  entity_type,
  entity_id,
  details = {}
}: {
  action: string;
  entity_type: string;
  entity_id: string;
  details?: any;
}) => {
  try {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user) return;

    await supabase
      .from('activity_logs')
      .insert({
        user_id: authUser.user.id,
        action,
        entity_type,
        entity_id,
        details
      });
    
    return { success: true };
  } catch (error) {
    console.error('Error logging activity:', error);
    return { success: false };
  }
};
