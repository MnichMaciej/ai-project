import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "../../../helpers/react-testing-helpers";
import { LoginForm } from "@/components/auth/LoginForm";
import { useForm } from "react-hook-form";
import userEvent from "@testing-library/user-event";
import { renderHook } from "@testing-library/react";

// Mock useLoginForm hook
const mockUseLoginForm = vi.fn();
vi.mock("@/lib/hooks/useLoginForm", () => ({
  useLoginForm: () => mockUseLoginForm(),
}));

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("LoginForm", () => {
  let mockForm: ReturnType<typeof useForm>;
  let mockOnSubmit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Suppress console.error output during tests (expected errors are being tested)
    vi.spyOn(console, "error").mockImplementation(() => {});

    vi.clearAllMocks();

    mockOnSubmit = vi.fn().mockResolvedValue(undefined);

    // Create form inside renderHook to ensure proper React context
    const { result } = renderHook(() =>
      useForm({
        defaultValues: {
          email: "",
          password: "",
        },
      })
    );
    mockForm = result.current;

    mockUseLoginForm.mockReturnValue({
      form: mockForm,
      isSubmitting: false,
      onSubmit: mockOnSubmit,
      failedAttempts: 0,
    });
  });

  describe("LoginForm_should_validate_credentials", () => {
    it("should render email and password fields", () => {
      // Arrange & Act
      render(<LoginForm />);

      // Assert
      expect(screen.getByLabelText(/adres e-mail/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/hasło/i)).toBeInTheDocument();
    });

    it("should display validation errors", async () => {
      // Arrange & Act
      const { rerender } = render(<LoginForm />);

      // Set error after initial render to trigger re-render
      await act(async () => {
        mockForm.setError("email", {
          type: "required",
          message: "Adres e-mail jest wymagany",
        });
      });

      // Force re-render to show error
      await act(async () => {
        rerender(<LoginForm />);
      });

      // Assert
      await screen.findByText("Adres e-mail jest wymagany");
    });

    it("should show password validation error", async () => {
      // Arrange & Act
      const { rerender } = render(<LoginForm />);

      // Set error after initial render to trigger re-render
      await act(async () => {
        mockForm.setError("password", {
          type: "required",
          message: "Hasło jest wymagane",
        });
      });

      // Force re-render to show error
      await act(async () => {
        rerender(<LoginForm />);
      });

      // Assert
      await screen.findByText("Hasło jest wymagane");
    });
  });

  describe("LoginForm_should_handle_authentication_request", () => {
    it("should submit form with credentials", async () => {
      // Arrange
      const user = userEvent.setup();
      mockForm.setValue("email", "test@example.com");
      mockForm.setValue("password", "password123");

      render(<LoginForm />);

      // Act
      const submitButton = screen.getByRole("button", { name: /zaloguj się/i });
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it("should disable submit button when submitting", () => {
      // Arrange
      mockUseLoginForm.mockReturnValue({
        form: mockForm,
        isSubmitting: true,
        onSubmit: mockOnSubmit,
        failedAttempts: 0,
      });

      // Act
      render(<LoginForm />);

      // Assert
      const submitButton = screen.getByRole("button", { name: /logowanie/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe("LoginForm_should_track_failed_attempts", () => {
    it("should display failed attempts warning", () => {
      // Arrange
      mockUseLoginForm.mockReturnValue({
        form: mockForm,
        isSubmitting: false,
        onSubmit: mockOnSubmit,
        failedAttempts: 3,
      });

      // Act
      render(<LoginForm />);

      // Assert
      expect(screen.getByText(/pozostało 2 prób/i)).toBeInTheDocument();
    });

    it("should display locked account message when 5 failed attempts", () => {
      // Arrange
      mockUseLoginForm.mockReturnValue({
        form: mockForm,
        isSubmitting: false,
        onSubmit: mockOnSubmit,
        failedAttempts: 5,
      });

      // Act
      render(<LoginForm />);

      // Assert
      expect(screen.getByText(/konto zostało zablokowane po 5 nieudanych próbach/i)).toBeInTheDocument();
    });

    it("should disable form fields when account is locked", () => {
      // Arrange
      mockUseLoginForm.mockReturnValue({
        form: mockForm,
        isSubmitting: false,
        onSubmit: mockOnSubmit,
        failedAttempts: 5,
      });

      // Act
      render(<LoginForm />);

      // Assert
      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);
      const submitButton = screen.getByRole("button");

      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });
});
