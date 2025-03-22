
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/constants";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  DollarSign,
  Users,
  Building,
  BarChart as BarChartIcon,
  Gauge,
  ShoppingCart,
  Package,
  Clock,
  CalendarDays,
  FileText,
} from "lucide-react";

// Mock data for charts
const salesData = [
  { name: "Jan", sales: 4000 },
  { name: "Feb", sales: 3000 },
  { name: "Mar", sales: 2000 },
  { name: "Apr", sales: 2780 },
  { name: "May", sales: 1890 },
  { name: "Jun", sales: 2390 },
  { name: "Jul", sales: 3490 },
];

const fuelSalesData = [
  { name: "Petrol", value: 55 },
  { name: "Diesel", value: 30 },
  { name: "Power Fuel", value: 10 },
  { name: "Electric", value: 5 },
];

const COLORS = ["#4ade80", "#facc15", "#f87171", "#60a5fa"];

export default function DashboardPage() {
  const { user } = useAuth();

  const renderDashboard = () => {
    switch (user?.role) {
      case UserRole.SUPER_ADMIN:
        return renderSuperAdminDashboard();
      case UserRole.ADMIN:
        return renderAdminDashboard();
      case UserRole.EMPLOYEE:
        return renderEmployeeDashboard();
      case UserRole.CREDIT_CUSTOMER:
        return renderCustomerDashboard();
      default:
        return <div>Loading dashboard...</div>;
    }
  };

  const renderSuperAdminDashboard = () => (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value="$287,492.50"
          description="vs. previous month"
          trend={{ value: 12, isPositive: true }}
          icon={<DollarSign className="h-4 w-4" />}
          variant="primary"
        />
        <StatsCard
          title="Active Stations"
          value="8"
          description="2 pending approval"
          icon={<Building className="h-4 w-4" />}
          variant="info"
        />
        <StatsCard
          title="Total Admins"
          value="12"
          description="Active station managers"
          icon={<Users className="h-4 w-4" />}
          variant="success"
        />
        <StatsCard
          title="Monthly Growth"
          value="8.2%"
          description="Year-over-year"
          trend={{ value: 8.2, isPositive: true }}
          icon={<BarChartIcon className="h-4 w-4" />}
          variant="warning"
        />
      </div>

      <div className="grid gap-4 mt-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue across all stations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Station Comparison</CardTitle>
            <CardDescription>Performance metrics across stations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    name="Downtown"
                    stroke="hsl(var(--primary))"
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="uv"
                    name="Uptown"
                    stroke="#4ade80"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );

  const renderAdminDashboard = () => (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Today's Sales"
          value="$8,294.35"
          description="vs. yesterday"
          trend={{ value: 5, isPositive: true }}
          icon={<DollarSign className="h-4 w-4" />}
          variant="primary"
        />
        <StatsCard
          title="Total Customers"
          value="142"
          description="7 new this month"
          icon={<Users className="h-4 w-4" />}
          variant="info"
        />
        <StatsCard
          title="Fuel Stock"
          value="87%"
          description="Last updated 2 hours ago"
          icon={<Gauge className="h-4 w-4" />}
          variant="warning"
        />
        <StatsCard
          title="Active Dispensers"
          value="6/8"
          description="2 under maintenance"
          icon={<ShoppingCart className="h-4 w-4" />}
          variant="danger"
        />
      </div>

      <div className="grid gap-4 mt-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily Sales</CardTitle>
            <CardDescription>Revenue data for the current week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fuel Type Sales</CardTitle>
            <CardDescription>Distribution by fuel type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fuelSalesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label
                  >
                    {fuelSalesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 mt-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Inventory Status</CardTitle>
            <CardDescription>Current stock levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Petrol</span>
                <span className="font-medium">85%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: "85%" }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Diesel</span>
                <span className="font-medium">62%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: "62%" }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Power Fuel</span>
                <span className="font-medium">38%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="bg-red-500 h-full rounded-full" style={{ width: "38%" }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span>AdBlue</span>
                <span className="font-medium">91%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: "91%" }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Shifts</CardTitle>
            <CardDescription>Current and upcoming shifts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center p-2 rounded-md bg-muted/50 border border-border">
                <div className="bg-green-500 w-2 h-2 rounded-full mr-2"></div>
                <div className="flex-1">
                  <div className="font-medium">Bob Employee</div>
                  <div className="text-xs text-muted-foreground">08:00 - 16:00</div>
                </div>
                <div className="text-xs font-medium text-green-500">Active</div>
              </div>
              
              <div className="flex items-center p-2 rounded-md bg-muted/50 border border-border">
                <div className="bg-amber-500 w-2 h-2 rounded-full mr-2"></div>
                <div className="flex-1">
                  <div className="font-medium">Alice Worker</div>
                  <div className="text-xs text-muted-foreground">16:00 - 00:00</div>
                </div>
                <div className="text-xs font-medium text-amber-500">Upcoming</div>
              </div>
              
              <div className="flex items-center p-2 rounded-md bg-muted/50 border border-border">
                <div className="bg-blue-500 w-2 h-2 rounded-full mr-2"></div>
                <div className="flex-1">
                  <div className="font-medium">Charlie Staff</div>
                  <div className="text-xs text-muted-foreground">00:00 - 08:00</div>
                </div>
                <div className="text-xs font-medium text-blue-500">Tomorrow</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest actions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <Package className="h-4 w-4 mt-0.5 text-foreground" />
                <div>
                  <div className="text-sm">New inventory delivered</div>
                  <div className="text-xs text-muted-foreground">Today, 10:24 AM</div>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-0.5 text-foreground" />
                <div>
                  <div className="text-sm">Invoice #8249 generated</div>
                  <div className="text-xs text-muted-foreground">Today, 09:12 AM</div>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 text-foreground" />
                <div>
                  <div className="text-sm">Bob started his shift</div>
                  <div className="text-xs text-muted-foreground">Today, 08:02 AM</div>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <DollarSign className="h-4 w-4 mt-0.5 text-foreground" />
                <div>
                  <div className="text-sm">Daily deposit complete</div>
                  <div className="text-xs text-muted-foreground">Yesterday, 08:30 PM</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );

  const renderEmployeeDashboard = () => (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Current Shift"
          value="08:00 - 16:00"
          description="4 hours remaining"
          icon={<Clock className="h-4 w-4" />}
          variant="primary"
        />
        <StatsCard
          title="Today's Sales"
          value="$2,183.50"
          description="85 transactions"
          icon={<ShoppingCart className="h-4 w-4" />}
          variant="success"
        />
        <StatsCard
          title="Assigned Dispenser"
          value="#3 & #4"
          description="Diesel & Petrol"
          icon={<Gauge className="h-4 w-4" />}
          variant="info"
        />
        <StatsCard
          title="Scheduled Shifts"
          value="15"
          description="This month"
          icon={<CalendarDays className="h-4 w-4" />}
          variant="warning"
        />
      </div>

      <div className="grid gap-4 mt-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today's Transactions</CardTitle>
            <CardDescription>Real-time sales tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    name="Sales"
                    stroke="hsl(var(--primary))"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fuel Sales Breakdown</CardTitle>
            <CardDescription>Distribution by fuel type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fuelSalesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label
                  >
                    {fuelSalesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 mt-6 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Shift Details</CardTitle>
            <CardDescription>Current shift information and readings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="font-medium mb-2">Starting Readings</h3>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 bg-muted/50 rounded-md">
                    <span>Petrol Meter</span>
                    <span className="font-medium">12845.6 L</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded-md">
                    <span>Diesel Meter</span>
                    <span className="font-medium">8937.2 L</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded-md">
                    <span>Cash</span>
                    <span className="font-medium">$200.00</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Current Readings</h3>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 bg-muted/50 rounded-md">
                    <span>Petrol Meter</span>
                    <span className="font-medium">12892.1 L</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded-md">
                    <span>Diesel Meter</span>
                    <span className="font-medium">8998.8 L</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded-md">
                    <span>Cash</span>
                    <span className="font-medium">$2,383.50</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );

  const renderCustomerDashboard = () => (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Current Balance"
          value="$1,245.30"
          description="Due in 15 days"
          icon={<DollarSign className="h-4 w-4" />}
          variant="danger"
        />
        <StatsCard
          title="Total Consumption"
          value="1,856 L"
          description="This month"
          icon={<Gauge className="h-4 w-4" />}
          variant="primary"
        />
        <StatsCard
          title="Registered Vehicles"
          value="4"
          description="Active fleet"
          icon={<Package className="h-4 w-4" />}
          variant="info"
        />
        <StatsCard
          title="Last Transaction"
          value="Yesterday"
          description="12:45 PM"
          icon={<Clock className="h-4 w-4" />}
          variant="success"
        />
      </div>

      <div className="grid gap-4 mt-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Consumption History</CardTitle>
            <CardDescription>Monthly fuel usage statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sales" name="Liters" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle Breakdown</CardTitle>
            <CardDescription>Consumption by vehicle</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Truck 1", value: 45 },
                      { name: "Truck 2", value: 25 },
                      { name: "Van", value: 20 },
                      { name: "Car", value: 10 },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label
                  >
                    {fuelSalesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 mt-6 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>Latest billing information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md border border-border">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Invoice #8249</div>
                    <div className="text-xs text-muted-foreground">July 15, 2023</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-medium">$785.25</div>
                    <div className="text-xs text-red-500">Due in 5 days</div>
                  </div>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md border border-border">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Invoice #8142</div>
                    <div className="text-xs text-muted-foreground">June 15, 2023</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-medium">$698.45</div>
                    <div className="text-xs text-green-500">Paid</div>
                  </div>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md border border-border">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Invoice #8054</div>
                    <div className="text-xs text-muted-foreground">May 15, 2023</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-medium">$812.30</div>
                    <div className="text-xs text-green-500">Paid</div>
                  </div>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );

  return (
    <div>
      {user && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
          <p className="text-muted-foreground">
            {user.role === UserRole.ADMIN || user.role === UserRole.EMPLOYEE
              ? `${user.station_name} • `
              : ""}
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      )}

      <div className="animate-fade-in">{renderDashboard()}</div>
    </div>
  );
}
