import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, AlertTriangle } from "lucide-react";
import { useLoginForm } from "@/lib/hooks/useLoginForm";

/**
 * LoginForm - Component for user login
 * Handles form fields, validation, submission, and failed login attempts tracking
 */
export function LoginForm() {
  const { form, isSubmitting, onSubmit, failedAttempts } = useLoginForm();

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
    watch,
  } = form;

  const watchedEmail = watch("email");

  // Check if account is locked (5 failed attempts)
  const isLocked = failedAttempts >= 5;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Zaloguj się</CardTitle>
        <CardDescription>Wprowadź dane logowania, aby uzyskać dostęp do konta</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {/* Locked Account Alert */}
          {isLocked && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertDescription>
                Konto zostało zablokowane po 5 nieudanych próbach logowania. Skontaktuj się z administratorem, aby
                odblokować konto.
              </AlertDescription>
            </Alert>
          )}

          {/* Failed Attempts Warning */}
          {failedAttempts > 0 && failedAttempts < 5 && (
            <Alert variant="default">
              <AlertTriangle className="size-4" />
              <AlertDescription>
                Nieprawidłowe dane logowania. Pozostało {5 - failedAttempts}{" "}
                {5 - failedAttempts === 1 ? "próba" : failedAttempts === 4 ? "próby" : "prób"} przed zablokowaniem
                konta.
              </AlertDescription>
            </Alert>
          )}

          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Adres e-mail <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                {...register("email")}
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby={errors.email ? "email-error" : undefined}
                placeholder="twoj@email.pl"
                className={`pl-10 ${touchedFields.email && !errors.email && watchedEmail ? "border-green-500 dark:border-green-600" : ""}`}
                autoComplete="email"
                disabled={isLocked}
              />
            </div>
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive animate-in slide-in-from-top-1" role="alert">
                {errors.email.message}
              </p>
            )}
            {touchedFields.email && !errors.email && watchedEmail && (
              <p className="text-xs text-green-600 dark:text-green-500">✓ Poprawny format e-mail</p>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="password">
              Hasło <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                {...register("password")}
                aria-invalid={errors.password ? "true" : "false"}
                aria-describedby={errors.password ? "password-error" : undefined}
                placeholder="Wprowadź hasło"
                className="pl-10"
                autoComplete="current-password"
                disabled={isLocked}
              />
            </div>
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive animate-in slide-in-from-top-1" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <a href="/auth/reset-password" className="text-sm text-primary hover:underline cursor-pointer">
              Zapomniałeś hasła?
            </a>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" disabled={isSubmitting || isLocked} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Logowanie...
              </>
            ) : (
              "Zaloguj się"
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Nie masz konta?{" "}
            <a href="/auth/register" className="text-primary hover:underline cursor-pointer">
              Zarejestruj się
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
