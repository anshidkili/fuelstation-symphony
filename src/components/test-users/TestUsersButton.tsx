
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TestUser {
  email: string;
  password: string;
  role: string;
}

export function TestUsersButton() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<TestUser[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const createTestUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-test-users');
      
      if (error) throw error;
      
      if (data.success) {
        toast.success('Test users created successfully!');
        setUsers(data.users);
        setDialogOpen(true);
      } else {
        toast.error(data.message || 'Failed to create test users');
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
      console.error('Error creating test users:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        onClick={createTestUsers} 
        disabled={loading}
        className="w-full mt-4"
      >
        {loading ? 'Creating test users...' : 'Create Test Users'}
      </Button>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Test User Credentials</DialogTitle>
            <DialogDescription>
              Use these credentials to log in with different roles.
            </DialogDescription>
          </DialogHeader>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Password</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{user.role}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.password}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </>
  );
}
