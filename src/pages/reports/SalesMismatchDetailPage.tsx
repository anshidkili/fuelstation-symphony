
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { format } from 'date-fns';
import { ArrowLeft, CheckCircle, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getSalesMismatch, resolveSalesMismatch, SalesMismatch } from '@/services/financeService';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function SalesMismatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [resolutionNote, setResolutionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: mismatch, isLoading, error, refetch } = useQuery({
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

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    if (!id || !resolutionNote) {
      toast.error('Please enter a resolution note');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await resolveSalesMismatch(id, user?.id || 'system', resolutionNote);
      
      if (result.success) {
        toast.success('Mismatch resolved successfully');
        refetch();
      } else {
        toast.error('Failed to resolve mismatch');
      }
    } catch (error) {
      console.error('Error resolving mismatch:', error);
      toast.error('Failed to resolve mismatch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const { data: dispenserDetails, isLoading: loadingDispenser } = useQuery({
    queryKey: ['dispenser-details', mismatch?.shifts?.dispensers?.[0]],
    queryFn: async () => {
      if (!mismatch?.shifts?.dispensers?.[0]) return null;
      
      try {
        const { data, error } = await supabase
          .from('dispensers')
          .select('name')
          .eq('id', mismatch.shifts.dispensers[0])
          .single();
        
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error fetching dispenser details:', error);
        return { name: 'Unknown Dispenser' };
      }
    },
    enabled: !!mismatch?.shifts?.dispensers?.[0],
  });

  if (error) {
    toast.error('Failed to load mismatch details');
    console.error('Error loading mismatch details:', error);
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
          The requested sales mismatch could not be found.
        </p>
        <Button onClick={() => navigate('/reports/sales-mismatches')}>
          Back to Mismatches
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button
          variant="ghost"
          onClick={() => navigate('/reports/sales-mismatches')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales Mismatch Details</h1>
          <p className="text-muted-foreground">
            Details of the sales mismatch for shift {mismatch.shift_id}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Mismatch Information</CardTitle>
            <CardDescription>
              Details of the sales discrepancy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Shift ID</p>
                <p className="font-medium">{mismatch.shift_id}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Reported By</p>
                <p className="font-medium">{mismatch.shifts?.profiles?.full_name || 'Unknown'}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">
                  {format(new Date(mismatch.created_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Expected Amount</p>
                <p className="font-medium">${Number(mismatch.expected_amount).toFixed(2)}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Actual Amount</p>
                <p className="font-medium">${Number(mismatch.actual_amount).toFixed(2)}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Mismatch Amount</p>
                <p className="font-medium">${Number(mismatch.mismatch_amount).toFixed(2)}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                {mismatch.is_resolved ? (
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    Resolved
                  </div>
                ) : (
                  <div className="flex items-center">
                    <XCircle className="h-4 w-4 mr-2 text-red-500" />
                    Unresolved
                  </div>
                )}
              </div>
              
              {mismatch.is_resolved && (
                <div>
                  <p className="text-sm text-muted-foreground">Resolution Note</p>
                  <p className="font-medium">{mismatch.resolution_note}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Shift Details</CardTitle>
            <CardDescription>
              Information about the shift when the mismatch occurred
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Employee</p>
                <p className="font-medium">{mismatch.shifts?.profiles?.full_name || 'Unknown'}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Start Time</p>
                <p className="font-medium">
                  {mismatch.shifts?.start_time ? 
                    format(new Date(mismatch.shifts.start_time), 'MMM d, yyyy h:mm a') : 
                    'Unknown'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">End Time</p>
                <p className="font-medium">
                  {mismatch.shifts?.end_time ? 
                    format(new Date(mismatch.shifts.end_time), 'MMM d, yyyy h:mm a') : 
                    'Not Ended'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Station</p>
                <p className="font-medium">{mismatch.shifts?.station_id || 'Unknown'}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Dispenser</p>
                <p className="font-medium">{dispenserDetails?.name || 'Unknown Dispenser'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {!mismatch.is_resolved && (
        <Card>
          <CardHeader>
            <CardTitle>Resolve Mismatch</CardTitle>
            <CardDescription>
              Enter a resolution note to resolve this mismatch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Textarea 
                  placeholder="Resolution Note" 
                  value={resolutionNote} 
                  onChange={(e) => setResolutionNote(e.target.value)} 
                />
              </div>
              <Button disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Resolve Mismatch
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
