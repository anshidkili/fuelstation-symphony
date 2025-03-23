
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/lib/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Edit, MoreHorizontal, Plus, UserCog } from "lucide-react";

export default function AdminsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only Super Admin can access this page
    if (user && user.role !== UserRole.SUPER_ADMIN) {
      navigate("/");
      toast.error("You don't have permission to access this page");
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select(`
            *,
            stations(
              name
            )
          `)
          .eq("role", "Admin")
          .order("full_name");

        if (error) throw error;
        
        setAdmins(data || []);
      } catch (error: any) {
        toast.error(`Error fetching admins: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, []);

  const handleCreateAdmin = () => {
    navigate("/admins/new");
  };

  const handleEditAdmin = (id: string) => {
    navigate(`/admins/${id}`);
  };

  const updateAdminStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      setAdmins(
        admins.map((admin) =>
          admin.id === id ? { ...admin, status } : admin
        )
      );

      toast.success(`Admin ${status === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      toast.error(`Error updating admin: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admins</h1>
          <p className="text-muted-foreground">
            Manage station administrators across your network
          </p>
        </div>
        <Button onClick={handleCreateAdmin}>
          <Plus className="mr-2 h-4 w-4" />
          Add Admin
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : admins.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <UserCog className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No admins found</h3>
          <p className="text-sm text-muted-foreground">
            Get started by creating a new admin
          </p>
          <Button onClick={handleCreateAdmin} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Add Admin
          </Button>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Station Administrators</CardTitle>
            <CardDescription>
              View and manage administrators for all stations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.full_name}</TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>{admin.stations?.name || "Not assigned"}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            admin.status === "active"
                              ? "bg-green-500"
                              : admin.status === "pending"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          } mr-2`}
                        />
                        {admin.status.charAt(0).toUpperCase() + admin.status.slice(1)}
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
                          <DropdownMenuItem onClick={() => handleEditAdmin(admin.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {admin.status === "active" ? (
                            <DropdownMenuItem
                              onClick={() => updateAdminStatus(admin.id, "inactive")}
                              className="text-red-500"
                            >
                              Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => updateAdminStatus(admin.id, "active")}
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
