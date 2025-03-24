
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logActivity } from './api';

export type InvoiceStatus = 'paid' | 'unpaid' | 'overdue' | 'partially_paid';

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

    // Create payment reminder if it's a credit customer
    const dueDate = new Date(invoiceData.due_date);
    const reminderDate = new Date(dueDate);
    reminderDate.setDate(reminderDate.getDate() - 3); // Set reminder 3 days before due date
    
    if (reminderDate > new Date()) {
      await supabase
        .from('payment_reminders')
        .insert({
          invoice_id: invoice.id,
          customer_id: invoiceData.customer_id,
          reminder_date: reminderDate.toISOString().split('T')[0],
          message: `Your invoice #${invoiceData.invoice_number} for $${invoiceData.total_amount} is due on ${dueDate.toLocaleDateString()}.`
        });
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

export const getInvoices = async (params: {
  stationId?: string;
  customerId?: string;
  status?: InvoiceStatus;
  startDate?: Date;
  endDate?: Date;
}) => {
  try {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        customer:profiles(id, full_name, email, contact_number),
        station:stations(id, name),
        items:invoice_items(*)
      `)
      .order('issue_date', { ascending: false });
    
    if (params.stationId) {
      query = query.eq('station_id', params.stationId);
    }
    
    if (params.customerId) {
      query = query.eq('customer_id', params.customerId);
    }
    
    if (params.status) {
      query = query.eq('status', params.status);
    }
    
    if (params.startDate) {
      query = query.gte('issue_date', params.startDate.toISOString().split('T')[0]);
    }
    
    if (params.endDate) {
      query = query.lte('issue_date', params.endDate.toISOString().split('T')[0]);
    }
    
    const { data, error } = await query;

    if (error) throw error;

    return { success: true, invoices: data };
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    toast.error(error.message || 'Failed to fetch invoices');
    return { success: false, error: error.message };
  }
};

export const getInvoiceById = async (invoiceId: string) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:profiles(id, full_name, email, contact_number),
        station:stations(id, name, address, city, state, zip, phone, email),
        items:invoice_items(*)
      `)
      .eq('id', invoiceId)
      .single();

    if (error) throw error;

    return { success: true, invoice: data };
  } catch (error: any) {
    console.error('Error fetching invoice:', error);
    toast.error(error.message || 'Failed to fetch invoice');
    return { success: false, error: error.message };
  }
};

export const updateInvoiceStatus = async (invoiceId: string, status: InvoiceStatus) => {
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

export const createPaymentReminder = async (reminderData: {
  invoiceId: string;
  customerId: string;
  reminderDate: Date;
  message: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('payment_reminders')
      .insert({
        invoice_id: reminderData.invoiceId,
        customer_id: reminderData.customerId,
        reminder_date: reminderData.reminderDate.toISOString().split('T')[0],
        message: reminderData.message
      })
      .select()
      .single();

    if (error) throw error;

    toast.success('Payment reminder scheduled');
    return { success: true, reminder: data };
  } catch (error: any) {
    console.error('Error creating payment reminder:', error);
    toast.error(error.message || 'Failed to create payment reminder');
    return { success: false, error: error.message };
  }
};

export const getPaymentReminders = async (params: {
  stationId?: string;
  customerId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}) => {
  try {
    // First get the invoices from the station to get their IDs
    let invoiceIds: string[] = [];
    
    if (params.stationId) {
      const { data: invoices, error: invoiceError } = await supabase
        .from('invoices')
        .select('id')
        .eq('station_id', params.stationId);
        
      if (invoiceError) throw invoiceError;
      invoiceIds = invoices.map(invoice => invoice.id);
    }
    
    let query = supabase
      .from('payment_reminders')
      .select(`
        *,
        invoice:invoices(id, invoice_number, total_amount, due_date, status),
        customer:profiles(id, full_name, email, contact_number)
      `)
      .order('reminder_date', { ascending: true });
    
    if (invoiceIds.length > 0) {
      query = query.in('invoice_id', invoiceIds);
    }
    
    if (params.customerId) {
      query = query.eq('customer_id', params.customerId);
    }
    
    if (params.status) {
      query = query.eq('status', params.status);
    }
    
    if (params.startDate) {
      query = query.gte('reminder_date', params.startDate.toISOString().split('T')[0]);
    }
    
    if (params.endDate) {
      query = query.lte('reminder_date', params.endDate.toISOString().split('T')[0]);
    }
    
    const { data, error } = await query;

    if (error) throw error;

    return { success: true, reminders: data };
  } catch (error: any) {
    console.error('Error fetching payment reminders:', error);
    toast.error(error.message || 'Failed to fetch payment reminders');
    return { success: false, error: error.message };
  }
};

export const markReminderAsSent = async (reminderId: string) => {
  try {
    const { data, error } = await supabase
      .from('payment_reminders')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', reminderId)
      .select()
      .single();

    if (error) throw error;

    toast.success('Reminder marked as sent');
    return { success: true, reminder: data };
  } catch (error: any) {
    console.error('Error updating reminder:', error);
    toast.error(error.message || 'Failed to update reminder');
    return { success: false, error: error.message };
  }
};
