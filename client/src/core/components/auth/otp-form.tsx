import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertOtpSchema, type InsertOtp } from "@shared/schema";
import { useAuth } from "@/core/providers/auth-provider";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/core/ui/form";
import { Input } from "@/core/ui/input";
import { Button } from "@/core/ui/button";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { useTranslation } from "react-i18next";

const emailSchema = z.object({
  email: z.string().email(),
});

type EmailForm = z.infer<typeof emailSchema>;

export function OtpForm() {
  const { t } = useTranslation();
  const [showOtp, setShowOtp] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const { requestAuthMutation, requestOtpMutation, verifyOtpMutation } = useAuth();
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [isMagicLinkSent, setIsMagicLinkSent] = useState(false);

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });

  const otpForm = useForm<InsertOtp>({
    resolver: zodResolver(insertOtpSchema),
    defaultValues: {
      email: "",
      otp: "",
    },
  });

  const onSubmitEmail = async (data: EmailForm) => {
    try {
      const result = await requestAuthMutation.mutateAsync(data.email);
      setEmailValue(data.email);
      
      if (result.method === 'magic-link') {
        setIsMagicLinkSent(true);
      } else {
        setShowOtp(true);
      }
    } catch {
      // Fallback to OTP if the new endpoint fails
      await requestOtpMutation.mutateAsync(data.email);
      setEmailValue(data.email);
      setShowOtp(true);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);
    
    const combinedOtp = newOtpValues.join("");
    otpForm.setValue("otp", combinedOtp);
    otpForm.setValue("email", emailValue);

    if (value && index < 5) {
      const nextInput = document.querySelector<HTMLInputElement>(
        `input[name="otp-${index + 1}"]`
      );
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      const prevInput = document.querySelector<HTMLInputElement>(
        `input[name="otp-${index - 1}"]`
      );
      prevInput?.focus();
    }
  };

  const onSubmitOtp = async (data: InsertOtp) => {
    try {
      await verifyOtpMutation.mutateAsync({
        email: emailValue,
        otp: data.otp,
      });
      setOtpValues(["", "", "", "", "", ""]);
    } catch {
      // Error is already handled by mutation's onError
    }
  };

  const handleResendAuth = async () => {
    try {
      const result = await requestAuthMutation.mutateAsync(emailValue);
      if (result.method === 'magic-link') {
        setIsMagicLinkSent(true);
        setShowOtp(false);
      }
    } catch {
      // Fallback to OTP
      await requestOtpMutation.mutateAsync(emailValue);
    }
  };

  return (
    <div role="form" aria-labelledby="otp-form-title">
      {!showOtp && !isMagicLinkSent ? (
        <Form {...emailForm}>
          <form 
            onSubmit={emailForm.handleSubmit(onSubmitEmail)} 
            className="space-y-4"
            aria-label={t('auth.emailFormLabel')}
          >
            <FormField
              control={emailForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.emailLabel')}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('auth.emailPlaceholder')} 
                      type="email" 
                      autoComplete="email" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full" 
              disabled={requestAuthMutation.isPending || requestOtpMutation.isPending}
            >
              {(requestAuthMutation.isPending || requestOtpMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('auth.continueButton')}
            </Button>
          </form>
        </Form>
      ) : isMagicLinkSent ? (
        <div className="space-y-4" aria-live="polite">
          <h3 className="text-lg font-medium">{t('auth.magicLinkSent')}</h3>
          <p>{t('auth.checkEmailForLink')}</p>
          <p className="text-sm text-muted-foreground">{t('auth.didntReceiveLink')}</p>
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setIsMagicLinkSent(false)} 
            >
              {t('auth.tryDifferentEmail')}
            </Button>
            <Button 
              variant="ghost" 
              onClick={handleResendAuth} 
              disabled={requestAuthMutation.isPending}
            >
              {requestAuthMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('auth.resendLink')}
            </Button>
          </div>
        </div>
      ) : (
        <Form {...otpForm}>
          <form 
            onSubmit={otpForm.handleSubmit(onSubmitOtp)} 
            className="space-y-4"
            aria-label={t('auth.otpFormLabel')}
          >
            <div className="mb-4">
              <p>{t('auth.otpSentTo')} <strong>{emailValue}</strong></p>
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => {
                  setShowOtp(false);
                  setOtpValues(["", "", "", "", "", ""]);
                }}
              >
                {t('auth.changeEmail')}
              </Button>
            </div>
            
            <div>
              <FormLabel htmlFor="otp-0">{t('auth.enterOtp')}</FormLabel>
              <div className="flex gap-2 mt-2">
                {otpValues.map((value, index) => (
                  <Input
                    key={index}
                    id={index === 0 ? "otp-0" : undefined}
                    name={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    className="w-10 h-12 text-center text-lg"
                    value={value}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    aria-label={`${t('auth.otpDigit')} ${index + 1}`}
                  />
                ))}
              </div>
              {otpForm.formState.errors.otp && (
                <p className="text-sm text-destructive mt-2">
                  {otpForm.formState.errors.otp.message}
                </p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={verifyOtpMutation.isPending || otpValues.join("").length !== 6}
            >
              {verifyOtpMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('auth.verifyOtp')}
            </Button>
            
            <div>
              <p className="text-sm text-muted-foreground">{t('auth.didntReceiveCode')}</p>
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 mt-2">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={handleResendAuth} 
                  disabled={requestAuthMutation.isPending || requestOtpMutation.isPending}
                >
                  {(requestAuthMutation.isPending || requestOtpMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t('auth.resendCode')}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
} 