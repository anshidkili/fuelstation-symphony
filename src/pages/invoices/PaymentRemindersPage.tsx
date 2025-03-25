import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { format, addDays } from 'date-fns';
import { 
  BellRing, 
  AlarmClock, 
  BellOff, 
  MoreVertical, 
  Plus, 
  RefreshCw, 
  Check, 
  Mail, 
  CalendarRange 
} from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentRemindersPage() {
  const { user } = useAuth();
  const [stationId, setStationId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.station_id) {
      setStationId(user.station_id);
    }
  }, [user]);

  const { data: reminders, isLoading, error, refetch } = useQuery({
    queryKey: ['payment-reminders', stationId],
    queryFn: async () => {
      if (!stationId && user?.role !== 'Credit Customer') return null;
      
      let query = supabase
        .from('payment_reminders')
        .select(`
          *,
          invoice:invoices(id, invoice_number, total_amount, due_date, status),
          customer:profiles(id, full_name, email, contact_number)
        `)
        .order('reminder_date', { ascending: false });
      
      if (user?.role === 'Credit Customer') {
        query = query.eq('customer_id', user.id);
      } else {
        query = query.eq('invoice.station_id', stationId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    enabled: !!(stationId || user?.role === 'Credit Customer'),
  });

  const sendReminder = async (reminderId: string) => {
    try {
      // Update the reminder status
      const { error } = await supabase
        .from('payment_reminders')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', reminderId);
        
      if (error) throw error;
      
      toast.success('Reminder sent successfully');
      refetch();
    } catch (error: any) {
      console.error('Error sending reminder:', error);
      toast.error(error.message || 'Failed to send reminder');
    }
  };

  const markAsResolved = async (reminderId: string) => {
    try {
      // Update the reminder status
      const { error } = await supabase
        .from('payment_reminders')
        .update({
          status: 'resolved'
        })
        .eq('id', reminderId);
        
      if (error) throw error;
      
      toast.success('Reminder marked as resolved');
      refetch();
    } catch (error: any) {
      console.error('Error updating reminder:', error);
      toast.error(error.message || 'Failed to update reminder');
    }
  };

  const getReminderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'sent':
        return <Badge>Sent</Badge>;
      case 'resolved':
        return <Badge variant="secondary">Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (error) {
    toast.error('Failed to load payment reminders');
    console.error('Error loading payment reminders:', error);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment Reminders</h1>
          <p className="text-muted-foreground">
            Manage and track payment reminders for customer invoices
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button asChild>
            <Link to="/payment-reminders/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Reminder
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Reminders</CardTitle>
          <CardDescription>
            Manage upcoming and overdue payment reminders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !reminders || reminders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <AlarmClock className="h-12 w-12 text-muted-foreground" />
              <div className="text-lg font-medium">No payment reminders</div>
              <p className="text-muted-foreground text-center max-w-md">
                No payment reminders found. Create a new reminder to notify customers about upcoming or overdue payments.
              </p>
              <Button asChild>
                <Link to="/payment-reminders/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Reminder
                </Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Reminder Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reminders.map((reminder: any) => (
                    <TableRow key={reminder.id}>
                      <TableCell>
                        <Link to={`/invoices/${reminder.invoice?.id}`} className="font-medium hover:underline">
                          {reminder.invoice?.invoice_number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {reminder.customer?.full_name}
                      </TableCell>
                      <TableCell>
                        {format(new Date(reminder.reminder_date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {getReminderStatusBadge(reminder.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {reminder.status === 'pending' && (
                              <DropdownMenuItem onClick={() => sendReminder(reminder.id)}>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Reminder
                              </DropdownMenuItem>
                            )}
                            {reminder.status !== 'resolved' && (
                              <DropdownMenuItem onClick={() => markAsResolved(reminder.id)}>
                                <Check className="h-4 w-4 mr-2" />
                                Mark as Resolved
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Link to={`/payment-reminders/${reminder.id}`} className="w-full">
                                Edit Reminder
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Delete Reminder
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
