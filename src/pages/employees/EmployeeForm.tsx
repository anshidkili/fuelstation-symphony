
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/lib/constants";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  full_name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  contact_number: z.string().min(10, {
    message: "Phone number must be at least 10 characters.",
  }).optional(),
  hourly_rate: z.coerce.number().min(1, {
    message: "Hourly rate must be at least 1.",
  }).optional(),
  address: z.string().min(5, {
    message: "Address must be at least 5 characters.",
  }).optional(),
  status: z.enum(["active", "inactive", "pending"]),
});

type FormData = z.infer<typeof formSchema>;

export default function EmployeeForm() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = id !== "new";
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEditMode);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      email: "",
      contact_number: "",
      hourly_rate: undefined,
      address: "",
      status: "pending",
    },
  });

  useEffect(() => {
    // Only Admin can access this page
    if (user && user.role !== UserRole.ADMIN) {
      navigate("/");
      toast.error("You don't have permission to access this page");
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!isEditMode) {
        setFetchingData(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        if (data) {
          form.reset({
            full_name: data.full_name || "",
            email: data.email || "",
            contact_number: data.contact_number || "",
            hourly_rate: data.hourly_rate,
            address: data.address || "",
            status: data.status as "active" | "inactive" | "pending",
          });
        }
      } catch (error: any) {
        toast.error(`Error fetching employee: ${error.message}`);
      } finally {
        setFetchingData(false);
      }
    };

    fetchEmployee();
  }, [id, isEditMode, form]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);

    try {
      if (isEditMode) {
        const { error } = await supabase
          .from("profiles")
          .update({
            full_name: data.full_name,
            email: data.email,
            contact_number: data.contact_number,
            hourly_rate: data.hourly_rate,
            address: data.address,
            status: data.status,
          })
          .eq("id", id);

        if (error) throw error;

        toast.success("Employee updated successfully");
      } else {
        // For new employees, we need to create a user in Auth first
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: Math.random().toString(36).slice(-8), // Generate a random password
          options: {
            data: {
              full_name: data.full_name,
              role: "Employee",
            },
          },
        });

        if (authError) throw authError;

        // The trigger will create a profile, but we need to update it with the additional info
        // and associate it with the current station
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            contact_number: data.contact_number,
            hourly_rate: data.hourly_rate,
            address: data.address,
            station_id: user?.station_id,
            status: data.status,
          })
          .eq("user_id", authData.user?.id);

        if (updateError) throw updateError;

        toast.success("Employee created successfully");
        toast.info("A confirmation email has been sent to the employee");
      }

      navigate("/employees");
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditMode ? "Edit Employee" : "Create Employee"}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode
              ? "Update employee details and settings"
              : "Add a new employee to your station"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="employee@fuelsymphony.com" 
                      type="email"
                      disabled={isEditMode} // Cannot change email for existing employee
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number</FormLabel>
                  <FormControl>
                    <Input placeholder="555-1234" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hourly_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hourly Rate ($)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="15.00" 
                      type="number" 
                      step="0.01"
                      {...field} 
                      value={field.value || ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main Street, Cityville" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/employees")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditMode ? "Update Employee" : "Create Employee"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
