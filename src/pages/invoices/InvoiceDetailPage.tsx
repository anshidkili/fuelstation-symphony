import { useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Download, FileText, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { getInvoiceById, updateInvoiceStatus } from '@/services/invoiceService';

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const printMode = searchParams.get('print') === 'true';
  const navigate = useNavigate();
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (printMode) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [printMode]);

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      if (!id) return null;
      
      const result = await getInvoiceById(id);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.invoice;
    },
    enabled: !!id,
  });

  const handlePrint = () => {
    window.print();
  };

  const handlePayInvoice = async () => {
    if (!id) return;
    
    try {
      const result = await updateInvoiceStatus(id, 'paid');
      
      if (result.success) {
        toast.success('Invoice marked as paid');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast.error('Failed to update invoice status');
    }
  };

  if (error) {
    toast.error('Failed to load invoice details');
    console.error('Error loading invoice details:', error);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-lg font-medium">Invoice not found</div>
        <p className="text-muted-foreground text-center max-w-md">
          The requested invoice could not be found.
        </p>
        <Button onClick={() => navigate('/invoices')}>
          Back to Invoices
        </Button>
      </div>
    );
  }

  const isOverdue = new Date(invoice.due_date) < new Date() && invoice.status !== 'paid';
  const status = isOverdue ? 'overdue' : invoice.status;

  const subtotal = invoice.items.reduce((sum, item) => sum + Number(item.total_price), 0);
  const discount = Number(invoice.discount);
  const tax = Number(invoice.tax);
  const total = Number(invoice.total_amount);

  return (
    <div className={`space-y-6 ${printMode ? 'p-8 max-w-4xl mx-auto' : ''}`} ref={printRef}>
      {!printMode && (
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/invoices')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Invoice #{invoice.invoice_number}</h1>
              <p className="text-muted-foreground">
                {format(parseISO(invoice.created_at), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            {user?.role === UserRole.CREDIT_CUSTOMER && invoice.status !== 'paid' && (
              <Button onClick={handlePayInvoice}>
                Pay Invoice
              </Button>
            )}
          </div>
        </div>
      )}

      <Card className={printMode ? 'border-0 shadow-none' : ''}>
        <CardContent className={`${printMode ? 'p-0' : 'pt-6'}`}>
          <div className="mb-8 flex justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">INVOICE</h2>
              <p className="text-muted-foreground text-sm">#{invoice.invoice_number}</p>
              
              <div className="mt-4">
                <p className="font-medium">Status</p>
                <p className={`${
                  status === 'paid' 
                    ? 'text-green-600 dark:text-green-400' 
                    : status === 'overdue' 
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {status.replace('_', ' ').toUpperCase()}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="font-medium">{invoice.station.name}</p>
              <p>{invoice.station.address}</p>
              <p>{invoice.station.city}, {invoice.station.state} {invoice.station.zip}</p>
              <p>{invoice.station.phone}</p>
              <p>{invoice.station.email}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-medium mb-2">Bill To:</h3>
              <p>{invoice.customer.full_name}</p>
              <p>{invoice.customer.address || 'No address on record'}</p>
              <p>{invoice.customer.email}</p>
              <p>{invoice.customer.contact_number}</p>
            </div>
            <div className="text-right">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <p className="font-medium">Invoice Date:</p>
                  <p>{format(parseISO(invoice.issue_date), 'MMMM d, yyyy')}</p>
                </div>
                <div className="flex justify-between">
                  <p className="font-medium">Due Date:</p>
                  <p>{format(parseISO(invoice.due_date), 'MMMM d, yyyy')}</p>
                </div>
                <div className="flex justify-between">
                  <p className="font-medium">Amount Due:</p>
                  <p className="font-bold">${Number(invoice.total_amount).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="rounded-md border mb-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{Number(item.quantity).toFixed(2)}</TableCell>
                    <TableCell className="text-right">${Number(item.unit_price).toFixed(2)}</TableCell>
                    <TableCell className="text-right">${Number(item.total_price).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex justify-end mb-8">
            <div className="w-80">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <p>Subtotal:</p>
                  <p>${subtotal.toFixed(2)}</p>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <p>Discount:</p>
                    <p>-${discount.toFixed(2)}</p>
                  </div>
                )}
                {tax > 0 && (
                  <div className="flex justify-between">
                    <p>Tax:</p>
                    <p>${tax.toFixed(2)}</p>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 font-bold">
                  <p>Total:</p>
                  <p>${total.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Notes</h3>
            <p className="text-muted-foreground">
              Thank you for your business. Payment is due within {new Date(invoice.due_date).getDate() - new Date(invoice.issue_date).getDate()} days of issue.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
