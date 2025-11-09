# React Hook Form Refactoring Plan

## <refactoring_breakdown>

### Component Analysis

#### LoginForm.tsx

**Current State:**

- Uses `useLoginForm` hook which encapsulates React Hook Form logic
- Displays failed login attempts tracking (0-5 attempts)
- Shows account lockout warning/error messages
- Has email validation with visual feedback (green border on valid)
- Password field with icon
- Links to reset password and registration

**Areas Needing Refactoring:**

1. **Line 74**: Complex conditional className logic for email validation feedback
   - Could be extracted to a utility function or computed value
2. **Lines 38-58**: Alert rendering logic is embedded in JSX
   - Could be extracted to a separate component or useMemo
3. **Failed attempts logic**: The component receives `failedAttempts` from hook but doesn't need to know about it directly
   - The hook already handles this, component just displays it

**React Hook Form Integration:**

- Already well-integrated via custom hook
- Uses `register`, `handleSubmit`, `formState`, `watch` appropriately
- Validation happens via Zod schema in hook

**API Call Location:**

- API calls are in `useLoginForm` hook (lines 49-58)
- Direct fetch calls with manual error handling
- No retry logic or request cancellation
- Error mapping logic is complex (lines 78-89)

**Complexity Issues:**

- Error mapping logic uses string matching (`includes("email")`) which is fragile
- Network error detection uses string matching on error message
- Failed attempts synchronization logic could be cleaner

#### RegisterForm.tsx

**Current State:**

- Uses `useRegisterForm` hook
- Password strength indicator with visual feedback
- Email validation with visual feedback
- Password confirmation field
- Password requirements info alert

**Areas Needing Refactoring:**

1. **Lines 28-39**: Password strength calculation logic duplicated from UpdatePasswordForm
   - Should be extracted to shared utility/hook
2. **Lines 95-127**: Password strength UI is complex and embedded
   - Could be extracted to separate component
3. **Line 63**: Complex className logic for email validation (same as LoginForm)
4. **Line 91**: Complex className logic for password validation
5. **Line 153**: Complex className logic for confirm password validation

**React Hook Form Integration:**

- Well-integrated, uses form validation properly
- Password confirmation validation via schema `.refine()`

**API Call Location:**

- API calls in `useRegisterForm` hook (lines 57-66)
- Similar pattern to login - direct fetch, manual error handling
- Error mapping uses string matching (line 76)

**Complexity Issues:**

- Password strength calculation should be reusable
- Error mapping logic is fragile (string matching)

#### ResetPasswordForm.tsx

**Current State:**

- Uses `useResetPasswordForm` hook
- Simple email-only form
- Shows success state after submission
- Email validation with visual feedback

**Areas Needing Refactoring:**

1. **Lines 27-49**: Success state rendering is separate component-like structure
   - Could be extracted to separate component
2. **Line 74**: Complex className logic for email validation (same pattern as others)
3. **Success state**: Uses `isSuccess` from hook, which is good separation

**React Hook Form Integration:**

- Simple, well-integrated
- Single field form

**API Call Location:**

- API calls in `useResetPasswordForm` hook (lines 45-53)
- Same pattern as others

**Complexity Issues:**

- Minimal complexity, but follows same error handling pattern

#### UpdatePasswordForm.tsx

**Current State:**

- Uses `useUpdatePasswordForm` hook
- Most complex component due to token verification logic
- Password strength indicator (duplicated from RegisterForm)
- Token verification via useEffect (lines 46-118)
- Multiple loading/success states

**Areas Needing Refactoring:**

1. **Lines 32-43**: Password strength calculation duplicated from RegisterForm
2. **Lines 46-118**: Token verification logic is very complex and embedded in component
   - Should be extracted to custom hook (`useRecoveryTokenVerification`)
   - Handles URL hash params, query params, API calls, error handling, redirects
3. **Lines 121-132**: Loading state rendering could be component
4. **Lines 135-155**: Success state rendering could be component
5. **Lines 184-216**: Password strength UI duplicated from RegisterForm
6. **Lines 264-274**: Password requirements info duplicated from RegisterForm

**React Hook Form Integration:**

- Well-integrated but component is doing too much
- Form logic is clean, but component has too many responsibilities

**API Call Location:**

- Password update API call in hook (lines 54-62)
- Token exchange API call in component useEffect (lines 61-71)
- Session check API call in component useEffect (lines 91-96)
- Multiple API calls scattered across component and hook

**Complexity Issues:**

- Token verification logic should be in hook, not component
- Multiple API calls in component violate separation of concerns
- Duplicated password strength logic
- Duplicated UI components

### Hook Analysis

#### useLoginForm.ts

**Current Issues:**

1. **Lines 45-117**: Large onSubmit function with multiple responsibilities
   - API call
   - Error parsing
   - Error mapping to form fields
   - Failed attempts synchronization
   - Toast notifications
   - Redirects
2. **Lines 78-89**: Fragile error mapping using string matching
3. **Lines 109-113**: Network error detection using string matching
4. **Direct fetch calls**: No abstraction, no retry logic, no request cancellation

**Improvements Needed:**

- Extract API call to service
- Extract error handling to utility
- Use proper error types instead of string matching
- Add request cancellation support

#### useRegisterForm.ts

**Current Issues:**

1. **Lines 53-105**: Similar large onSubmit function
2. **Lines 76-81**: Fragile error mapping
3. **Direct fetch calls**: Same issues as login

**Improvements Needed:**

- Same as useLoginForm

#### useResetPasswordForm.ts

**Current Issues:**

1. **Lines 41-92**: Similar pattern, simpler but still has issues
2. **Direct fetch calls**: Same issues

**Improvements Needed:**

- Same pattern improvements

#### useUpdatePasswordForm.ts

**Current Issues:**

1. **Lines 50-126**: Large onSubmit function
2. **Lines 73-97**: Complex error mapping logic
3. **Direct fetch calls**: Same issues
4. **Token verification**: Should be in separate hook

**Improvements Needed:**

- Extract token verification to separate hook
- Same API/service improvements

### Common Patterns Identified

1. **Email Validation Feedback**: All forms use same pattern for green border on valid email
2. **Password Strength**: RegisterForm and UpdatePasswordForm duplicate logic
3. **Error Handling**: All hooks use similar error handling patterns
4. **API Calls**: All hooks make direct fetch calls with similar structure
5. **Error Mapping**: All hooks use string matching to map errors to fields
6. **Network Error Detection**: All hooks use string matching on error messages

### Proposed Refactoring Approaches

#### Approach 1: Extract API Service Layer

**Pros:**

- Centralizes API logic
- Enables retry logic, cancellation, interceptors
- Makes testing easier
- Consistent error handling
- Type-safe API calls

**Cons:**

- Additional abstraction layer
- More files to maintain

**Recommendation:** ✅ Implement this

#### Approach 2: Extract Shared Utilities

**Pros:**

- Reusable password strength calculation
- Reusable validation feedback utilities
- Reusable error mapping logic
- Reduces duplication

**Cons:**

- Need to ensure utilities are flexible enough

**Recommendation:** ✅ Implement this

#### Approach 3: Extract UI Components

**Pros:**

- Reusable password strength indicator
- Reusable success/loading states
- Cleaner component code
- Easier to test UI components

**Cons:**

- More component files
- Need to ensure components are flexible

**Recommendation:** ✅ Implement this

#### Approach 4: Extract Token Verification Hook

**Pros:**

- Separates concerns
- Reusable if needed elsewhere
- Easier to test
- Cleaner UpdatePasswordForm

**Cons:**

- Additional hook file

**Recommendation:** ✅ Implement this

#### Approach 5: Use React Hook Form's Built-in Features

**Current Usage:**

- Already using `register`, `handleSubmit`, `formState`, `watch`
- Using Zod resolver
- Using `setError` for server errors

**Potential Improvements:**

- Could use `useFormState` for form-level state
- Could use `Controller` for complex inputs (not needed currently)
- Could use `useFieldArray` if we add dynamic fields (not needed)

**Recommendation:** Current usage is good, minor improvements possible

### Edge Cases to Consider

1. **Network Failures**: Currently detected via string matching - should use proper error types
2. **Concurrent Submissions**: No protection against double-submit
3. **Request Cancellation**: No way to cancel in-flight requests
4. **Token Expiration**: UpdatePasswordForm handles this but logic is complex
5. **Failed Attempts**: LoginForm syncs with server but edge cases exist
6. **Password Strength**: Calculation happens on every render (useMemo helps but could be hook)
7. **Form Reset**: No explicit reset after success (relies on navigation)
8. **Browser Back Button**: Success states might persist incorrectly

### Testing Considerations

1. **Unit Tests**: Need to test hooks in isolation
2. **Component Tests**: Need to test form interactions
3. **Integration Tests**: Need to test API integration
4. **E2E Tests**: Need to test full flows
5. **Error Scenarios**: Network errors, validation errors, server errors
6. **Edge Cases**: Concurrent submissions, token expiration, failed attempts

</refactoring_breakdown>

## 1. Analysis

### 1.1 Component Overview

All four components (`LoginForm`, `RegisterForm`, `ResetPasswordForm`, `UpdatePasswordForm`) are already using React Hook Form through custom hooks. However, there are opportunities for improvement in:

- **Code duplication**: Password strength calculation, validation feedback patterns, error handling
- **Separation of concerns**: API calls mixed with form logic, token verification in component
- **Error handling**: Fragile string matching for error mapping
- **API abstraction**: Direct fetch calls without service layer
- **Component complexity**: Some components handle too many responsibilities

### 1.2 Form-Related Logic

**Current State:**

- ✅ React Hook Form properly integrated via custom hooks
- ✅ Zod validation schemas defined in hooks
- ✅ Form state management handled by hooks
- ✅ Server error mapping to form fields
- ⚠️ Password strength calculation duplicated
- ⚠️ Validation feedback logic duplicated
- ⚠️ Error handling patterns duplicated

### 1.3 Areas of High Complexity

1. **UpdatePasswordForm.tsx** (Lines 46-118): Token verification logic embedded in component
2. **useLoginForm.ts** (Lines 45-117): Large onSubmit function with multiple responsibilities
3. **RegisterForm.tsx** (Lines 28-39, 95-127): Password strength calculation and UI
4. **All hooks**: Error mapping using string matching (fragile)
5. **All hooks**: Network error detection using string matching

### 1.4 API Call Locations

**Current API Calls:**

- `useLoginForm`: `/api/auth/login` (POST)
- `useRegisterForm`: `/api/auth/register` (POST)
- `useResetPasswordForm`: `/api/auth/reset-password` (POST)
- `useUpdatePasswordForm`: `/api/auth/update-password` (POST)
- `UpdatePasswordForm` component: `/api/auth/exchange-recovery-token` (POST), `/api/auth/check-session` (GET)

**Issues:**

- Direct fetch calls without abstraction
- No retry logic
- No request cancellation
- Manual error parsing
- Fragile error mapping

## 2. Refactoring Plan

### 2.1 Component Structure Changes

#### 2.1.1 Extract Shared UI Components

**Create `PasswordStrengthIndicator.tsx`:**

```typescript
// src/components/auth/PasswordStrengthIndicator.tsx
// Reusable component for password strength visualization
// Used by RegisterForm and UpdatePasswordForm
```

**Create `FormSuccessState.tsx`:**

```typescript
// src/components/auth/FormSuccessState.tsx
// Reusable success state component
// Used by ResetPasswordForm and UpdatePasswordForm
```

**Create `FormLoadingState.tsx`:**

```typescript
// src/components/auth/FormLoadingState.tsx
// Reusable loading state component
// Used by UpdatePasswordForm
```

**Create `ValidationFeedback.tsx`:**

```typescript
// src/components/auth/ValidationFeedback.tsx
// Utility component for showing validation feedback (green checkmarks, error messages)
```

#### 2.1.2 Extract Token Verification Logic

**Create `useRecoveryTokenVerification.ts`:**

```typescript
// src/lib/hooks/useRecoveryTokenVerification.ts
// Extracts token verification logic from UpdatePasswordForm
// Handles URL hash/query params, API calls, error handling, redirects
```

**Update `UpdatePasswordForm.tsx`:**

- Remove token verification logic (lines 46-118)
- Use `useRecoveryTokenVerification` hook instead
- Component becomes cleaner and focused on form rendering

#### 2.1.3 Simplify Component Logic

**LoginForm.tsx:**

- Extract alert rendering logic to useMemo or separate component
- Extract email validation className logic to utility function

**RegisterForm.tsx:**

- Replace password strength calculation with shared hook
- Replace password strength UI with `PasswordStrengthIndicator` component
- Extract validation className logic to utility function

**ResetPasswordForm.tsx:**

- Extract success state to `FormSuccessState` component
- Extract validation className logic to utility function

**UpdatePasswordForm.tsx:**

- Remove token verification logic (move to hook)
- Replace password strength calculation with shared hook
- Replace password strength UI with `PasswordStrengthIndicator` component
- Replace loading/success states with shared components
- Extract validation className logic to utility function

### 2.2 React Hook Form Implementation

#### 2.2.1 Current State Assessment

**Already Well-Implemented:**

- ✅ Using `useForm` with Zod resolver
- ✅ Proper form registration with `register`
- ✅ Form submission with `handleSubmit`
- ✅ Error state access via `formState.errors`
- ✅ Field watching with `watch`
- ✅ Server error setting with `setError`
- ✅ Validation mode set to `onChange` for live feedback

#### 2.2.2 Improvements Needed

**1. Extract Password Strength to Hook:**

```typescript
// src/lib/hooks/usePasswordStrength.ts
// Shared hook for password strength calculation
// Used by RegisterForm and UpdatePasswordForm
```

**2. Extract Validation Utilities:**

```typescript
// src/lib/utils/validation.ts
// Utility functions for validation feedback (className generation, etc.)
```

**3. Improve Error Handling:**

- Replace string matching with proper error types
- Create error mapping utilities
- Use consistent error response structure

**4. Add Form State Management:**

- Consider using `useFormState` for form-level state if needed
- Ensure proper cleanup on unmount

### 2.3 Logic Optimization

#### 2.3.1 Extract API Service Layer

**Create `auth.service.ts`:**

```typescript
// src/lib/services/auth.service.ts
// Centralized authentication API service
// Methods: login, register, resetPassword, updatePassword, exchangeRecoveryToken, checkSession
// Features: Type-safe API calls, consistent error handling, request cancellation support
```

**Benefits:**

- Centralized API logic
- Consistent error handling
- Type-safe requests/responses
- Easier to add retry logic, interceptors
- Easier to test
- Request cancellation support

#### 2.3.2 Extract Error Handling Utilities

**Create `error.utils.ts`:**

```typescript
// src/lib/utils/error.utils.ts
// Utilities for error handling
// - Error type detection (network, server, validation)
// - Error message extraction
// - Error field mapping (replaces string matching)
```

**Benefits:**

- Eliminates fragile string matching
- Consistent error handling across forms
- Easier to maintain and test

#### 2.3.3 Extract Validation Utilities

**Create `validation.utils.ts`:**

```typescript
// src/lib/utils/validation.utils.ts
// Utilities for validation feedback
// - getValidationClassName (email, password, etc.)
// - Password strength calculation (move from components)
```

**Benefits:**

- Reusable validation feedback logic
- Consistent UI behavior
- Easier to maintain

#### 2.3.4 Optimize Hooks

**Refactor `useLoginForm`:**

- Extract API call to `auth.service.login()`
- Extract error handling to utilities
- Simplify onSubmit function
- Add request cancellation support

**Refactor `useRegisterForm`:**

- Extract API call to `auth.service.register()`
- Extract error handling to utilities
- Simplify onSubmit function

**Refactor `useResetPasswordForm`:**

- Extract API call to `auth.service.resetPassword()`
- Extract error handling to utilities
- Simplify onSubmit function

**Refactor `useUpdatePasswordForm`:**

- Extract API call to `auth.service.updatePassword()`
- Extract error handling to utilities
- Simplify onSubmit function
- Remove token verification (move to separate hook)

**Create `useRecoveryTokenVerification`:**

- Extract token verification logic from UpdatePasswordForm
- Handle URL parsing, API calls, error handling, redirects
- Return verification state and loading state

### 2.4 API Call Management

#### 2.4.1 Create Auth Service

**Structure:**

```typescript
// src/lib/services/auth.service.ts
export class AuthService {
  async login(credentials: LoginDto): Promise<LoginResponseDto>;
  async register(data: RegisterDto): Promise<RegisterResponseDto>;
  async resetPassword(email: string): Promise<ResetPasswordResponseDto>;
  async updatePassword(data: UpdatePasswordDto): Promise<UpdatePasswordResponseDto>;
  async exchangeRecoveryToken(token: string, type: string): Promise<void>;
  async checkSession(): Promise<boolean>;
}
```

**Features:**

- Type-safe API calls using DTOs from `src/types.ts`
- Consistent error handling
- Request cancellation support (AbortController)
- Proper error types (not string matching)
- Network error detection (proper error types)

#### 2.4.2 Error Handling Strategy

**Error Types:**

```typescript
// src/lib/utils/error.utils.ts
export enum ErrorType {
  NETWORK = "NETWORK",
  VALIDATION = "VALIDATION",
  SERVER = "SERVER",
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
}

export interface ApiError {
  type: ErrorType;
  message: string;
  field?: string; // For field-specific errors
  statusCode?: number;
}
```

**Error Mapping:**

- Replace string matching with proper error types
- Use error response structure from API
- Map errors to form fields using error.field property

#### 2.4.3 Request Management

**Add Request Cancellation:**

- Use AbortController for request cancellation
- Cancel requests on component unmount
- Cancel previous request when new one starts

**Add Retry Logic (Optional):**

- For network errors, implement retry with exponential backoff
- Don't retry on 4xx errors (except 429)
- Retry on 5xx errors and network failures

## 3. Review and Test Strategy

### 3.1 Testing Strategy

#### 3.1.1 Unit Tests

**Test Hooks:**

- `useLoginForm`: Test form initialization, validation, submission, error handling
- `useRegisterForm`: Test form initialization, validation, submission
- `useResetPasswordForm`: Test form initialization, submission, success state
- `useUpdatePasswordForm`: Test form initialization, validation, submission
- `useRecoveryTokenVerification`: Test token parsing, API calls, error handling
- `usePasswordStrength`: Test strength calculation for various passwords

**Test Services:**

- `AuthService`: Mock fetch, test all methods, test error handling, test cancellation

**Test Utilities:**

- `error.utils`: Test error type detection, error message extraction, field mapping
- `validation.utils`: Test validation className generation, password strength

#### 3.1.2 Component Tests

**Test Components:**

- `LoginForm`: Test rendering, form interactions, error display, success flow
- `RegisterForm`: Test rendering, form interactions, password strength display
- `ResetPasswordForm`: Test rendering, form interactions, success state
- `UpdatePasswordForm`: Test rendering, form interactions, token verification flow
- `PasswordStrengthIndicator`: Test strength visualization
- `FormSuccessState`: Test success message display
- `FormLoadingState`: Test loading indicator

**Test Scenarios:**

- Form validation (client-side)
- Form submission (success)
- Form submission (error)
- Network errors
- Server errors
- Field-specific errors
- Password strength calculation
- Token verification flow

#### 3.1.3 Integration Tests

**Test API Integration:**

- Test hooks with mock API service
- Test error handling flows
- Test success flows
- Test request cancellation

#### 3.1.4 E2E Tests

**Test Full Flows:**

- Login flow (success and failure)
- Registration flow
- Password reset flow
- Password update flow (with token verification)
- Failed login attempts tracking
- Account lockout

### 3.2 Edge Cases

**Critical Edge Cases to Test:**

1. **Concurrent Submissions:**
   - Prevent double-submit
   - Cancel previous request when new one starts

2. **Network Failures:**
   - Proper error messages
   - Retry logic (if implemented)
   - Request cancellation

3. **Token Expiration:**
   - Proper error handling
   - Redirect to reset password page
   - Clear error messages

4. **Failed Attempts:**
   - Synchronization with server
   - Account lockout at 5 attempts
   - Reset on successful login

5. **Form State:**
   - Reset on navigation
   - Preserve state during errors
   - Clear state on success

6. **Browser Navigation:**
   - Back button handling
   - Success state persistence
   - Token in URL handling

7. **Password Strength:**
   - Real-time calculation
   - Performance (useMemo)
   - Edge cases (empty, special chars, etc.)

8. **Validation Feedback:**
   - Green borders on valid fields
   - Error messages on invalid fields
   - Accessibility (ARIA attributes)

### 3.3 Testing Tools

**Recommended Tools:**

- **Vitest**: Unit tests for hooks, services, utilities
- **React Testing Library**: Component tests
- **Playwright**: E2E tests
- **MSW**: Mock API for integration tests

## 4. Implementation Priority

### Phase 1: Foundation (High Priority)

1. Create `auth.service.ts` with all API methods
2. Create `error.utils.ts` with error handling utilities
3. Create `validation.utils.ts` with validation utilities
4. Refactor hooks to use service and utilities

### Phase 2: Component Extraction (Medium Priority)

1. Create `usePasswordStrength` hook
2. Create `PasswordStrengthIndicator` component
3. Create `FormSuccessState` and `FormLoadingState` components
4. Create `ValidationFeedback` component (if needed)
5. Refactor components to use shared components/hooks

### Phase 3: Token Verification (Medium Priority)

1. Create `useRecoveryTokenVerification` hook
2. Refactor `UpdatePasswordForm` to use hook
3. Test token verification flow

### Phase 4: Optimization (Low Priority)

1. Add request cancellation support
2. Add retry logic (optional)
3. Performance optimizations
4. Additional error handling improvements

## 5. Benefits of Refactoring

1. **Reduced Duplication**: Shared utilities and components eliminate code duplication
2. **Better Separation of Concerns**: API calls in service, form logic in hooks, UI in components
3. **Improved Maintainability**: Centralized logic easier to update and maintain
4. **Better Error Handling**: Proper error types instead of string matching
5. **Easier Testing**: Isolated units easier to test
6. **Type Safety**: Type-safe API calls and error handling
7. **Better UX**: Request cancellation, better error messages, consistent behavior
8. **Scalability**: Easy to add new auth features or forms
