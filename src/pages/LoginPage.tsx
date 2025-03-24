
import { LoginForm } from '@/components/auth/LoginForm';
import { TestUsersButton } from '@/components/test-users/TestUsersButton';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

export default function LoginPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold">
            Fuel Symphony
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The complete fuel station management solution
          </p>
        </div>
        
        <div className="bg-card shadow-sm rounded-lg p-6 border">
          <div className="space-y-6">
            <LoginForm />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>
            <TestUsersButton />
          </div>
        </div>
      </div>
    </div>
  );
}
