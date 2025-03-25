
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { format, subDays } from 'date-fns';
import { Activity, Eye, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { ActivityLog } from '@/lib/supabase';

export default function ActivityLogPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined);
  const [entityType, setEntityType] = useState<string | undefined>(undefined);
  const [actionType, setActionType] = useState<string | undefined>(undefined);

  // Set default date range to last 7 days
  useEffect(() => {
    const today = new Date();
    const sevenDaysAgo = subDays(today, 7);
    
    setDateRange({
      from: sevenDaysAgo,
      to: today
    });
  }, []);

  const { data: activityLogs, isLoading, error, refetch } = useQuery({
    queryKey: ['activity-logs', dateRange, entityType, actionType],
    queryFn: async () => {
      // Only Super Admin can access this page
      if (user?.role !== UserRole.SUPER_ADMIN) {
        throw new Error('Unauthorized');
      }
      
      let query = supabase
        .from('activity_logs')
        .select(`
          *,
          user:profiles!activity_logs_user_id_fkey(id, full_name, email, role)
        `)
        .order('created_at', { ascending: false });
        
      if (dateRange?.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }
      
      if (dateRange?.to) {
        query = query.lte('created_at', dateRange.to.toISOString());
      }
      
      if (entityType) {
        query = query.eq('entity_type', entityType);
      }
      
      if (actionType) {
        query = query.eq('action', actionType);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as (ActivityLog & { user: any })[];
    },
    enabled: !!user && user.role === UserRole.SUPER_ADMIN,
  });

  // Get unique entity types and actions for filters
  const getUniqueEntityTypes = () => {
    if (!activityLogs) return [];
    
    const entityTypes = new Set<string>();
    activityLogs.forEach(log => entityTypes.add(log.entity_type));
    
    return Array.from(entityTypes).sort();
  };

  const getUniqueActions = () => {
    if (!activityLogs) return [];
    
    const actions = new Set<string>();
    activityLogs.forEach(log => actions.add(log.action));
    
    return Array.from(actions).sort();
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'default';
      case 'update':
        return 'secondary';
      case 'delete':
        return 'destructive';
      case 'start':
      case 'end':
        return 'outline';
      default:
        return 'default';
    }
  };

  if (error) {
    toast.error('Failed to load activity logs');
    console.error('Error loading activity logs:', error);
  }

  // Access control - only Super Admin should see this
  if (user?.role !== UserRole.SUPER_ADMIN) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <div className="text-2xl font-bold">Access Denied</div>
        <p className="text-muted-foreground text-center max-w-md">
          Only Super Admins can access the activity logs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Logs</h1>
          <p className="text-muted-foreground">
            Track and monitor user activities across the system
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
          <CardTitle>System Activity</CardTitle>
          <CardDescription>
            Audit trail of all user actions in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Date Range</label>
              <DatePickerWithRange value={dateRange} onChange={setDateRange} />
            </div>
            <div className="w-full md:w-48">
              <label className="text-sm font-medium mb-1 block">Entity Type</label>
              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger>
                  <SelectValue placeholder="All entity types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={undefined}>All entity types</SelectItem>
                  {getUniqueEntityTypes().map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <label className="text-sm font-medium mb-1 block">Action</label>
              <Select value={actionType} onValueChange={setActionType}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={undefined}>All actions</SelectItem>
                  {getUniqueActions().map(action => (
                    <SelectItem key={action} value={action}>{action}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !activityLogs || activityLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <Activity className="h-12 w-12 text-muted-foreground" />
              <div className="text-lg font-medium">No activity logs found</div>
              <p className="text-muted-foreground text-center max-w-md">
                No activity logs matching the selected filters.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{log.user?.full_name || 'Unknown'}</span>
                          <span className="text-xs text-muted-foreground">{log.user?.role || ''}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">
                        {log.entity_type.replace('_', ' ')}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate">
                          {log.details 
                            ? typeof log.details === 'string' 
                              ? log.details 
                              : JSON.stringify(log.details) 
                            : '-'}
                        </div>
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
