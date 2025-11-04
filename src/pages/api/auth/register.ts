import type { APIRoute } from "astro";
import { z } from "zod";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";
import type { RegisterDto, RegisterResponseDto, AuthErrorResponseDto } from "../../../types.ts";

// Zod schema for register validation
const registerSchema = z.object({
  email: z.string().min(1, "Adres e-mail jest wymagany").email("Nieprawidłowy format e-mail"),
  password: z
    .string()
    .min(8, "Hasło musi mieć co najmniej 8 znaków")
    .regex(/[A-Z]/, "Hasło musi zawierać co najmniej jedną wielką literę")
    .regex(/[a-z]/, "Hasło musi zawierać co najmniej jedną małą literę")
    .regex(/[0-9]/, "Hasło musi zawierać co najmniej jedną cyfrę"),
});

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = registerSchema.safeParse(body);

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

    const { email, password }: RegisterDto = validationResult.data;

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Attempt sign up with email confirmation disabled (for MVP)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined,
      },
    });

    if (signUpError) {
      // Handle email already exists error specifically
      if (
        signUpError.message.includes("already registered") ||
        signUpError.message.includes("already exists") ||
        signUpError.message.includes("User already registered")
      ) {
        return new Response(
          JSON.stringify({
            error: "Adres e-mail jest już zajęty",
          } as AuthErrorResponseDto),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Generic error for other cases
      return new Response(
        JSON.stringify({
          error: signUpError.message || "Nie udało się zarejestrować",
        } as AuthErrorResponseDto),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!signUpData.user) {
      return new Response(
        JSON.stringify({
          error: "Nie udało się utworzyć konta",
        } as AuthErrorResponseDto),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create user profile record in users table immediately after signUp
    const { error: profileError } = await supabase.from("users").insert({
      id: signUpData.user.id,
      failed_login_attempts: 0,
      locked: false,
    });

    if (profileError) {
      // If profile creation fails but user was created, log error
      // User can still log in, but profile won't exist
      console.error("Error creating user profile:", profileError);
      // Continue anyway - user is created in auth.users
    }

    // Check if session was created (should be automatic with email confirmation disabled)
    if (!signUpData.session) {
      // If no session, try to sign in to create one
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError || !signInData.session) {
        return new Response(
          JSON.stringify({
            error: "Konto zostało utworzone, ale nie udało się zalogować. Spróbuj zalogować się ręcznie.",
          } as AuthErrorResponseDto),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Return response with user and session
      return new Response(
        JSON.stringify({
          user: {
            id: signInData.user.id,
            email: signInData.user.email ?? "",
          },
          session: signInData.session,
        } as RegisterResponseDto),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return response with user and session
    return new Response(
      JSON.stringify({
        user: {
          id: signUpData.user.id,
          email: signUpData.user.email ?? "",
        },
        session: signUpData.session,
      } as RegisterResponseDto),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Register error:", error);
    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas rejestracji. Spróbuj ponownie.",
      } as AuthErrorResponseDto),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
