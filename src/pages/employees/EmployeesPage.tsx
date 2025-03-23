
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
import { Edit, MoreHorizontal, Plus, Users } from "lucide-react";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only Admin can access this page
    if (user && user.role !== UserRole.ADMIN) {
      navigate("/");
      toast.error("You don't have permission to access this page");
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!user?.station_id) return;
      
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("role", "Employee")
          .eq("station_id", user.station_id)
          .order("full_name");

        if (error) throw error;
        
        setEmployees(data || []);
      } catch (error: any) {
        toast.error(`Error fetching employees: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [user]);

  const handleCreateEmployee = () => {
    navigate("/employees/new");
  };

  const handleEditEmployee = (id: string) => {
    navigate(`/employees/${id}`);
  };

  const updateEmployeeStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      setEmployees(
        employees.map((employee) =>
          employee.id === id ? { ...employee, status } : employee
        )
      );

      toast.success(`Employee ${status === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      toast.error(`Error updating employee: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">
            Manage employees at your fuel station
          </p>
        </div>
        <Button onClick={handleCreateEmployee}>
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : employees.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No employees found</h3>
          <p className="text-sm text-muted-foreground">
            Get started by creating a new employee
          </p>
          <Button onClick={handleCreateEmployee} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Station Employees</CardTitle>
            <CardDescription>
              View and manage employees for your station
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Hourly Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.full_name}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.contact_number || "—"}</TableCell>
                    <TableCell>
                      {employee.hourly_rate ? `$${employee.hourly_rate.toFixed(2)}` : "—"}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            employee.status === "active"
                              ? "bg-green-500"
                              : employee.status === "pending"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          } mr-2`}
                        />
                        {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                      </span>
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
                          <DropdownMenuItem onClick={() => handleEditEmployee(employee.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {employee.status === "active" ? (
                            <DropdownMenuItem
                              onClick={() => updateEmployeeStatus(employee.id, "inactive")}
                              className="text-red-500"
                            >
                              Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => updateEmployeeStatus(employee.id, "active")}
                              className="text-green-500"
                            >
                              Activate
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
