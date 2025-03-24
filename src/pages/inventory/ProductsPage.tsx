
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, MoreVertical, Package, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Product } from '@/lib/supabase';

export default function ProductsPage() {
  const { user } = useAuth();
  const [stationId, setStationId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.station_id) {
      setStationId(user.station_id);
    }
  }, [user]);

  const { data: products, isLoading, error, refetch } = useQuery({
    queryKey: ['products', stationId],
    queryFn: async () => {
      if (!stationId) return null;
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('station_id', stationId)
        .order('name');
        
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!stationId,
  });

  const getStockStatus = (product: Product) => {
    const stockPercentage = (product.current_stock / product.alert_threshold) * 100;
    
    if (stockPercentage <= 25) {
      return { status: 'critical', color: 'destructive' };
    } else if (stockPercentage <= 50) {
      return { status: 'low', color: 'warning' };
    } else if (stockPercentage <= 75) {
      return { status: 'moderate', color: 'yellow' };
    } else {
      return { status: 'good', color: 'success' };
    }
  };

  if (error) {
    toast.error('Failed to load products');
    console.error('Error loading products:', error);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Product Inventory</h1>
          <p className="text-muted-foreground">
            Manage your station's product inventory
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button asChild>
            <Link to="/inventory/products/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>
            View and manage all products in your inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !products || products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <Package className="h-12 w-12 text-muted-foreground" />
              <div className="text-lg font-medium">No products found</div>
              <p className="text-muted-foreground text-center max-w-md">
                You haven't added any products to your inventory yet. Add a product to get started.
              </p>
              <Button asChild>
                <Link to="/inventory/products/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Alert Threshold</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => {
                      const stockStatus = getStockStatus(product);
                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell>
                            {product.current_stock < product.alert_threshold && (
                              <AlertTriangle className="h-4 w-4 text-destructive inline mr-1" />
                            )}
                            {product.current_stock}
                          </TableCell>
                          <TableCell>{product.alert_threshold}</TableCell>
                          <TableCell>
                            <Badge variant={stockStatus.color as any}>
                              {stockStatus.status}
                            </Badge>
                          </TableCell>
                          <TableCell>${product.price.toFixed(2)}</TableCell>
                          <TableCell>${product.cost.toFixed(2)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Link
                                    to={`/inventory/products/${product.id}`}
                                    className="w-full"
                                  >
                                    Edit details
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>Adjust stock</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4">
                {products.filter(p => p.current_stock < p.alert_threshold).length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md flex items-start gap-2 text-amber-800 dark:text-amber-300 text-sm">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Low stock alert</p>
                      <p className="text-amber-700 dark:text-amber-400">
                        {products.filter(p => p.current_stock < p.alert_threshold).length} products are below their alert threshold and need restocking.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
