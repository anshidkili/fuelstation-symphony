
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { AlertTriangle, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { resolveSalesMismatch } from '@/services/financeService';

export default function SalesMismatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: mismatch, isLoading, error } = useQuery({
    queryKey: ['sales-mismatch', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('sales_mismatches')
        .select(`
          *,
          shift:shifts(
            id,
            start_time,
            end_time,
            employee:profiles(
              id,
              full_name
            ),
            station:stations(
              id,
              name
            ),
            meter_readings(
              id,
              dispenser_id,
              fuel_type,
              start_reading,
              end_reading,
              dispenser:dispensers(
                id,
                name
              )
            )
          ),
          transactions:transactions(
            id,
            total_amount,
            payment_method,
            created_at
          )
        `)
        .eq('id', id)
        .single();
        
      if (error) throw error;
      
      // Get transaction details
      if (data.shift && data.shift.id) {
        const { data: transactionData, error: transactionError } = await supabase
          .from('transactions')
          .select('*')
          .eq('shift_id', data.shift.id);
          
        if (transactionError) throw transactionError;
        
        return {
          ...data,
          transactions: transactionData
        };
      }
      
      return data;
    },
    enabled: !!id,
  });

  const resolveMismatchMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('No mismatch ID provided');
      if (!resolutionNotes.trim()) throw new Error('Resolution notes are required');
      
      return await resolveSalesMismatch(id, resolutionNotes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-mismatch', id] });
      queryClient.invalidateQueries({ queryKey: ['sales-mismatches'] });
      toast.success('Sales mismatch resolved successfully');
    },
    onError: (error: any) => {
      console.error('Error resolving sales mismatch:', error);
      toast.error(error.message || 'Failed to resolve sales mismatch');
    }
  });

  const handleResolveMismatch = async () => {
    if (!resolutionNotes.trim()) {
      toast.error('Please provide resolution notes');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await resolveMismatchMutation.mutateAsync();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    toast.error('Failed to load sales mismatch details');
    console.error('Error loading sales mismatch details:', error);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!mismatch) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-lg font-medium">Mismatch not found</div>
        <p className="text-muted-foreground text-center max-w-md">
          The requested sales mismatch record could not be found.
        </p>
        <Button onClick={() => navigate('/sales-mismatches')}>
          Back to Mismatches
        </Button>
      </div>
    );
  }

  const difference = Number(mismatch.mismatch_amount);
  const isPositive = difference > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button
          variant="ghost"
          onClick={() => navigate('/sales-mismatches')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales Mismatch Details</h1>
          <p className="text-muted-foreground">
            {format(parseISO(mismatch.created_at), 'MMMM d, yyyy')} - {mismatch.shift?.employee?.full_name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Mismatch Summary</span>
              <Badge variant={mismatch.is_resolved ? 'outline' : 'destructive'}>
                {mismatch.is_resolved ? 'Resolved' : 'Unresolved'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Expected Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">${Number(mismatch.expected_amount).toFixed(2)}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Actual Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">${Number(mismatch.actual_amount).toFixed(2)}</p>
                </CardContent>
              </Card>
              
              <Card className={isPositive ? 'border-emerald-200 dark:border-emerald-800' : 'border-red-200 dark:border-red-800'}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Difference</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {isPositive ? '+' : ''}{difference.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isPositive ? 'Surplus' : 'Deficit'}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md">
              <h3 className="font-medium mb-2">Shift Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Employee</p>
                  <p className="font-medium">{mismatch.shift?.employee?.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Station</p>
                  <p className="font-medium">{mismatch.shift?.station?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Shift Start</p>
                  <p className="font-medium">
                    {format(parseISO(mismatch.shift?.start_time), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Shift End</p>
                  <p className="font-medium">
                    {mismatch.shift?.end_time 
                      ? format(parseISO(mismatch.shift.end_time), 'MMM d, yyyy h:mm a')
                      : 'Not ended'}
                  </p>
                </div>
              </div>
            </div>
            
            {mismatch.is_resolved && (
              <div className={`p-4 rounded-md bg-muted`}>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-1">Resolution Notes</h3>
                    <p className="text-muted-foreground">{mismatch.resolution_notes}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {!mismatch.is_resolved && (
          <Card>
            <CardHeader>
              <CardTitle>Resolve Mismatch</CardTitle>
              <CardDescription>
                Provide an explanation for this discrepancy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter resolution notes here..."
                className="resize-none h-32"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={handleResolveMismatch} 
                disabled={!resolutionNotes.trim() || isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Mark as Resolved
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {mismatch.is_resolved && (
          <Card>
            <CardHeader>
              <CardTitle>Resolution Status</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center p-6">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-xl font-medium mb-2">Mismatch Resolved</h3>
              <p className="text-muted-foreground mb-4">
                This sales mismatch has been resolved and no further action is required.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Meter Readings</CardTitle>
            <CardDescription>
              Fuel dispensed during the shift
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!mismatch.shift?.meter_readings || mismatch.shift.meter_readings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No meter readings recorded for this shift.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dispenser</TableHead>
                    <TableHead>Fuel Type</TableHead>
                    <TableHead className="text-right">Start Reading</TableHead>
                    <TableHead className="text-right">End Reading</TableHead>
                    <TableHead className="text-right">Volume (L)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mismatch.shift.meter_readings.map((reading: any) => {
                    const volume = reading.end_reading && reading.start_reading 
                      ? reading.end_reading - reading.start_reading 
                      : null;
                      
                    return (
                      <TableRow key={reading.id}>
                        <TableCell>{reading.dispenser?.name || `Dispenser ${reading.dispenser_id}`}</TableCell>
                        <TableCell className="capitalize">{reading.fuel_type}</TableCell>
                        <TableCell className="text-right">{reading.start_reading}</TableCell>
                        <TableCell className="text-right">{reading.end_reading || 'Not recorded'}</TableCell>
                        <TableCell className="text-right">
                          {volume !== null ? volume.toFixed(2) : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              Sales recorded during the shift
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!mismatch.transactions || mismatch.transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transactions recorded for this shift.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mismatch.transactions.map((transaction: any) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{format(parseISO(transaction.created_at), 'h:mm a')}</TableCell>
                      <TableCell className="capitalize">{transaction.payment_method}</TableCell>
                      <TableCell className="text-right">${Number(transaction.total_amount).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      
      {isPositive && (
        <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-md flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-amber-800 dark:text-amber-300 mb-1">Cash Surplus Detected</h3>
            <p className="text-amber-700 dark:text-amber-400">
              The actual sales amount exceeds the expected amount by ${Math.abs(difference).toFixed(2)}. 
              This could be due to over-payment, errors in transaction recording, or incorrect meter readings.
            </p>
          </div>
        </div>
      )}
      
      {!isPositive && difference !== 0 && (
        <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-md flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-800 dark:text-red-300 mb-1">Cash Deficit Detected</h3>
            <p className="text-red-700 dark:text-red-400">
              The actual sales amount is less than the expected amount by ${Math.abs(difference).toFixed(2)}. 
              This could be due to under-payment, errors in transaction recording, or incorrect meter readings.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
