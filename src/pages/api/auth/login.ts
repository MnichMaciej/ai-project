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

    // Validate that supabase client is properly initialized
    if (!supabase || typeof supabase.auth === "undefined") {
      console.error("Supabase client not properly initialized");
      return new Response(
        JSON.stringify({
          error: "Błąd konfiguracji serwera. Spróbuj ponownie później.",
        } as AuthErrorResponseDto),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

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

      // Call RPC function directly - handle case where function might not exist
      let rpcResult: IncrementFailedLoginAttemptsResponse | null = null;
      let rpcError: unknown = null;

      // Check if rpc method exists before calling
      if (supabase && typeof supabase.rpc === "function") {
        try {
          // Type assertion needed because RPC function is not yet in database types
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data, error } = await (supabase.rpc as any)("increment_failed_login_attempts", {
            user_email: email,
          });

          if (error) {
            rpcError = error;
            console.error("RPC error:", error);
          } else {
            // Parse the jsonb response from the function
            // The function returns jsonb with failed_attempts and locked fields
            rpcResult = data as IncrementFailedLoginAttemptsResponse | null;
            console.log("RPC result:", rpcResult);
          }
        } catch (error) {
          // RPC function might not exist or there's an error calling it
          rpcError = error;
          console.error("RPC call exception:", error);
        }
      } else {
        // RPC method not available - log and continue with default error handling
        console.warn("Supabase RPC method not available");
        rpcError = new Error("RPC method not available");
      }

      if (rpcError) {
        // RPC function might not exist yet - return generic error
        console.error("RPC error occurred, using default failed attempts:", rpcError);
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

      // Extract values from RPC result (jsonb response)
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
