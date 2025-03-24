
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Basic CRUD functions for stations
export const createStation = async (data: any) => {
  try {
    const { data: newStation, error } = await supabase
      .from('stations')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data: newStation };
  } catch (error: any) {
    toast.error(`Error creating station: ${error.message}`);
    return { success: false, error: error.message };
  }
};

export const updateStation = async (id: string, data: any) => {
  try {
    const { data: updatedStation, error } = await supabase
      .from('stations')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data: updatedStation };
  } catch (error: any) {
    toast.error(`Error updating station: ${error.message}`);
    return { success: false, error: error.message };
  }
};

export const deleteStation = async (id: string) => {
  try {
    const { error } = await supabase
      .from('stations')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    toast.error(`Error deleting station: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Basic CRUD functions for profiles (admins, employees, customers)
export const createProfile = async (data: any) => {
  try {
    const { data: newProfile, error } = await supabase
      .from('profiles')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data: newProfile };
  } catch (error: any) {
    toast.error(`Error creating profile: ${error.message}`);
    return { success: false, error: error.message };
  }
};

export const updateProfile = async (id: string, data: any) => {
  try {
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data: updatedProfile };
  } catch (error: any) {
    toast.error(`Error updating profile: ${error.message}`);
    return { success: false, error: error.message };
  }
};

export const deleteProfile = async (id: string) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    toast.error(`Error deleting profile: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Basic CRUD functions for dispensers
export const createDispenser = async (data: any) => {
  try {
    const { data: newDispenser, error } = await supabase
      .from('dispensers')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data: newDispenser };
  } catch (error: any) {
    toast.error(`Error creating dispenser: ${error.message}`);
    return { success: false, error: error.message };
  }
};

export const updateDispenser = async (id: string, data: any) => {
  try {
    const { data: updatedDispenser, error } = await supabase
      .from('dispensers')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data: updatedDispenser };
  } catch (error: any) {
    toast.error(`Error updating dispenser: ${error.message}`);
    return { success: false, error: error.message };
  }
};

export const deleteDispenser = async (id: string) => {
  try {
    const { error } = await supabase
      .from('dispensers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    toast.error(`Error deleting dispenser: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Fuel inventory functions
export const updateFuelInventory = async (id: string, data: any) => {
  try {
    const { data: updatedInventory, error } = await supabase
      .from('fuel_inventory')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data: updatedInventory };
  } catch (error: any) {
    toast.error(`Error updating fuel inventory: ${error.message}`);
    return { success: false, error: error.message };
  }
};

export const restockFuel = async (id: string, amount: number) => {
  try {
    const { data: inventory, error: fetchError } = await supabase
      .from('fuel_inventory')
      .select('current_stock')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    const newStock = Number(inventory.current_stock) + Number(amount);
    
    const { data: updatedInventory, error } = await supabase
      .from('fuel_inventory')
      .update({ 
        current_stock: newStock, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data: updatedInventory };
  } catch (error: any) {
    toast.error(`Error restocking fuel: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Product inventory functions
export const createProduct = async (data: any) => {
  try {
    const { data: newProduct, error } = await supabase
      .from('products')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data: newProduct };
  } catch (error: any) {
    toast.error(`Error creating product: ${error.message}`);
    return { success: false, error: error.message };
  }
};

export const updateProduct = async (id: string, data: any) => {
  try {
    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data: updatedProduct };
  } catch (error: any) {
    toast.error(`Error updating product: ${error.message}`);
    return { success: false, error: error.message };
  }
};

export const deleteProduct = async (id: string) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    toast.error(`Error deleting product: ${error.message}`);
    return { success: false, error: error.message };
  }
};

export const restockProduct = async (id: string, amount: number) => {
  try {
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('current_stock')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    const newStock = Number(product.current_stock) + Number(amount);
    
    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update({ 
        current_stock: newStock, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data: updatedProduct };
  } catch (error: any) {
    toast.error(`Error restocking product: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Shift management
export const startShift = async (data: any) => {
  try {
    const shiftData = {
      station_id: data.station_id,
      employee_id: data.employee_id,
      start_time: new Date().toISOString(),
      dispensers: data.dispensers,
      starting_cash: data.starting_cash,
      status: 'active'
    };
    
    const { data: newShift, error } = await supabase
      .from('shifts')
      .insert(shiftData)
      .select()
      .single();
    
    if (error) throw error;
    
    // Insert initial meter readings
    const meterReadingPromises = data.meter_readings.map((reading: any) => {
      return supabase
        .from('meter_readings')
        .insert({
          shift_id: newShift.id,
          dispenser_id: reading.dispenser_id,
          fuel_type: reading.fuel_type,
          start_reading: reading.reading,
          end_reading: null
        });
    });
    
    await Promise.all(meterReadingPromises);
    
    return { success: true, data: newShift };
  } catch (error: any) {
    toast.error(`Error starting shift: ${error.message}`);
    return { success: false, error: error.message };
  }
};

export const endShift = async (id: string, data: any) => {
  try {
    const { data: updatedShift, error } = await supabase
      .from('shifts')
      .update({
        end_time: new Date().toISOString(),
        ending_cash: data.ending_cash,
        status: 'completed'
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Update meter readings
    const meterReadingPromises = data.meter_readings.map((reading: any) => {
      return supabase
        .from('meter_readings')
        .update({
          end_reading: reading.reading
        })
        .eq('id', reading.id);
    });
    
    await Promise.all(meterReadingPromises);
    
    return { success: true, data: updatedShift };
  } catch (error: any) {
    toast.error(`Error ending shift: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Transaction management
export const createTransaction = async (data: any) => {
  try {
    // First create the transaction
    const { data: newTransaction, error } = await supabase
      .from('transactions')
      .insert({
        station_id: data.station_id,
        shift_id: data.shift_id,
        customer_id: data.customer_id,
        transaction_type: data.transaction_type,
        payment_method: data.payment_method,
        total_amount: data.total_amount,
        status: 'completed'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Then create all transaction items
    const itemPromises = data.items.map((item: any) => {
      return supabase
        .from('transaction_items')
        .insert({
          transaction_id: newTransaction.id,
          item_type: item.item_type,
          item_id: item.item_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        });
    });
    
    await Promise.all(itemPromises);
    
    // Update inventory based on the transaction
    const inventoryPromises = data.items.map((item: any) => {
      if (item.item_type === 'fuel') {
        return supabase.rpc('update_fuel_inventory', {
          p_fuel_id: item.item_id,
          p_quantity: item.quantity
        });
      } else if (item.item_type === 'product') {
        return supabase.rpc('update_product_inventory', {
          p_product_id: item.item_id,
          p_quantity: item.quantity
        });
      }
      return Promise.resolve();
    });
    
    await Promise.all(inventoryPromises);
    
    return { success: true, data: newTransaction };
  } catch (error: any) {
    toast.error(`Error creating transaction: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// For reporting functions, use direct queries until RPC functions are created
export const getSalesReport = async (stationId: string | null, period: 'daily' | 'monthly' | 'yearly') => {
  try {
    let query = supabase.from('transactions').select('*'); 
    
    if (stationId) {
      query = query.eq('station_id', stationId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    toast.error(`Error getting sales report: ${error.message}`);
    return { success: false, error: error.message };
  }
};

export const getFuelSalesBreakdown = async (stationId: string | null, period: 'daily' | 'monthly' | 'yearly') => {
  try {
    let query = supabase.from('transaction_items')
      .select('*, transactions(*)')
      .eq('item_type', 'fuel');
    
    if (stationId) {
      query = query.eq('transactions.station_id', stationId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    toast.error(`Error getting fuel sales breakdown: ${error.message}`);
    return { success: false, error: error.message };
  }
};

export const getProductSalesBreakdown = async (stationId: string | null, period: 'daily' | 'monthly' | 'yearly') => {
  try {
    let query = supabase.from('transaction_items')
      .select('*, transactions(*)')
      .eq('item_type', 'product');
    
    if (stationId) {
      query = query.eq('transactions.station_id', stationId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    toast.error(`Error getting product sales breakdown: ${error.message}`);
    return { success: false, error: error.message };
  }
};

export const getStationComparison = async (period: 'daily' | 'monthly' | 'yearly') => {
  try {
    const { data, error } = await supabase.from('stations')
      .select('*, transactions(*)');
    
    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    toast.error(`Error getting station comparison: ${error.message}`);
    return { success: false, error: error.message };
  }
};

export const getFinancialSummary = async (stationId: string | null, period: 'daily' | 'monthly' | 'yearly') => {
  try {
    let query = supabase.from('transactions')
      .select('*');
    
    if (stationId) {
      query = query.eq('station_id', stationId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    toast.error(`Error getting financial summary: ${error.message}`);
    return { success: false, error: error.message };
  }
};
