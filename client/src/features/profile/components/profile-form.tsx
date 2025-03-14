import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { useAuth } from "@/core/providers/auth-provider";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/core/ui/form";
import { Input } from "@/core/ui/input";
import { Textarea } from "@/core/ui/textarea";
import { Button } from "@/core/ui/button";
import { Loader2 } from "lucide-react";

export function ProfileForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      bio: user?.bio || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      await apiRequest("PUT", `/api/profile`, data);
    },
    onSuccess: () => {
      toast({
        title: t('profile.profileUpdated'),
        description: t('profile.profileUpdatedDesc'),
      });
      
      // Update the user data in the cache
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      console.error("Update error:", error);
      
      toast({
        title: t('common.error', 'Error'),
        description: error instanceof Error 
          ? error.message 
          : t('common.unexpectedError', 'An unexpected error occurred'),
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: InsertUser) {
    updateMutation.mutate(data);
  }

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(onSubmit)} 
        className="space-y-6"
        aria-label={t('profile.profileManagementForm')}
      >
        <div aria-label={t('profile.nameInformation')}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('profile.username')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('profile.username')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.emailLabel')}</FormLabel>
              <FormControl>
                <Input
                  readOnly
                  disabled
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('profile.bio')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('profile.bio')}
                  className="resize-none min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              {t('profile.savingChanges')}
            </>
          ) : (
            t('profile.saveChanges')
          )}
        </Button>
      </form>
    </Form>
  );
} 