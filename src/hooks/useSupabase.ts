
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as service from "@/services/supabaseService";

export function useSupabase() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Station hooks
  const useStations = () => {
    return useQuery({
      queryKey: ['stations'],
      queryFn: service.stationService.getAllStations,
      enabled: !!user && user.role === 'Super Admin'
    });
  };

  const useStationDetails = (stationId: string) => {
    return useQuery({
      queryKey: ['station', stationId],
      queryFn: () => service.stationService.getStationById(stationId),
      enabled: !!stationId
    });
  };

  const useCreateStation = () => {
    return useMutation({
      mutationFn: service.stationService.createStation,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['stations'] });
        toast.success("Station created successfully");
      },
      onError: (error: any) => {
        toast.error(`Failed to create station: ${error.message}`);
      }
    });
  };

  const useUpdateStation = () => {
    return useMutation({
      mutationFn: ({ stationId, data }: { stationId: string, data: any }) => 
        service.stationService.updateStation(stationId, data),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['stations'] });
        queryClient.invalidateQueries({ queryKey: ['station', variables.stationId] });
        toast.success("Station updated successfully");
      },
      onError: (error: any) => {
        toast.error(`Failed to update station: ${error.message}`);
      }
    });
  };

  // User/Admin hooks
  const useAdmins = () => {
    return useQuery({
      queryKey: ['admins'],
      queryFn: service.userService.getAllAdmins,
      enabled: !!user && user.role === 'Super Admin'
    });
  };

  const useEmployees = (stationId: string) => {
    return useQuery({
      queryKey: ['employees', stationId],
      queryFn: () => service.userService.getEmployeesByStation(stationId),
      enabled: !!stationId && !!user && (user.role === 'Admin' || user.role === 'Super Admin')
    });
  };

  const useCustomers = (stationId: string) => {
    return useQuery({
      queryKey: ['customers', stationId],
      queryFn: () => service.userService.getCustomersByStation(stationId),
      enabled: !!stationId && !!user && (user.role === 'Admin' || user.role === 'Super Admin')
    });
  };

  const useUpdateUserStatus = () => {
    return useMutation({
      mutationFn: ({ userId, status }: { userId: string, status: 'active' | 'inactive' | 'pending' }) => 
        service.userService.updateUserStatus(userId, status),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admins'] });
        queryClient.invalidateQueries({ queryKey: ['employees'] });
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        toast.success("User status updated successfully");
      },
      onError: (error: any) => {
        toast.error(`Failed to update user status: ${error.message}`);
      }
    });
  };

  // Dispensers hooks
  const useDispensers = (stationId: string) => {
    return useQuery({
      queryKey: ['dispensers', stationId],
      queryFn: () => service.dispenserService.getDispensersByStation(stationId),
      enabled: !!stationId
    });
  };

  const useCreateDispenser = () => {
    return useMutation({
      mutationFn: service.dispenserService.createDispenser,
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['dispensers', data.data.station_id] });
        toast.success("Dispenser created successfully");
      },
      onError: (error: any) => {
        toast.error(`Failed to create dispenser: ${error.message}`);
      }
    });
  };

  // Inventory hooks
  const useFuelInventory = (stationId: string) => {
    return useQuery({
      queryKey: ['fuel_inventory', stationId],
      queryFn: () => service.inventoryService.getFuelInventoryByStation(stationId),
      enabled: !!stationId
    });
  };

  const useProducts = (stationId: string) => {
    return useQuery({
      queryKey: ['products', stationId],
      queryFn: () => service.inventoryService.getProductsByStation(stationId),
      enabled: !!stationId
    });
  };

  // Shifts hooks
  const useActiveShifts = (stationId: string) => {
    return useQuery({
      queryKey: ['active_shifts', stationId],
      queryFn: () => service.shiftService.getActiveShiftsByStation(stationId),
      enabled: !!stationId,
      refetchInterval: 60000 // Refetch every minute
    });
  };

  const useEmployeeShifts = (employeeId: string) => {
    return useQuery({
      queryKey: ['employee_shifts', employeeId],
      queryFn: () => service.shiftService.getShiftsByEmployee(employeeId),
      enabled: !!employeeId
    });
  };

  const useStartShift = () => {
    return useMutation({
      mutationFn: service.shiftService.startShift,
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['active_shifts', data.data.station_id] });
        queryClient.invalidateQueries({ queryKey: ['employee_shifts', data.data.employee_id] });
        toast.success("Shift started successfully");
      },
      onError: (error: any) => {
        toast.error(`Failed to start shift: ${error.message}`);
      }
    });
  };

  const useEndShift = () => {
    return useMutation({
      mutationFn: ({ shiftId, data }: { shiftId: string, data: any }) => 
        service.shiftService.endShift(shiftId, data),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['active_shifts'] });
        queryClient.invalidateQueries({ queryKey: ['employee_shifts'] });
        toast.success("Shift ended successfully");
      },
      onError: (error: any) => {
        toast.error(`Failed to end shift: ${error.message}`);
      }
    });
  };

  // Transaction hooks
  const useCreateTransaction = () => {
    return useMutation({
      mutationFn: ({ transaction, items }: { transaction: any, items: any[] }) => 
        service.transactionService.createTransaction(transaction, items),
      onSuccess: () => {
        toast.success("Transaction created successfully");
      },
      onError: (error: any) => {
        toast.error(`Failed to create transaction: ${error.message}`);
      }
    });
  };

  const useStationTransactions = (stationId: string, startDate: string, endDate: string) => {
    return useQuery({
      queryKey: ['transactions', stationId, startDate, endDate],
      queryFn: () => service.transactionService.getTransactionsByStation(stationId, startDate, endDate),
      enabled: !!stationId && !!startDate && !!endDate
    });
  };

  // Invoice hooks
  const useCreateInvoice = () => {
    return useMutation({
      mutationFn: ({ invoice, items }: { invoice: any, items: any[] }) => 
        service.invoiceService.createInvoice(invoice, items),
      onSuccess: () => {
        toast.success("Invoice created successfully");
      },
      onError: (error: any) => {
        toast.error(`Failed to create invoice: ${error.message}`);
      }
    });
  };

  const useCustomerInvoices = (customerId: string) => {
    return useQuery({
      queryKey: ['customer_invoices', customerId],
      queryFn: () => service.invoiceService.getInvoicesByCustomer(customerId),
      enabled: !!customerId
    });
  };

  const useStationInvoices = (stationId: string, startDate: string, endDate: string) => {
    return useQuery({
      queryKey: ['station_invoices', stationId, startDate, endDate],
      queryFn: () => service.invoiceService.getInvoicesByStation(stationId, startDate, endDate),
      enabled: !!stationId && !!startDate && !!endDate
    });
  };

  // Vehicle hooks
  const useCustomerVehicles = (customerId: string) => {
    return useQuery({
      queryKey: ['vehicles', customerId],
      queryFn: () => service.vehicleService.getVehiclesByCustomer(customerId),
      enabled: !!customerId
    });
  };

  const useCreateVehicle = () => {
    return useMutation({
      mutationFn: service.vehicleService.createVehicle,
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['vehicles', data.data.customer_id] });
        toast.success("Vehicle added successfully");
      },
      onError: (error: any) => {
        toast.error(`Failed to add vehicle: ${error.message}`);
      }
    });
  };

  // Expense hooks
  const useCreateExpense = () => {
    return useMutation({
      mutationFn: service.expenseService.createExpense,
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['expenses', data.data.station_id] });
        toast.success("Expense recorded successfully");
      },
      onError: (error: any) => {
        toast.error(`Failed to record expense: ${error.message}`);
      }
    });
  };

  const useStationExpenses = (stationId: string, startDate: string, endDate: string) => {
    return useQuery({
      queryKey: ['expenses', stationId, startDate, endDate],
      queryFn: () => service.expenseService.getExpensesByStation(stationId, startDate, endDate),
      enabled: !!stationId && !!startDate && !!endDate
    });
  };

  // Activity logs hooks
  const useActivityLogs = (filters: any = {}) => {
    return useQuery({
      queryKey: ['activity_logs', filters],
      queryFn: () => service.activityLogService.getLogs(filters),
      enabled: user?.role === 'Super Admin'
    });
  };

  // Reports hooks
  const useSalesReport = (stationId: string, startDate: string, endDate: string, groupBy: 'day' | 'month' | 'year') => {
    return useQuery({
      queryKey: ['sales_report', stationId, startDate, endDate, groupBy],
      queryFn: () => service.reportService.getSalesReport(stationId, startDate, endDate, groupBy),
      enabled: !!stationId && !!startDate && !!endDate
    });
  };

  const useFuelSalesBreakdown = (stationId: string, startDate: string, endDate: string) => {
    return useQuery({
      queryKey: ['fuel_sales_breakdown', stationId, startDate, endDate],
      queryFn: () => service.reportService.getFuelSalesBreakdown(stationId, startDate, endDate),
      enabled: !!stationId && !!startDate && !!endDate
    });
  };

  const useStationComparison = (startDate: string, endDate: string) => {
    return useQuery({
      queryKey: ['station_comparison', startDate, endDate],
      queryFn: () => service.reportService.getStationComparison(startDate, endDate),
      enabled: !!startDate && !!endDate && user?.role === 'Super Admin'
    });
  };

  const useFinancialSummary = (stationId: string, startDate: string, endDate: string) => {
    return useQuery({
      queryKey: ['financial_summary', stationId, startDate, endDate],
      queryFn: () => service.reportService.getFinancialSummary(stationId, startDate, endDate),
      enabled: !!stationId && !!startDate && !!endDate
    });
  };

  return {
    // Station hooks
    useStations,
    useStationDetails,
    useCreateStation,
    useUpdateStation,
    
    // User hooks
    useAdmins,
    useEmployees,
    useCustomers,
    useUpdateUserStatus,
    
    // Dispenser hooks
    useDispensers,
    useCreateDispenser,
    
    // Inventory hooks
    useFuelInventory,
    useProducts,
    
    // Shift hooks
    useActiveShifts,
    useEmployeeShifts,
    useStartShift,
    useEndShift,
    
    // Transaction hooks
    useCreateTransaction,
    useStationTransactions,
    
    // Invoice hooks
    useCreateInvoice,
    useCustomerInvoices,
    useStationInvoices,
    
    // Vehicle hooks
    useCustomerVehicles,
    useCreateVehicle,
    
    // Expense hooks
    useCreateExpense,
    useStationExpenses,
    
    // Activity logs hooks
    useActivityLogs,
    
    // Reports hooks
    useSalesReport,
    useFuelSalesBreakdown,
    useStationComparison,
    useFinancialSummary
  };
}
