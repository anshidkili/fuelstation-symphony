import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  
  const { data: invoices, isLoading: loadingInvoices } = useQuery({
    queryKey: ['customer-invoices'],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', user.id)
        .order('due_date', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
  
  const { data: vehicles, isLoading: loadingVehicles } = useQuery({
    queryKey: ['customer-vehicles'],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
  
  const { data: reminders, isLoading: loadingReminders } = useQuery({
    queryKey: ['customer-reminders'],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('payment_reminders')
        .select(`
          *,
          invoice:invoices(id, invoice_number, total_amount, due_date)
        `)
        .eq('customer_id', user.id)
        .order('reminder_date', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
  
  // Calculate summary stats
  const totalOutstanding = invoices
    ?.filter(invoice => invoice.status === 'unpaid')
    .reduce((sum, invoice) => sum + invoice.total_amount, 0) || 0;
    
  const overdueInvoices = invoices
    ?.filter(invoice => 
      invoice.status === 'unpaid' && 
      new Date(invoice.due_date) < new Date()
    ).length || 0;
    
  const vehicleCount = vehicles?.length || 0;
  
  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="outline">Paid</Badge>;
      case 'unpaid':
        return <Badge variant="secondary">Unpaid</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your account, view invoices, and track your vehicles
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Outstanding Balance</CardTitle>
            <CardDescription>
              Total amount due across all invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalOutstanding.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">
              {overdueInvoices} overdue invoices
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link to="/invoices">View Invoices</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registered Vehicles</CardTitle>
            <CardDescription>
              Vehicles associated with your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{vehicleCount}</div>
            <p className="text-sm text-muted-foreground">
              Manage your vehicle profiles
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link to="/vehicles">Manage Vehicles</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Reminders</CardTitle>
            <CardDescription>
              Upcoming and overdue payment reminders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reminders?.length || 0}</div>
            <p className="text-sm text-muted-foreground">
              Stay on top of your payments
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link to="/payment-reminders">View Reminders</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>
              Your most recent invoices and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingInvoices ? (
              <div className="flex justify-center items-center h-32">
                Loading invoices...
              </div>
            ) : invoices?.length === 0 ? (
              <div className="flex justify-center items-center h-32">
                No invoices found.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices?.slice(0, 5).map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <Link to={`/invoices/${invoice.id}`} className="font-medium hover:underline">
                            {invoice.invoice_number}
                          </Link>
                        </TableCell>
                        <TableCell>{format(new Date(invoice.issue_date), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{format(new Date(invoice.due_date), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="text-right">${invoice.total_amount.toFixed(2)}</TableCell>
                        <TableCell>{getInvoiceStatusBadge(invoice.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild variant="secondary">
              <Link to="/invoices">
                View All Invoices
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Registered Vehicles</CardTitle>
            <CardDescription>
              Your registered vehicles and their details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingVehicles ? (
              <div className="flex justify-center items-center h-32">
                Loading vehicles...
              </div>
            ) : vehicles?.length === 0 ? (
              <div className="flex justify-center items-center h-32">
                No vehicles found.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Make</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>License Plate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles?.slice(0, 5).map((vehicle) => (
                      <TableRow key={vehicle.id}>
                        <TableCell>{vehicle.make}</TableCell>
                        <TableCell>{vehicle.model}</TableCell>
                        <TableCell>{vehicle.license_plate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild variant="secondary">
              <Link to="/vehicles">
                Manage Vehicles
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
