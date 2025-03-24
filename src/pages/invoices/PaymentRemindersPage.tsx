
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/constants';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Alarm, Bell, BellOff, Clock, RefreshCw, Send } from 'lucide-react';
import { toast } from 'sonner';
import { getPaymentReminders, markReminderAsSent } from '@/services/invoiceService';

export default function PaymentRemindersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [stationId, setStationId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('pending');

  useEffect(() => {
    if (user?.station_id) {
      setStationId(user.station_id);
    }
    
    if (user?.role === UserRole.CREDIT_CUSTOMER) {
      setCustomerId(user.id);
    }
  }, [user]);

  const { data: reminders, isLoading, error, refetch } = useQuery({
    queryKey: ['payment-reminders', stationId, customerId, filter],
    queryFn: async () => {
      const params: any = {};
      
      if (stationId && user?.role !== UserRole.CREDIT_CUSTOMER) {
        params.stationId = stationId;
      }
      
      if (customerId || user?.role === UserRole.CREDIT_CUSTOMER) {
        params.customerId = customerId || user?.id;
      }
      
      if (filter && filter !== 'all') {
        params.status = filter;
      }
      
      const result = await getPaymentReminders(params);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.reminders;
    },
    enabled: !!user?.role,
  });

  const sendReminderMutation = useMutation({
    mutationFn: (reminderId: string) => markReminderAsSent(reminderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-reminders'] });
      toast.success('Reminder marked as sent');
    },
    onError: (error: any) => {
      console.error('Error marking reminder as sent:', error);
      toast.error(error.message || 'Failed to send reminder');
    }
  });

  const handleSendReminder = (reminderId: string) => {
    sendReminderMutation.mutate(reminderId);
  };

  if (error) {
    toast.error('Failed to load payment reminders');
    console.error('Error loading payment reminders:', error);
  }

  // Access control
  if (user?.role !== UserRole.ADMIN && user?.role !== UserRole.CREDIT_CUSTOMER) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <div className="text-2xl font-bold">Access Denied</div>
        <p className="text-muted-foreground text-center max-w-md">
          You don't have permission to access payment reminders.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment Reminders</h1>
          <p className="text-muted-foreground">
            {user?.role === UserRole.CREDIT_CUSTOMER 
              ? 'View your payment reminders' 
              : 'Manage and send payment reminders to customers'}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Reminders</CardTitle>
          <CardDescription>
            {user?.role === UserRole.CREDIT_CUSTOMER 
              ? 'Reminders for your upcoming invoice payments' 
              : 'Send and track payment reminders for outstanding invoices'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-6">
            <div className="w-48">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter reminders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All reminders</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !reminders || reminders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <BellOff className="h-12 w-12 text-muted-foreground" />
              <div className="text-lg font-medium">No reminders found</div>
              <p className="text-muted-foreground text-center max-w-md">
                {user?.role === UserRole.CREDIT_CUSTOMER 
                  ? 'You have no payment reminders at the moment.' 
                  : 'No payment reminders found matching the selected filter.'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reminder Date</TableHead>
                    {user?.role !== UserRole.CREDIT_CUSTOMER && (
                      <TableHead>Customer</TableHead>
                    )}
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invoice Status</TableHead>
                    {user?.role !== UserRole.CREDIT_CUSTOMER && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reminders.map((reminder) => {
                    const isPastDue = new Date() > new Date(reminder.reminder_date) && reminder.status === 'pending';
                    const isDueToday = format(new Date(reminder.reminder_date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                    
                    return (
                      <TableRow key={reminder.id}>
                        <TableCell>
                          <div className="flex items-center">
                            {isPastDue && (
                              <Alarm className="h-4 w-4 text-red-500 mr-1" />
                            )}
                            {isDueToday && !isPastDue && (
                              <Clock className="h-4 w-4 text-amber-500 mr-1" />
                            )}
                            {format(new Date(reminder.reminder_date), 'MMM d, yyyy')}
                            {isPastDue && (
                              <span className="ml-2 text-xs text-red-500">Overdue</span>
                            )}
                            {isDueToday && !isPastDue && (
                              <span className="ml-2 text-xs text-amber-500">Today</span>
                            )}
                          </div>
                        </TableCell>
                        {user?.role !== UserRole.CREDIT_CUSTOMER && (
                          <TableCell>{reminder.customer?.full_name}</TableCell>
                        )}
                        <TableCell>
                          <Link 
                            to={`/invoices/${reminder.invoice?.id}`}
                            className="text-primary hover:underline"
                          >
                            {reminder.invoice?.invoice_number}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {format(new Date(reminder.invoice?.due_date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          ${Number(reminder.invoice?.total_amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={reminder.status === 'sent' ? 'outline' : 'default'}>
                            {reminder.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              reminder.invoice?.status === 'paid'
                                ? 'success'
                                : reminder.invoice?.status === 'overdue'
                                ? 'destructive'
                                : 'warning'
                            }
                          >
                            {reminder.invoice?.status}
                          </Badge>
                        </TableCell>
                        {user?.role !== UserRole.CREDIT_CUSTOMER && (
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendReminder(reminder.id)}
                              disabled={
                                reminder.status === 'sent' || 
                                reminder.invoice?.status === 'paid'
                              }
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Send
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          
          {reminders && reminders.filter(r => r.status === 'pending' && new Date(r.reminder_date) <= new Date()).length > 0 && (
            <div className="mt-4 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md flex items-start gap-2 text-amber-800 dark:text-amber-300 text-sm">
              <Bell className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Pending reminders need attention</p>
                <p className="text-amber-700 dark:text-amber-400">
                  There {reminders.filter(r => r.status === 'pending' && new Date(r.reminder_date) <= new Date()).length === 1 ? 'is' : 'are'} {reminders.filter(r => r.status === 'pending' && new Date(r.reminder_date) <= new Date()).length} overdue {reminders.filter(r => r.status === 'pending' && new Date(r.reminder_date) <= new Date()).length === 1 ? 'reminder' : 'reminders'} that {reminders.filter(r => r.status === 'pending' && new Date(r.reminder_date) <= new Date()).length === 1 ? 'needs' : 'need'} to be sent immediately.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
