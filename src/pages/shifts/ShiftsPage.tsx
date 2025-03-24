
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/lib/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Clock, Edit, MoreHorizontal, Plus, CalendarCheck, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const isAdmin = user?.role === UserRole.ADMIN;
  const isEmployee = user?.role === UserRole.EMPLOYEE;

  useEffect(() => {
    if (!user || (!isAdmin && !isEmployee)) {
      navigate("/");
      toast.error("You don't have permission to access this page");
      return;
    }

    const fetchShifts = async () => {
      try {
        let query = supabase
          .from("shifts")
          .select(`
            *,
            profiles(full_name),
            meter_readings(*)
          `)
          .order("start_time", { ascending: false });
        
        // If admin, get all shifts for their station
        if (isAdmin && user.station_id) {
          query = query.eq("station_id", user.station_id);
        }
        
        // If employee, only get their shifts
        if (isEmployee) {
          query = query.eq("employee_id", user.id);
        }

        const { data, error } = await query;

        if (error) throw error;
        
        setShifts(data || []);
      } catch (error: any) {
        toast.error(`Error fetching shifts: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchShifts();
  }, [user, navigate, isAdmin, isEmployee]);

  const handleCreateShift = () => {
    navigate("/shifts/new");
  };

  const handleEditShift = (id: string) => {
    navigate(`/shifts/${id}`);
  };

  const handleViewMeterReadings = (id: string) => {
    navigate(`/meter-readings/${id}`);
  };

  // Calculate duration between start and end time
  const calculateDuration = (startTime: string, endTime?: string) => {
    if (!endTime) return "Ongoing";
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    
    // Convert to hours and minutes
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "MMM dd, yyyy h:mm a");
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "completed":
        return <Badge className="bg-blue-500">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shifts</h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? "Manage employee shifts and track work hours" 
              : "View and manage your work shifts"}
          </p>
        </div>
        <Button onClick={handleCreateShift}>
          <Plus className="mr-2 h-4 w-4" />
          {isAdmin ? "Create Shift" : "Start Shift"}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : shifts.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <Clock className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No shifts found</h3>
          <p className="text-sm text-muted-foreground">
            {isAdmin 
              ? "Get started by creating a new shift for an employee" 
              : "Get started by creating a new shift"}
          </p>
          <Button onClick={handleCreateShift} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            {isAdmin ? "Create Shift" : "Start Shift"}
          </Button>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {isAdmin ? "Employee Shifts" : "My Shifts"}
            </CardTitle>
            <CardDescription>
              {isAdmin 
                ? "View and manage all employee shifts" 
                : "Track your work hours and shifts"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {isAdmin && <TableHead>Employee</TableHead>}
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cash Handling</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shifts.map((shift) => (
                  <TableRow key={shift.id}>
                    {isAdmin && (
                      <TableCell className="font-medium">{shift.profiles?.full_name}</TableCell>
                    )}
                    <TableCell>{formatDate(shift.start_time)}</TableCell>
                    <TableCell>{formatDate(shift.end_time) || "Ongoing"}</TableCell>
                    <TableCell>{calculateDuration(shift.start_time, shift.end_time)}</TableCell>
                    <TableCell>{getStatusBadge(shift.status)}</TableCell>
                    <TableCell>
                      {shift.starting_cash && (
                        <div className="flex flex-col text-sm">
                          <span>Start: ${shift.starting_cash.toFixed(2)}</span>
                          {shift.ending_cash && <span>End: ${shift.ending_cash.toFixed(2)}</span>}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem onClick={() => handleEditShift(shift.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Shift
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => handleViewMeterReadings(shift.id)}>
                            <CalendarCheck className="mr-2 h-4 w-4" />
                            Meter Readings
                          </DropdownMenuItem>
                          
                          {shift.status === "active" && (
                            <DropdownMenuItem 
                              onClick={() => handleEditShift(shift.id)}
                              className="text-green-600"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Complete Shift
                            </DropdownMenuItem>
                          )}
                          
                          {shift.status === "active" && (
                            <DropdownMenuItem 
                              onClick={() => handleEditShift(shift.id)}
                              className="text-red-600"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancel Shift
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
