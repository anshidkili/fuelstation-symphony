
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logActivity } from './api';

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

export const getVehicles = async (customerId: string) => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('customer_id', customerId)
      .order('make', { ascending: true });

    if (error) throw error;

    return { success: true, vehicles: data };
  } catch (error: any) {
    console.error('Error fetching vehicles:', error);
    toast.error(error.message || 'Failed to fetch vehicles');
    return { success: false, error: error.message };
  }
};

export const getVehicleById = async (vehicleId: string) => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select(`
        *,
        customer:profiles(id, full_name)
      `)
      .eq('id', vehicleId)
      .single();

    if (error) throw error;

    return { success: true, vehicle: data };
  } catch (error: any) {
    console.error('Error fetching vehicle:', error);
    toast.error(error.message || 'Failed to fetch vehicle');
    return { success: false, error: error.message };
  }
};

export const updateVehicle = async (vehicleId: string, vehicleData: any) => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .update(vehicleData)
      .eq('id', vehicleId)
      .select()
      .single();

    if (error) throw error;

    await logActivity({
      action: 'update',
      entity_type: 'vehicle',
      entity_id: vehicleId,
      details: vehicleData
    });

    toast.success('Vehicle updated successfully');
    return { success: true, vehicle: data };
  } catch (error: any) {
    console.error('Error updating vehicle:', error);
    toast.error(error.message || 'Failed to update vehicle');
    return { success: false, error: error.message };
  }
};

export const deleteVehicle = async (vehicleId: string) => {
  try {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', vehicleId);

    if (error) throw error;

    await logActivity({
      action: 'delete',
      entity_type: 'vehicle',
      entity_id: vehicleId,
      details: {}
    });

    toast.success('Vehicle deleted successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting vehicle:', error);
    toast.error(error.message || 'Failed to delete vehicle');
    return { success: false, error: error.message };
  }
};

export const getVehicleFuelConsumption = async (vehicleId: string, startDate?: Date, endDate?: Date) => {
  try {
    // We need to get all transactions involving this vehicle
    // This is complex and would require a custom database view or function
    // For now, we'll implement a simplified version using transaction items
    
    let query = supabase
      .from('transaction_items')
      .select(`
        id,
        quantity,
        unit_price,
        total_price,
        transaction:transactions(
          id,
          created_at,
          customer_id
        )
      `)
      .eq('item_type', 'fuel');
      
    const { data, error } = await query;

    if (error) throw error;
    
    // Filter transactions for the specific vehicle's customer
    // This is a simplification - in a real system, you'd track which vehicle was used for each transaction
    const vehicleData = await getVehicleById(vehicleId);
    if (!vehicleData.success) throw new Error('Failed to get vehicle data');
    
    const customerId = vehicleData.vehicle.customer.id;
    
    const vehicleTransactions = data.filter(item => 
      item.transaction.customer_id === customerId
    );
    
    // Calculate total consumption
    const totalConsumption = vehicleTransactions.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = vehicleTransactions.reduce((sum, item) => sum + item.total_price, 0);

    return { 
      success: true, 
      consumption: {
        vehicle: vehicleData.vehicle,
        totalLiters: totalConsumption,
        totalAmount: totalAmount,
        transactions: vehicleTransactions
      }
    };
  } catch (error: any) {
    console.error('Error getting vehicle fuel consumption:', error);
    toast.error(error.message || 'Failed to get vehicle fuel consumption');
    return { success: false, error: error.message };
  }
};
