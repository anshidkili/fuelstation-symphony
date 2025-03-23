
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/sonner";
import SupabaseInitializer from "./components/SupabaseInitializer";

function App() {
  return (
    <SupabaseInitializer>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster />
      </AuthProvider>
    </SupabaseInitializer>
  );
}

export default App;
