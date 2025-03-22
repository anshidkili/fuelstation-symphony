
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { Layout } from "@/components/layout/Layout";
import SupabaseInitializer from "@/components/SupabaseInitializer";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SupabaseInitializer>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<LoginPage />} />
              
              {/* Protected routes inside Layout */}
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/stations" element={<DashboardPage />} />
                <Route path="/admins" element={<DashboardPage />} />
                <Route path="/reports" element={<DashboardPage />} />
                <Route path="/logs" element={<DashboardPage />} />
                <Route path="/employees" element={<DashboardPage />} />
                <Route path="/customers" element={<DashboardPage />} />
                <Route path="/dispensers" element={<DashboardPage />} />
                <Route path="/inventory" element={<DashboardPage />} />
                <Route path="/finances" element={<DashboardPage />} />
                <Route path="/settings" element={<DashboardPage />} />
                <Route path="/shifts" element={<DashboardPage />} />
                <Route path="/sales" element={<DashboardPage />} />
                <Route path="/profile" element={<DashboardPage />} />
                <Route path="/invoices" element={<DashboardPage />} />
                <Route path="/vehicles" element={<DashboardPage />} />
              </Route>
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </SupabaseInitializer>
  </QueryClientProvider>
);

export default App;
