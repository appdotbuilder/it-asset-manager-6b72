import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import type { User, CreateUserInput } from '../../../server/src/schema';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState<CreateUserInput>({
    username: '',
    password: '',
    role: 'user'
  });

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.users.getAll.query();
      setUsers(result);
    } catch (error) {
      console.error('Failed to load users:', error);
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.username || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setIsLoading(true);
      await trpc.users.create.mutate(formData);
      setSuccess(`User "${formData.username}" created successfully`);
      setFormData({
        username: '',
        password: '',
        role: 'user'
      });
      await loadUsers();
    } catch (error: any) {
      console.error('Failed to create user:', error);
      setError(error.message || 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    try {
      setError('');
      setSuccess('');
      setIsLoading(true);
      await trpc.users.delete.mutate({ id: userId });
      setSuccess(`User "${username}" deleted successfully`);
      await loadUsers();
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      setError(error.message || 'Failed to delete user');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin':
        return '👑 Administrator';
      case 'user':
        return '👤 User';
      default:
        return role;
    }
  };

  return (
    <div className="space-y-6">
      <div className="section-header">
        <h2 className="section-title">👥 Manajemen Pengguna (User Management)</h2>
        <p className="section-description">
          Kelola akun pengguna sistem inventaris
        </p>
      </div>

      {/* Create User Form */}
      <Card>
        <CardHeader>
          <CardTitle>➕ Tambah Pengguna Baru</CardTitle>
          <CardDescription>
            Buat akun pengguna baru untuk mengakses sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-username">Username *</Label>
                <Input
                  id="new-username"
                  value={formData.username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateUserInput) => ({ ...prev, username: e.target.value }))
                  }
                  placeholder="Masukkan username"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">Password *</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={formData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateUserInput) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Minimal 6 karakter"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'admin' | 'user') =>
                    setFormData((prev: CreateUserInput) => ({ ...prev, role: value }))
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger id="new-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">👤 User</SelectItem>
                    <SelectItem value="admin">👑 Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Membuat...' : '➕ Buat Pengguna'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Daftar Pengguna</CardTitle>
          <CardDescription>
            Pengguna yang terdaftar dalam sistem ({users.length} pengguna)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Belum ada pengguna yang terdaftar
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.username}
                      </TableCell>
                      <TableCell>
                        {getRoleDisplay(user.role)}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.is_active ? '✅ Aktif' : '❌ Tidak Aktif'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {user.created_at.toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell className="text-right">
                        {user.username !== 'admin' ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                disabled={isLoading}
                              >
                                🗑️ Hapus
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Pengguna</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus pengguna "{user.username}"? 
                                  Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(user.id, user.username)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <span className="text-gray-400 text-sm">
                            🛡️ Tidak dapat dihapus
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}