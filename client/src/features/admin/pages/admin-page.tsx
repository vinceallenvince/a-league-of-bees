import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/ui/table";
import { Button } from "@/core/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/core/providers/auth-provider";
import { Loader2, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { UserList } from "@/features/admin/components/user-list";

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: t('admin.userDeleted'),
        description: t('admin.userDeletedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error) => {
      toast({
        title: t('admin.requestError'),
        description: error instanceof Error 
          ? error.message 
          : t('common.unexpectedError', 'An unexpected error occurred'),
        variant: "destructive",
      });
    },
  });

  // Redirect if not admin
  if (user && !user.isAdmin) {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">{t('admin.accessDenied')}</h1>
        <p>{t('admin.noPermission')}</p>
      </div>
    );
  }

  return (
    <div className="container py-8" role="main">
      <section aria-labelledby="admin-title">
        <h1 id="admin-title" className="text-2xl font-bold mb-6">{t('admin.userManagement')}</h1>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="sr-only">{t('admin.loading')}</span>
          </div>
        ) : !users || users.length === 0 ? (
          <p>{t('common.noDataAvailable', 'No users available')}</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.name')}</TableHead>
                  <TableHead>{t('admin.email')}</TableHead>
                  <TableHead>{t('admin.lastLogin')}</TableHead>
                  <TableHead className="w-[100px]">{t('admin.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.lastLoginAt 
                        ? new Date(user.lastLoginAt).toLocaleDateString(i18n.language, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }) 
                        : t('admin.never')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => deleteMutation.mutate(user.id)}
                        disabled={deleteMutation.isPending}
                        aria-label={t('admin.deleteUser', { email: user.email })}
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
} 