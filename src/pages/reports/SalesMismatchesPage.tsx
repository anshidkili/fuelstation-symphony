
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { getSalesMismatches } from '@/services/financeService';

export default function SalesMismatchesPage() {
  const { user } = useAuth();
  const [stationId, setStationId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (user?.station_id) {
      setStationId(user.station_id);
    }
  }, [user]);

  const { data: mismatches, isLoading, error, refetch } = useQuery({
    queryKey: ['sales-mismatches', stationId, filter],
    queryFn: async () => {
      if (!stationId) return null;
      
      let resolved: boolean | undefined;
      if (filter === 'resolved') {
        resolved = true;
      } else if (filter === 'unresolved') {
        resolved = false;
      }
      
      const result = await getSalesMismatches(stationId, resolved);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.mismatches;
    },
    enabled: !!stationId,
  });

  if (error) {
    toast.error('Failed to load sales mismatches');
    console.error('Error loading sales mismatches:', error);
  }

  // Access control - only Admin and Employee should see this
  if (user?.role !== UserRole.ADMIN && user?.role !== UserRole.EMPLOYEE) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <div className="text-2xl font-bold">Access Denied</div>
        <p className="text-muted-foreground text-center max-w-md">
          You don't have permission to access the sales mismatch tracker.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales Mismatches</h1>
          <p className="text-muted-foreground">
            Track and resolve discrepancies between expected and actual sales
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
          <CardTitle>Sales Mismatch Tracker</CardTitle>
          <CardDescription>
            Monitor and manage discrepancies in sales amounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-6">
            <div className="w-48">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All mismatches</SelectItem>
                  <SelectItem value="unresolved">Unresolved only</SelectItem>
                  <SelectItem value="resolved">Resolved only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !mismatches || mismatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <div className="text-lg font-medium">No mismatches found</div>
              <p className="text-muted-foreground text-center max-w-md">
                {filter === 'all' 
                  ? 'No sales mismatches have been detected.' 
                  : filter === 'unresolved'
                  ? 'No unresolved sales mismatches found.'
                  : 'No resolved sales mismatches found.'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Expected ($)</TableHead>
                    <TableHead>Actual ($)</TableHead>
                    <TableHead>Difference ($)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mismatches.map((mismatch) => {
                    const difference = Number(mismatch.mismatch_amount);
                    const isPositive = difference > 0;
                    
                    return (
                      <TableRow key={mismatch.id}>
                        <TableCell>
                          {format(new Date(mismatch.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          {mismatch.shifts?.profiles?.full_name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {Number(mismatch.expected_amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {Number(mismatch.actual_amount).toFixed(2)}
                        </TableCell>
                        <TableCell className={isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                          {isPositive ? '+' : ''}{difference.toFixed(2)}
                          {difference !== 0 && (
                            <span className="ml-1 inline-block">
                              {isPositive ? '(surplus)' : '(deficit)'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={mismatch.is_resolved ? 'outline' : 'destructive'}>
                            {mismatch.is_resolved ? 'Resolved' : 'Unresolved'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/sales-mismatches/${mismatch.id}`}>
                              {mismatch.is_resolved ? 'View Details' : 'Resolve'}
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {mismatches && mismatches.filter(m => !m.is_resolved).length > 0 && (
            <div className="mt-4 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md flex items-start gap-2 text-amber-800 dark:text-amber-300 text-sm">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Unresolved sales mismatches</p>
                <p className="text-amber-700 dark:text-amber-400">
                  There {mismatches.filter(m => !m.is_resolved).length === 1 ? 'is' : 'are'} {mismatches.filter(m => !m.is_resolved).length} unresolved sales {mismatches.filter(m => !m.is_resolved).length === 1 ? 'mismatch' : 'mismatches'} that {mismatches.filter(m => !m.is_resolved).length === 1 ? 'needs' : 'need'} attention.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
