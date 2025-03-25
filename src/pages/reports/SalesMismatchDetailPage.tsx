
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  CardFooter,
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
import { format } from 'date-fns';
import { toast } from 'sonner';
import { getSalesMismatch, resolveSalesMismatch } from '@/services/financeService';
import { supabase } from '@/integrations/supabase/client';

export default function SalesMismatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [resolutionNote, setResolutionNote] = useState('');

  const {
    data: mismatch,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['sales-mismatch', id],
    queryFn: async () => {
      if (!id) return null;
      
      const result = await getSalesMismatch(id);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.mismatch;
    },
    enabled: !!id,
  });

  // Get transactions for this shift
  const { data: transactions } = useQuery({
    queryKey: ['shift-transactions', mismatch?.shift_id],
    queryFn: async () => {
      if (!mismatch?.shift_id) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('shift_id', mismatch.shift_id);
      
      if (error) {
        throw error;
      }
      
      return data || [];
    },
    enabled: !!mismatch?.shift_id,
  });

  // Get meter readings for this shift
  const { data: meterReadings } = useQuery({
    queryKey: ['shift-meter-readings', mismatch?.shift_id],
    queryFn: async () => {
      if (!mismatch?.shift_id) return [];
      
      const { data, error } = await supabase
        .from('meter_readings')
        .select('*, dispensers(name, fuel_type)')
        .eq('shift_id', mismatch.shift_id);
      
      if (error) {
        throw error;
      }
      
      return data || [];
    },
    enabled: !!mismatch?.shift_id,
  });

  // Handle error
  if (error) {
    toast.error('Failed to load sales mismatch details');
    console.error('Error loading sales mismatch:', error);
  }

  // Access control - only Admin and Employee should see this
  if (user?.role !== UserRole.ADMIN && user?.role !== UserRole.EMPLOYEE) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <div className="text-2xl font-bold">Access Denied</div>
        <p className="text-muted-foreground text-center max-w-md">
          You don't have permission to access the sales mismatch details.
        </p>
      </div>
    );
  }

  const handleResolve = async () => {
    if (!id || !user || !resolutionNote.trim()) {
      toast.error('Please enter a resolution note');
      return;
    }
    
    const result = await resolveSalesMismatch(id, user.id, resolutionNote);
    
    if (result.success) {
      toast.success('Sales mismatch resolved successfully');
      refetch();
    } else {
      toast.error(`Failed to resolve mismatch: ${result.error}`);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!mismatch) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-lg font-medium">Sales mismatch not found</div>
        <Button variant="outline" onClick={() => navigate('/sales-mismatches')}>
          Back to Sales Mismatches
        </Button>
      </div>
    );
  }

  const isPositive = mismatch.mismatch_amount > 0;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales Mismatch Details</h1>
          <p className="text-muted-foreground">
            Review and resolve discrepancies between expected and actual sales
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/sales-mismatches')}>
            Back to Sales Mismatches
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mismatch Summary</CardTitle>
            <CardDescription>
              Overview of the sales discrepancy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date</p>
                <p className="text-lg">{format(new Date(mismatch.created_at), 'MMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge className="mt-1" variant={mismatch.is_resolved ? 'outline' : 'destructive'}>
                  {mismatch.is_resolved ? 'Resolved' : 'Unresolved'}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Attendant</p>
                <p className="text-lg">{mismatch.shifts?.profiles?.full_name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Shift ID</p>
                <p className="text-lg font-mono text-xs">{mismatch.shift_id}</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Expected Amount</p>
                  <p className="text-xl font-semibold">{formatCurrency(mismatch.expected_amount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Actual Amount</p>
                  <p className="text-xl font-semibold">{formatCurrency(mismatch.actual_amount)}</p>
                </div>
              </div>
              
              <div className="mt-6 p-4 rounded-md bg-muted">
                <p className="text-sm font-medium text-muted-foreground">Difference</p>
                <p className={`text-2xl font-bold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {isPositive ? '+' : ''}{formatCurrency(mismatch.mismatch_amount)}
                  <span className="text-sm font-normal ml-2">
                    {isPositive ? '(Surplus)' : '(Deficit)'}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {mismatch.is_resolved ? (
          <Card>
            <CardHeader>
              <CardTitle>Resolution Details</CardTitle>
              <CardDescription>
                This mismatch has been resolved
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved By</p>
                <p className="text-lg">{mismatch.resolved_by || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolution Date</p>
                <p className="text-lg">{format(new Date(mismatch.updated_at), 'MMM d, yyyy')}</p>
              </div>
              <div className="pt-4">
                <p className="text-sm font-medium text-muted-foreground">Resolution Note</p>
                <div className="mt-2 p-3 rounded-md bg-muted">
                  <p className="whitespace-pre-wrap">{mismatch.resolution_note || 'No notes provided'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Resolve Mismatch</CardTitle>
              <CardDescription>
                Provide details about why this mismatch occurred
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter explanation and resolution details..."
                className="min-h-[150px]"
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
              />
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleResolve} 
                disabled={!resolutionNote.trim()}
                className="w-full"
              >
                Mark as Resolved
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Meter Readings</CardTitle>
            <CardDescription>
              Dispenser readings for this shift
            </CardDescription>
          </CardHeader>
          <CardContent>
            {meterReadings && meterReadings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dispenser</TableHead>
                    <TableHead>Fuel Type</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Volume</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meterReadings.map((reading) => (
                    <TableRow key={reading.id}>
                      <TableCell>{reading.dispensers?.name || 'Unknown'}</TableCell>
                      <TableCell>{reading.dispensers?.fuel_type || 'Unknown'}</TableCell>
                      <TableCell>{reading.start_reading}</TableCell>
                      <TableCell>{reading.end_reading}</TableCell>
                      <TableCell>
                        {(reading.end_reading - reading.start_reading).toFixed(2)} L
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No meter readings found for this shift
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              Sales transactions during this shift
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions && transactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{format(new Date(tx.created_at), 'HH:mm')}</TableCell>
                      <TableCell>{tx.transaction_type}</TableCell>
                      <TableCell>{tx.payment_method}</TableCell>
                      <TableCell>{formatCurrency(tx.total_amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No transactions found for this shift
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
