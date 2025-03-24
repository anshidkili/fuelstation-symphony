
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
import { Loader2, Clock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  employee_id: z.string().min(1, { message: "Employee is required" }),
  start_time: z.string().min(1, { message: "Start time is required" }),
  end_time: z.string().optional(),
  dispensers: z.array(z.string()).min(1, { message: "At least one dispenser must be selected" }),
  starting_cash: z.coerce.number().min(0, { message: "Starting cash amount is required" }),
  ending_cash: z.coerce.number().optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "completed", "cancelled"]),
});

type FormData = z.infer<typeof formSchema>;

export default function ShiftForm() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = id !== "new";
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEditMode);
  const [employees, setEmployees] = useState<any[]>([]);
  const [dispensers, setDispensers] = useState<any[]>([]);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employee_id: "",
      start_time: new Date().toISOString().slice(0, 16),
      end_time: "",
      dispensers: [],
      starting_cash: 0,
      ending_cash: undefined,
      notes: "",
      status: "active",
    },
  });

  const isAdmin = user?.role === UserRole.ADMIN;
  const isEmployee = user?.role === UserRole.EMPLOYEE;

  useEffect(() => {
    if (!user || (!isAdmin && !isEmployee)) {
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
          .select("id, full_name")
          .eq("role", "Employee")
          .eq("station_id", user.station_id)
          .eq("status", "active");

        if (error) throw error;
        
        setEmployees(data || []);
      } catch (error: any) {
        toast.error(`Error fetching employees: ${error.message}`);
      }
    };

    const fetchDispensers = async () => {
      if (!user?.station_id) return;
      
      try {
        const { data, error } = await supabase
          .from("dispensers")
          .select("id, name")
          .eq("station_id", user.station_id)
          .eq("status", "active");

        if (error) throw error;
        
        setDispensers(data || []);
      } catch (error: any) {
        toast.error(`Error fetching dispensers: ${error.message}`);
      }
    };

    if (isAdmin) {
      fetchEmployees();
      fetchDispensers();
    } else if (isEmployee) {
      // For employees, just fetch dispensers they can choose from
      fetchDispensers();
    }
  }, [user]);

  useEffect(() => {
    const fetchShift = async () => {
      if (!isEditMode) {
        setFetchingData(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("shifts")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        if (data) {
          // Need to format the date-time to a format compatible with the HTML input
          const startTime = data.start_time ? new Date(data.start_time).toISOString().slice(0, 16) : "";
          const endTime = data.end_time ? new Date(data.end_time).toISOString().slice(0, 16) : "";
          
          form.reset({
            employee_id: data.employee_id || (isEmployee ? user?.id : ""),
            start_time: startTime,
            end_time: endTime,
            dispensers: data.dispensers || [],
            starting_cash: data.starting_cash || 0,
            ending_cash: data.ending_cash,
            notes: data.notes || "",
            status: data.status as "active" | "completed" | "cancelled",
          });
        }
      } catch (error: any) {
        toast.error(`Error fetching shift: ${error.message}`);
      } finally {
        setFetchingData(false);
      }
    };

    fetchShift();
  }, [id, isEditMode, form, user, isEmployee]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);

    try {
      const shiftData: any = {
        ...data,
        station_id: user?.station_id,
      };
      
      // If employee is adding a shift, set their ID
      if (isEmployee) {
        shiftData.employee_id = user?.id;
      }

      if (isEditMode) {
        const { error } = await supabase
          .from("shifts")
          .update(shiftData)
          .eq("id", id);

        if (error) throw error;

        toast.success("Shift updated successfully");
      } else {
        const { error } = await supabase
          .from("shifts")
          .insert(shiftData);

        if (error) throw error;

        toast.success("Shift created successfully");
      }

      navigate("/shifts");
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
            {isEditMode ? "Edit Shift" : "Create Shift"}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode
              ? "Update shift details and readings"
              : "Add a new shift record"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Shift Information</CardTitle>
              <CardDescription>
                Enter basic shift information
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              {isAdmin && (
                <FormField
                  control={form.control}
                  name="employee_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isEmployee}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select employee" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.map((employee) => (
                              <SelectItem key={employee.id} value={employee.id}>
                                {employee.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormDescription>
                      Leave blank for active shifts
                    </FormDescription>
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
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dispensers & Cash</CardTitle>
              <CardDescription>
                Select assigned dispensers and cash handling information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="dispensers"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Assigned Dispensers</FormLabel>
                      <FormDescription>
                        Select the dispensers assigned for this shift
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {dispensers.map((dispenser) => (
                        <FormField
                          key={dispenser.id}
                          control={form.control}
                          name="dispensers"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={dispenser.id}
                                className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(dispenser.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, dispenser.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== dispenser.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {dispenser.name}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="starting_cash"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Starting Cash</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ending_cash"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ending Cash</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          {...field} 
                          value={field.value === undefined ? "" : field.value} 
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Leave blank for active shifts
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter any additional notes for this shift..." 
                        className="min-h-32" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/shifts")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditMode ? "Update Shift" : "Create Shift"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
