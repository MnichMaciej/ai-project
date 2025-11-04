import type { APIRoute } from "astro";
import { z } from "zod";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";
import type { LoginDto, LoginResponseDto, AuthErrorResponseDto } from "../../../types.ts";

// Zod schema for login validation
const loginSchema = z.object({
  email: z.string().min(1, "Adres e-mail jest wymagany").email("Nieprawidłowy format e-mail"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

// Type for RPC function response (since it's not in database types yet)
interface IncrementFailedLoginAttemptsResponse {
  failed_attempts: number;
  locked: boolean;
}

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: validationResult.error.errors[0]?.message ?? "Nieprawidłowe dane wejściowe",
        } as AuthErrorResponseDto),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { email, password }: LoginDto = validationResult.data;

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // First, check if account is locked by querying users table
    // We need to find user ID from email - use a database function or RPC
    // For now, we'll try sign in first and handle errors

    // Attempt sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // Login failed - need to handle failed attempts
      // Since we can't query auth.users by email without admin API,
      // we'll use a database RPC function to handle this
      // For MVP, we'll create a simpler approach:
      // Call RPC function that increments failed attempts based on email

      // Call RPC function to increment failed attempts
      // This function should:
      // 1. Find user in auth.users by email (using SECURITY DEFINER function)
      // 2. Increment failed_login_attempts in users table
      // 3. Lock account if attempts >= 5
      // 4. Return current failed attempts count

      // Type assertion needed because RPC function is not yet in database types
      const rpcCall = supabase.rpc as unknown as (
        name: string,
        args: { user_email: string }
      ) => Promise<{ data: IncrementFailedLoginAttemptsResponse | null; error: unknown }>;

      const { data: rpcResult, error: rpcError } = await rpcCall("increment_failed_login_attempts", {
        user_email: email,
      });

      if (rpcError) {
        // RPC function might not exist yet - return generic error
        console.error("RPC error:", rpcError);
        return new Response(
          JSON.stringify({
            error:
              signInError.message === "Invalid login credentials"
                ? "Nieprawidłowe dane logowania"
                : signInError.message,
            failedAttempts: 1,
          } as AuthErrorResponseDto),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const failedAttempts = rpcResult?.failed_attempts ?? 1;
      const isLocked = rpcResult?.locked ?? false;

      if (isLocked) {
        return new Response(
          JSON.stringify({
            error: "Konto zostało zablokowane po 5 nieudanych próbach logowania. Skontaktuj się z administratorem.",
            failedAttempts: 5,
          } as AuthErrorResponseDto),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe dane logowania",
          failedAttempts,
        } as AuthErrorResponseDto),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Login successful - reset failed attempts
    if (signInData.user) {
      // Get user profile to check current state
      const { data: userProfile } = await supabase
        .from("users")
        .select("failed_login_attempts, locked")
        .eq("id", signInData.user.id)
        .single();

      // Check if account is locked (shouldn't happen after successful login, but check anyway)
      if (userProfile?.locked) {
        // Sign out since account is locked
        await supabase.auth.signOut();

        return new Response(
          JSON.stringify({
            error: "Konto zostało zablokowane po 5 nieudanych próbach logowania. Skontaktuj się z administratorem.",
            failedAttempts: userProfile.failed_login_attempts ?? 5,
          } as AuthErrorResponseDto),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Reset failed attempts on successful login
      await supabase
        .from("users")
        .update({
          failed_login_attempts: 0,
          locked: false,
        })
        .eq("id", signInData.user.id);

      return new Response(
        JSON.stringify({
          user: {
            id: signInData.user.id,
            email: signInData.user.email ?? "",
          },
          failedAttempts: 0,
        } as LoginResponseDto),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Nie udało się zalogować",
      } as AuthErrorResponseDto),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas logowania. Spróbuj ponownie.",
      } as AuthErrorResponseDto),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
