
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-slate-800 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Fuel Symphony</h1>
          <p className="text-slate-300">Sign in to your account</p>
        </div>
        
        <LoginForm />
      </div>
    </div>
  );
}
