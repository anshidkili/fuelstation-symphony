
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { format, subMonths } from 'date-fns';
import { Calendar, Eye, FileText, MoreVertical, Plus, Printer, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { getInvoices, InvoiceStatus, updateInvoiceStatus } from '@/services/invoiceService';

export default function InvoicesPage() {
  const { user } = useAuth();
  const [stationId, setStationId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [status, setStatus] = useState<InvoiceStatus | undefined>(undefined);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined);

  useEffect(() => {
    if (user?.station_id) {
      setStationId(user.station_id);
    }
    
    if (user?.role === UserRole.CREDIT_CUSTOMER) {
      setCustomerId(user.id);
    }
    
    // Set default date range to last 3 months
    const today = new Date();
    const threeMonthsAgo = subMonths(today, 3);
    setDateRange({ from: threeMonthsAgo, to: today });
  }, [user]);

  const { data: invoices, isLoading, error, refetch } = useQuery({
    queryKey: ['invoices', stationId, customerId, status, dateRange],
    queryFn: async () => {
      const params: any = {};
      
      if (stationId && user?.role !== UserRole.CREDIT_CUSTOMER) {
        params.stationId = stationId;
      }
      
      if (customerId || user?.role === UserRole.CREDIT_CUSTOMER) {
        params.customerId = customerId || user?.id;
      }
      
      if (status) {
        params.status = status;
      }
      
      if (dateRange?.from) {
        params.startDate = dateRange.from;
      }
      
      if (dateRange?.to) {
        params.endDate = dateRange.to;
      }
      
      const result = await getInvoices(params);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.invoices;
    },
    enabled: !!user?.role,
  });

  const handleStatusChange = async (invoiceId: string, newStatus: InvoiceStatus) => {
    try {
      const result = await updateInvoiceStatus(invoiceId, newStatus);
      
      if (result.success) {
        refetch();
      }
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast.error('Failed to update invoice status');
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'overdue':
        return 'destructive';
      case 'unpaid':
        return 'warning';
      case 'partially_paid':
        return 'default';
      default:
        return 'outline';
    }
  };

  if (error) {
    toast.error('Failed to load invoices');
    console.error('Error loading invoices:', error);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            {user?.role === UserRole.CREDIT_CUSTOMER 
              ? 'View and manage your invoices' 
              : 'Create and manage invoices for customers'}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {user?.role !== UserRole.CREDIT_CUSTOMER && (
            <Button asChild>
              <Link to="/invoices/new">
                <Plus className="h-4 w-4 mr-2" />
                New Invoice
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Management</CardTitle>
          <CardDescription>
            View, filter and manage {user?.role === UserRole.CREDIT_CUSTOMER ? 'your' : 'customer'} invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Date Range</label>
              <DatePickerWithRange value={dateRange} onChange={setDateRange} />
            </div>
            <div className="w-full md:w-48">
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select value={status} onValueChange={(value) => setStatus(value as InvoiceStatus || undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={undefined}>All statuses</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="partially_paid">Partially Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !invoices || invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <div className="text-lg font-medium">No invoices found</div>
              <p className="text-muted-foreground text-center max-w-md">
                {user?.role === UserRole.CREDIT_CUSTOMER 
                  ? 'You have no invoices matching the selected filters.'
                  : 'No invoices found matching the selected filters. Create a new invoice to get started.'}
              </p>
              {user?.role !== UserRole.CREDIT_CUSTOMER && (
                <Button asChild>
                  <Link to="/invoices/new">
                    <Plus className="h-4 w-4 mr-2" />
                    New Invoice
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => {
                    const isOverdue = new Date(invoice.due_date) < new Date() && invoice.status !== 'paid';
                    const status = isOverdue ? 'overdue' : invoice.status;
                    
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>{format(new Date(invoice.issue_date), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                          {isOverdue && invoice.status !== 'paid' && (
                            <span className="ml-2 text-xs text-red-500">Overdue</span>
                          )}
                        </TableCell>
                        <TableCell>{invoice.customer?.full_name}</TableCell>
                        <TableCell className="text-right">
                          ${Number(invoice.total_amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(status)}>
                            {status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button asChild size="sm" variant="outline">
                              <Link to={`/invoices/${invoice.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Link>
                            </Button>
                            
                            {(user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  
                                  <DropdownMenuItem onClick={() => window.open(`/invoices/${invoice.id}?print=true`, '_blank')}>
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuSeparator />
                                  
                                  {invoice.status !== 'paid' && (
                                    <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, 'paid')}>
                                      Mark as Paid
                                    </DropdownMenuItem>
                                  )}
                                  
                                  {invoice.status !== 'unpaid' && (
                                    <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, 'unpaid')}>
                                      Mark as Unpaid
                                    </DropdownMenuItem>
                                  )}
                                  
                                  {invoice.status !== 'partially_paid' && (
                                    <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, 'partially_paid')}>
                                      Mark as Partially Paid
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
