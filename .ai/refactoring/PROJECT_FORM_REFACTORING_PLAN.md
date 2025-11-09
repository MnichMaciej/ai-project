# Project Form Components Refactoring Plan

<refactoring_breakdown>

## Refactoring Breakdown

### ProjectEditView.tsx Analysis

#### Current Implementation Review

**Lines 16-17:** Form hook initialization
```typescript
const { form, isSubmitting, isLoading, onSubmit, error, queryCount } = useProjectEditForm(projectId);
```
- ✅ Good: Clean hook usage
- ✅ Good: Destructured return values are clear
- ⚠️ Consider: The hook returns many values - could be grouped into objects

**Lines 19-21:** Navigation handler
```typescript
const handleCancel = () => {
  window.location.href = "/projects";
};
```
- ⚠️ Issue: Direct `window.location.href` usage
- 💡 Consider: Using Astro's navigation or a router if available
- 💡 Consider: Extracting to shared utility or component

**Lines 23-34:** Loading state UI
```typescript
if (isLoading) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl animate-in fade-in duration-300">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Ładowanie projektu...</p>
        </div>
      </div>
    </div>
  );
}
```
- ✅ Good: Clear loading state
- 💡 Consider: Extract to `<LoadingState />` component for reuse
- 💡 Consider: Could use Suspense boundary if data fetching moves to server

**Lines 36-57:** Error state UI
```typescript
if (error) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl animate-in fade-in duration-300">
      {/* ... */}
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <p className="text-destructive">{error.message}</p>
      </div>
    </div>
  );
}
```
- ✅ Good: Clear error display
- 💡 Consider: Extract to `<ErrorState />` component
- 💡 Consider: Add retry button for better UX

**Lines 59-87:** Main form rendering
- ✅ Good: Clean component structure
- ✅ Good: Proper prop passing to `ProjectForm`
- ⚠️ Issue: Duplicate navigation button (also in error state)

#### Refactoring Considerations

**Approach 1: Extract Loading/Error Components**
- **Pros:** Reusable, cleaner component, easier to test
- **Cons:** More files to maintain
- **Recommendation:** ✅ Extract if used in multiple places

**Approach 2: Use Suspense Boundaries**
- **Pros:** Modern React pattern, better UX
- **Cons:** Requires server-side data fetching refactor
- **Recommendation:** ⚠️ Consider for future, not immediate priority

**Approach 3: Extract Navigation**
- **Pros:** Consistent navigation across views
- **Cons:** Might be over-engineering for simple case
- **Recommendation:** ✅ Extract if navigation logic becomes more complex

### NewProjectView.tsx Analysis

#### Current Implementation Review

**Lines 10-11:** Form hook initialization
```typescript
const { form, isSubmitting, onSubmit } = useProjectForm();
```
- ✅ Good: Simple, clean hook usage
- ✅ Good: Only destructures what's needed

**Lines 13-15:** Navigation handler
```typescript
const handleCancel = () => {
  window.location.href = "/projects";
};
```
- ⚠️ Same issue as ProjectEditView - direct window.location usage

**Lines 17-43:** Component structure
- ✅ Good: Minimal, focused component
- ✅ Good: Proper test IDs for testing
- ✅ Good: Clean prop passing

#### Refactoring Considerations

**Approach 1: Keep as-is**
- **Pros:** Already minimal and clean
- **Cons:** None
- **Recommendation:** ✅ Keep minimal changes, only extract navigation if needed

**Approach 2: Merge with ProjectEditView**
- **Pros:** Single component for both modes
- **Cons:** More complex conditional logic, harder to maintain
- **Recommendation:** ❌ Don't merge - separation of concerns is better

### ProjectForm.tsx Analysis

#### Current Implementation Review

**Lines 43-52:** Component props
```typescript
export function ProjectForm({
  form,
  onSubmit,
  isSubmitting,
  onCancel,
  mode = "create",
  projectId = null,
  initialQueryCount = 0,
  isAIEnabled = false,
}: ProjectFormProps) {
```
- ⚠️ Issue: Many props (8 total)
- 💡 Consider: Group related props into objects
- 💡 Consider: Use `useFormContext` to reduce prop drilling

**Lines 53-60:** Form destructuring
```typescript
const {
  register,
  handleSubmit,
  formState: { errors, touchedFields, isValid },
  control,
  watch,
  setValue,
} = form;
```
- ✅ Good: Proper form API usage
- ⚠️ Issue: `watch()` causes re-renders on every form change
- 💡 Consider: Use `useWatch` for specific fields

**Lines 62-63:** Technology state
```typescript
const watchedTechnologies = watch("technologies");
const [newTechnology, setNewTechnology] = React.useState("");
```
- ⚠️ Issue: Mixing form state (`watch`) with local state (`useState`)
- ⚠️ Issue: `watch("technologies")` re-renders on any form change
- 💡 Consider: Extract to custom hook `useTechnologyManagement`
- 💡 Consider: Use `useWatch({ control, name: "technologies" })` instead

**Lines 65-70:** AI Generation hook
```typescript
const aiGeneration = useAIGeneration({
  projectId,
  initialQueryCount,
  form,
});
```
- ✅ Good: Clean hook usage
- ⚠️ Issue: Tight coupling - form passed to AI hook
- 💡 Consider: AI hook could update form via callback instead

**Lines 72-90:** Technology management functions
```typescript
const handleAddTechnology = () => {
  const trimmed = newTechnology.trim();
  if (trimmed && !watchedTechnologies?.includes(trimmed)) {
    setValue("technologies", [...(watchedTechnologies ?? []), trimmed], { shouldValidate: true });
    setNewTechnology("");
  }
};

const handleRemoveTechnology = (index: number) => {
  const updated = watchedTechnologies?.filter((_, i) => i !== index) ?? [];
  setValue("technologies", updated, { shouldValidate: true });
};

const handleTechnologyKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleAddTechnology();
  }
};
```
- ⚠️ Issue: Business logic in component
- ⚠️ Issue: Duplicate validation (form schema + manual check)
- 💡 Consider: Extract to `useTechnologyManagement` hook
- 💡 Consider: Use `useCallback` to prevent unnecessary re-renders

**Lines 102-128:** Name field rendering
```typescript
<div className="space-y-2">
  <Label htmlFor="name">
    Nazwa projektu <span className="text-destructive">*</span>
  </Label>
  <Input
    data-testid="project-name-input"
    id="name"
    type="text"
    {...register("name")}
    aria-invalid={errors.name ? "true" : "false"}
    aria-describedby={errors.name ? "name-error" : undefined}
    placeholder="np. E-commerce Platform"
    maxLength={100}
    className={
      touchedFields.name && !errors.name && watch("name") ? "border-green-500 dark:border-green-600" : ""
    }
  />
  {errors.name && (
    <p id="name-error" className="text-sm text-destructive animate-in slide-in-from-top-1" role="alert">
      {errors.name.message}
    </p>
  )}
  {touchedFields.name && !errors.name && watch("name") && (
    <p className="text-xs text-green-600 dark:text-green-500">Wygląda dobrze!</p>
  )}
</div>
```
- ⚠️ Issue: Repetitive pattern (repeated for each field)
- ⚠️ Issue: `watch("name")` called multiple times (performance)
- ⚠️ Issue: Validation feedback logic duplicated
- 💡 Consider: Extract to `<ProjectNameField />` component
- 💡 Consider: Use `useWatch` to get value once
- 💡 Consider: Extract validation feedback to hook

**Lines 130-167:** Description field
- ⚠️ Same issues as name field
- ⚠️ Additional: Character count logic could be extracted
- 💡 Consider: Extract to `<ProjectDescriptionField />`

**Lines 169-242:** Technologies field
- ⚠️ Most complex field (74 lines)
- ⚠️ Mixes multiple concerns: rendering, state, validation
- 💡 Consider: Extract to `<ProjectTechnologiesField />` + `useTechnologyManagement`

**Lines 244-256:** AI Section
```typescript
{mode === "edit" && projectId && isAIEnabled && (
  <AISection
    projectId={projectId}
    queryCount={aiGeneration.state.queryCount}
    aiState={aiGeneration.state}
    onOpenInput={aiGeneration.openInput}
    onCloseInput={aiGeneration.closeInput}
    onFileLinksChange={aiGeneration.setFileLinks}
    onFileLinksSubmit={aiGeneration.generateAI}
    onValidateLinks={aiGeneration.validateLinks}
  />
)}
```
- ✅ Good: Conditional rendering is clear
- ⚠️ Issue: Many props passed to AISection (7 props)
- 💡 Consider: Pass entire `aiGeneration` object or use context

**Lines 258-290:** Status field
- ✅ Good: Uses `Controller` for Select
- 💡 Consider: Extract to `<ProjectStatusField />`

**Lines 292-375:** URL fields (repo, demo, preview)
- ⚠️ Issue: Very repetitive (3 nearly identical blocks)
- ⚠️ Issue: 84 lines for 3 similar fields
- 💡 Consider: Extract to reusable `<ProjectUrlField />` component
- 💡 Consider: Map over field config array

#### Refactoring Considerations

**Approach 1: Extract Field Components**
- **Pros:** 
  - Reduces ProjectForm from 410 to ~150 lines
  - Each field is testable independently
  - Reusable across different forms
  - Better separation of concerns
- **Cons:** 
  - More files to maintain
  - Need to ensure consistent API
- **Recommendation:** ✅ Strongly recommended

**Approach 2: Use FormProvider + useFormContext**
- **Pros:** 
  - Eliminates prop drilling
  - Cleaner component APIs
  - Better performance (context optimization)
- **Cons:** 
  - Slightly more complex setup
  - Need to ensure FormProvider wraps correctly
- **Recommendation:** ✅ Recommended

**Approach 3: Extract Technology Logic to Hook**
- **Pros:** 
  - Separates business logic from UI
  - Reusable logic
  - Easier to test
- **Cons:** 
  - Additional abstraction layer
- **Recommendation:** ✅ Recommended

**Approach 4: Extract Validation Feedback Logic**
- **Pros:** 
  - Eliminates duplication
  - Consistent validation UI
  - Easier to maintain
- **Cons:** 
  - Need to ensure flexibility for edge cases
- **Recommendation:** ✅ Recommended

### useProjectForm.ts Analysis

#### Current Implementation Review

**Lines 10-42:** Form schema definition
```typescript
export const createProjectFormSchema = z.object({
  name: z.string().min(1, "Nazwa projektu jest wymagana").max(100, "Nazwa projektu nie może przekraczać 100 znaków"),
  description: z.string().min(10, "Opis musi mieć co najmniej 10 znaków").max(1000, "Opis nie może przekraczać 1000 znaków"),
  technologies: z.array(z.string().min(1, "Technologia nie może być pusta"))
    .min(1, "Musisz dodać co najmniej jedną technologię")
    .max(10, "Możesz dodać maksymalnie 10 technologii")
    .refine((arr) => arr.length === new Set(arr).size, {
      message: "Technologie muszą być unikalne",
    }),
  status: z.nativeEnum(ProjectStatusEnum),
  repoUrl: z.union([z.string(), z.null()])
    .transform((val) => (val === "" || val === null ? null : val))
    .refine((val) => val === null || z.string().url().safeParse(val).success, {
      message: "Nieprawidłowy format URL",
    }),
  // ... demoUrl and previewUrl similar
});
```
- ⚠️ Issue: URL validation duplicated 3 times (repoUrl, demoUrl, previewUrl)
- 💡 Consider: Extract URL schema to reusable variable
- ✅ Good: Comprehensive validation rules

**Lines 52-102:** transformFormData function
```typescript
export function transformFormData(data: {
  name?: string;
  description?: string;
  technologies?: string[];
  status?: ProjectStatusEnum;
  repoUrl?: string | null;
  demoUrl?: string | null;
  previewUrl?: string | null;
}): { /* ... */ } {
  const transformed: { /* ... */ } = {};

  if (data.name !== undefined) {
    transformed.name = data.name.trim();
  }
  // ... similar for each field
}
```
- ⚠️ Issue: Repetitive if-checks for each field
- 💡 Consider: Use Object.entries and map
- ✅ Good: Shared utility (used by both hooks)

**Lines 107-121:** mapServerErrorsToForm function
```typescript
export function mapServerErrorsToForm<T extends Record<string, unknown>>(
  errorDetails: string[] | undefined,
  form: ReturnType<typeof useForm<T>>
): void {
  if (errorDetails && Array.isArray(errorDetails)) {
    errorDetails.forEach((detail) => {
      const match = detail.match(/^([^.]+):\s*(.+)$/);
      if (match) {
        const [, fieldPath, message] = match;
        const fieldName = fieldPath.split(".")[0] as keyof T;
        form.setError(fieldName, { type: "server", message });
      }
    });
  }
}
```
- ⚠️ Issue: Fragile string matching for error parsing
- ⚠️ Issue: Only handles first-level fields (fieldPath.split(".")[0])
- 💡 Consider: More robust error parsing
- 💡 Consider: Use typed error responses from API

**Lines 133-146:** Form initialization
```typescript
export function useProjectForm(): UseProjectFormReturn {
  const form = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectFormSchema),
    defaultValues: {
      name: "",
      description: "",
      technologies: [],
      status: ProjectStatusEnum.PLANNING,
      repoUrl: null,
      demoUrl: null,
      previewUrl: null,
    },
    mode: "onChange", // Validate on change for live feedback
  });
```
- ✅ Good: Proper form configuration
- ✅ Good: Clear default values
- ✅ Good: onChange mode for live validation

**Lines 148-149:** State management
```typescript
const [isSubmitting, setIsSubmitting] = React.useState(false);
```
- ✅ Good: Simple state management
- 💡 Consider: Could use form's `isSubmitting` state if available

**Lines 150-205:** onSubmit function
```typescript
const onSubmit = async (data: CreateProjectFormData) => {
  setIsSubmitting(true);

  try {
    // Transform form data to CreateProjectDto format
    const projectData: CreateProjectDto = transformFormData(data) as CreateProjectDto;

    const response = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(projectData),
    });

    if (!response.ok) {
      // Handle error responses
      let errorMessage = "Nie udało się utworzyć projektu";
      let errorDetails: string[] | undefined;

      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        errorDetails = errorData.details;

        // Map server validation errors to form fields
        mapServerErrorsToForm(errorDetails, form);
      } catch {
        // If parsing fails, use default error message
      }

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      toast.error(errorMessage);
      return;
    }

    // Success - show toast and redirect
    toast.success("Projekt został pomyślnie dodany");
    window.location.href = "/projects";
  } catch (error) {
    console.error("Error creating project:", error);

    // Handle network errors
    if (error instanceof Error && error.message.includes("fetch")) {
      toast.error("Błąd połączenia z serwerem. Sprawdź połączenie internetowe.");
    } else {
      toast.error("Nie udało się utworzyć projektu. Spróbuj ponownie.");
    }
  } finally {
    setIsSubmitting(false);
  }
};
```
- ⚠️ Issue: Large function (56 lines)
- ⚠️ Issue: Direct fetch call (should be in service)
- ⚠️ Issue: Error handling duplicated (similar to useProjectEditForm)
- ⚠️ Issue: Status code handling (401) duplicated
- ⚠️ Issue: Network error detection via string matching (`error.message.includes("fetch")`)
- ⚠️ Issue: Navigation logic mixed with API logic
- 💡 Consider: Extract to API service
- 💡 Consider: Extract error handling to utility
- 💡 Consider: Use proper error types instead of string matching

#### Refactoring Considerations

**Approach 1: Extract API Service**
- **Pros:** 
  - Centralized API logic
  - Consistent error handling
  - Type-safe API calls
  - Easier to test
  - Can add retry logic, interceptors
- **Cons:** 
  - Additional abstraction layer
  - More files to maintain
- **Recommendation:** ✅ Strongly recommended (follows existing AuthService pattern)

**Approach 2: Extract Error Handling**
- **Pros:** 
  - Single source of truth
  - Consistent error handling
  - Easier to update
- **Cons:** 
  - Need to ensure flexibility
- **Recommendation:** ✅ Recommended

**Approach 3: Extract Form Submission Logic**
- **Pros:** 
  - Reusable submission pattern
  - Consistent error handling
  - Easier to test
- **Cons:** 
  - Might be over-engineering for simple cases
- **Recommendation:** ⚠️ Consider if pattern repeats in many forms

### useProjectEditForm.ts Analysis

#### Current Implementation Review

**Lines 11-20:** Update schema definition
```typescript
const updateProjectFormSchema = createProjectFormSchema.partial().superRefine((data, ctx) => {
  // If technologies is provided, validate it has at least 1 item
  if (data.technologies !== undefined && data.technologies.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Musisz dodać co najmniej jedną technologię",
      path: ["technologies"],
    });
  }
});
```
- ✅ Good: Reuses create schema
- ✅ Good: Custom validation for technologies
- 💡 Consider: Could validate other required fields if provided

**Lines 54-57:** Form initialization
```typescript
const form = useForm<UpdateProjectFormData>({
  resolver: zodResolver(updateProjectFormSchema),
  mode: "onChange",
});
```
- ⚠️ Issue: No default values (relies on reset later)
- ✅ Good: Same mode as create form

**Lines 59-63:** State management
```typescript
const [isSubmitting, setIsSubmitting] = React.useState(false);
const [isLoading, setIsLoading] = React.useState(true);
const [project, setProject] = React.useState<ProjectDto | null>(null);
const [error, setError] = React.useState<AIErrorType | null>(null);
const [queryCount, setQueryCount] = React.useState(0);
```
- ⚠️ Issue: Multiple state variables
- 💡 Consider: Use `useReducer` for complex state
- 💡 Consider: Group related state into objects

**Lines 66-127:** useEffect for data fetching
```typescript
React.useEffect(() => {
  const fetchProject = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (response.status === 404) {
          toast.error("Projekt nie został znaleziony");
          window.location.href = "/projects";
          return;
        }
        throw new Error("Nie udało się pobrać projektu");
      }

      const projectData: ProjectDto = await response.json();
      setProject(projectData);

      // Pre-fill form with project data
      form.reset({
        name: projectData.name,
        description: projectData.description,
        technologies: projectData.technologies,
        status: projectData.status,
        repoUrl: projectData.repoUrl,
        demoUrl: projectData.demoUrl,
        previewUrl: projectData.previewUrl,
      });

      // Fetch query count for AI generation
      try {
        const count = await fetchProjectQueryCount(projectId);
        setQueryCount(count);
      } catch (queryCountError) {
        console.error("Error fetching query count:", queryCountError);
        // Don't fail the whole operation if query count fails
        setQueryCount(0);
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      toast.error("Nie udało się pobrać projektu. Spróbuj ponownie.");
      setError({ message: error instanceof Error ? error.message : "Nie udało się pobrać projektu" });
    } finally {
      setIsLoading(false);
    }
  };

  if (projectId) {
    fetchProject();
  }
}, [projectId, form]);
```
- ⚠️ Issue: Large useEffect (62 lines)
- ⚠️ Issue: Multiple concerns: fetching project, resetting form, fetching query count
- ⚠️ Issue: Direct fetch call
- ⚠️ Issue: Error handling duplicated
- ⚠️ Issue: Status code handling duplicated
- ⚠️ Issue: No request cancellation
- ⚠️ Issue: `form` in dependency array (could cause unnecessary re-fetches)
- 💡 Consider: Split into separate useEffects
- 💡 Consider: Extract to custom hook `useProjectData`
- 💡 Consider: Use API service
- 💡 Consider: Add request cancellation

**Lines 129-201:** onSubmit function
```typescript
const onSubmit = async (data: UpdateProjectFormData) => {
  setIsSubmitting(true);
  setError(null);

  try {
    // Transform form data to UpdateProjectDto format using shared helper
    const updateData: UpdateProjectDto = transformFormData(data) as UpdateProjectDto;

    const response = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      let errorMessage = "Nie udało się zaktualizować projektu";
      let errorDetails: string[] | undefined;

      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        errorDetails = errorData.details;

        // Map server validation errors to form fields using shared helper
        mapServerErrorsToForm(errorDetails, form);
      } catch {
        // If parsing fails, use default error message
      }

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (response.status === 403) {
        toast.error("Brak dostępu do tego projektu");
        window.location.href = "/projects";
        return;
      }

      if (response.status === 404) {
        toast.error("Projekt nie został znaleziony");
        window.location.href = "/projects";
        return;
      }

      toast.error(errorMessage);
      return;
    }

    const updatedProject: ProjectDto = await response.json();
    setProject(updatedProject);

    // Success - show toast and redirect
    toast.success("Projekt został pomyślnie zaktualizowany");
    window.location.href = "/projects";
  } catch (error) {
    console.error("Error updating project:", error);

    // Handle network errors
    if (error instanceof Error && error.message.includes("fetch")) {
      toast.error("Błąd połączenia z serwerem. Sprawdź połączenie internetowe.");
      setError({ message: "Błąd połączenia z serwerem" });
    } else {
      toast.error("Nie udało się zaktualizować projektu. Spróbuj ponownie.");
      setError({ message: "Nie udało się zaktualizować projektu" });
    }
  } finally {
    setIsSubmitting(false);
  }
};
```
- ⚠️ Issue: Very similar to useProjectForm.onSubmit (duplication)
- ⚠️ Issue: Large function (73 lines)
- ⚠️ Issue: Direct fetch call
- ⚠️ Issue: Error handling duplicated
- ⚠️ Issue: Status code handling duplicated (401, 403, 404)
- ⚠️ Issue: Network error detection via string matching
- 💡 Consider: Extract to API service
- 💡 Consider: Extract error handling
- 💡 Consider: Extract submission logic

#### Refactoring Considerations

**Approach 1: Extract Data Fetching Hook**
- **Pros:** 
  - Separates data fetching from form logic
  - Reusable pattern
  - Easier to test
- **Cons:** 
  - Additional abstraction
- **Recommendation:** ✅ Recommended if pattern repeats

**Approach 2: Split useEffect**
- **Pros:** 
  - Each effect has single responsibility
  - Easier to understand
  - Better dependency management
- **Cons:** 
  - More effects to manage
- **Recommendation:** ✅ Recommended

**Approach 3: Use API Service**
- **Pros:** 
  - Same as useProjectForm
  - Consistent API handling
- **Cons:** 
  - Same as useProjectForm
- **Recommendation:** ✅ Strongly recommended

### useAIGeneration.ts Analysis

#### Current Implementation Review

**Lines 94-99:** Hook initialization
```typescript
export function useAIGeneration({
  projectId,
  initialQueryCount = 0,
  form,
  onUpdateProject,
}: UseAIGenerationOptions): UseAIGenerationReturn {
```
- ⚠️ Issue: Receives form object (tight coupling)
- 💡 Consider: Use callback to update form instead

**Lines 100-108:** State initialization
```typescript
const [state, setState] = React.useState<AIState>({
  isOpen: false,
  fileLinks: "",
  parsedLinks: null,
  isLoading: false,
  queryCount: initialQueryCount,
  error: null,
  status: "idle",
});
```
- ✅ Good: Single state object (better than multiple useState)
- ✅ Good: Clear state structure

**Lines 152-311:** generateAI function
```typescript
const generateAI = React.useCallback(
  async (links: string[]): Promise<void> => {
    // ... validation ...
    
    // Create abort controller for request cancellation
    abortControllerRef.current = new AbortController();

    try {
      const request: GenerateProjectAIRequest = {
        fileLinks: validation.links,
      };

      const response = await fetch(`/api/projects/${projectId}/ai-generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
        signal: abortControllerRef.current.signal,
      });
      // ... error handling ...
      
      const data: GenerateProjectAIResponse = await response.json();

      // Update form fields with AI-generated data
      form.setValue("description", data.description, { shouldValidate: true });
      form.setValue("technologies", data.technologies, { shouldValidate: true });
      // ...
    } catch (error) {
      // ... error handling ...
    }
  },
  [projectId, form, onUpdateProject]
);
```
- ✅ Good: Request cancellation support (AbortController)
- ⚠️ Issue: Direct fetch call
- ⚠️ Issue: Form manipulation inside hook (tight coupling)
- 💡 Consider: Use API service
- 💡 Consider: Return data instead of updating form directly

#### Refactoring Considerations

**Approach 1: Extract to API Service**
- **Pros:** 
  - Consistent with other API calls
  - Centralized error handling
- **Cons:** 
  - Need to handle AbortController
- **Recommendation:** ✅ Recommended

**Approach 2: Decouple Form Updates**
- **Pros:** 
  - More flexible hook
  - Easier to test
- **Cons:** 
  - Caller needs to handle updates
- **Recommendation:** ⚠️ Consider - current approach is convenient

### Summary of Key Issues

1. **Code Duplication:**
   - Error handling duplicated across hooks
   - Status code handling duplicated
   - Field rendering patterns duplicated
   - URL validation duplicated in schema

2. **Component Complexity:**
   - ProjectForm.tsx is too large (410 lines)
   - Mixes multiple concerns (rendering, logic, state)
   - Field components are repetitive

3. **API Call Management:**
   - Direct fetch calls scattered across hooks
   - No centralized API service
   - Inconsistent error handling
   - No request cancellation (except AI)

4. **Form Optimization:**
   - Using `watch()` instead of `useWatch()`
   - Not using `FormProvider` / `useFormContext`
   - Prop drilling through components

5. **State Management:**
   - Multiple useState calls (could use useReducer)
   - Mixing form state with local state
   - Complex useEffect dependencies

### Recommended Refactoring Priority

1. **High Priority:** API Service Layer
   - Immediate improvement in code organization
   - Enables consistent error handling
   - Foundation for other improvements

2. **High Priority:** Extract Field Components
   - Reduces ProjectForm complexity significantly
   - Improves testability
   - Better separation of concerns

3. **Medium Priority:** Optimize React Hook Form Usage
   - Better performance
   - Cleaner code
   - Reduces prop drilling

4. **Medium Priority:** Extract Validation Logic
   - Reduces duplication
   - Consistent validation UI
   - Easier to maintain

5. **Low Priority:** Extract Submission Logic
   - Only if pattern repeats in many forms
   - Might be over-engineering for current needs

</refactoring_breakdown>

## 1. Analysis

### 1.1 Component Overview

#### ProjectEditView.tsx (89 lines)
**Main Functionalities:**
- Container component for editing existing projects
- Manages loading state while fetching project data
- Handles error states and displays error messages
- Renders `ProjectForm` with edit-specific props
- Provides navigation back to projects list

**Key Responsibilities:**
- Data fetching orchestration (via `useProjectEditForm` hook)
- Loading/error UI rendering
- Navigation handling

#### NewProjectView.tsx (44 lines)
**Main Functionalities:**
- Container component for creating new projects
- Renders `ProjectForm` with create-specific props
- Provides navigation back to projects list

**Key Responsibilities:**
- Form initialization (via `useProjectForm` hook)
- Navigation handling
- Minimal state management

#### ProjectForm.tsx (410 lines)
**Main Functionalities:**
- Shared form component for both create and edit modes
- Renders all form fields (name, description, technologies, status, URLs)
- Manages technology list (add/remove)
- Integrates AI generation section (edit mode only)
- Handles form submission and validation feedback
- Provides visual feedback for field validation

**Key Responsibilities:**
- Form field rendering and management
- Technology array manipulation
- Form validation UI feedback
- AI section integration
- Form submission handling

### 1.2 Form-Related Logic

#### Current React Hook Form Implementation

**Already Using React Hook Form:**
- ✅ `useProjectForm` hook uses `useForm` from react-hook-form
- ✅ `useProjectEditForm` hook uses `useForm` from react-hook-form
- ✅ Zod validation schemas (`createProjectFormSchema`, `updateProjectFormSchema`)
- ✅ Form validation with `zodResolver`
- ✅ Form state management via hooks

**Form Logic Locations:**

1. **useProjectForm.ts** (213 lines)
   - Form initialization with default values
   - Form schema definition (`createProjectFormSchema`)
   - Form submission handler (`onSubmit`)
   - Data transformation (`transformFormData`)
   - Server error mapping (`mapServerErrorsToForm`)

2. **useProjectEditForm.ts** (213 lines)
   - Form initialization
   - Project data fetching and form reset
   - Form schema definition (`updateProjectFormSchema`)
   - Form submission handler (`onSubmit`)
   - Query count fetching for AI feature

3. **ProjectForm.tsx** (410 lines)
   - Form field rendering
   - Technology management logic (lines 72-90)
   - Form validation feedback UI
   - Field watching for real-time validation
   - Controller usage for Select component

**Form Data Flow:**
```
NewProjectView → useProjectForm → ProjectForm → onSubmit → API
ProjectEditView → useProjectEditForm → ProjectForm → onSubmit → API
```

### 1.3 Areas of High Complexity

#### ProjectForm.tsx - Complexity Issues

1. **Large Component Size (410 lines)**
   - Single component handles too many responsibilities
   - Mixing presentation, logic, and state management
   - Difficult to test individual parts

2. **Technology Management Logic (lines 62-90)**
   ```typescript
   const watchedTechnologies = watch("technologies");
   const [newTechnology, setNewTechnology] = React.useState("");
   // ... add/remove logic
   ```
   - Local state mixed with form state
   - Logic could be extracted to custom hook
   - Duplicate validation logic

3. **Form Field Rendering (lines 102-375)**
   - Repetitive field rendering patterns
   - Similar error handling for each field
   - Validation feedback logic duplicated
   - Could be extracted to reusable field components

4. **AI Integration (lines 65-70, 245-256)**
   - Tight coupling with `useAIGeneration` hook
   - Conditional rendering logic mixed with form
   - State management spread across multiple hooks

5. **Validation Feedback Logic**
   - Green border logic duplicated for each field (lines 117, 145, 312, 332, 362)
   - Success message logic repeated
   - Character count display logic

#### useProjectEditForm.ts - Complexity Issues

1. **Large useEffect (lines 66-127)**
   - Fetches project data
   - Resets form
   - Fetches query count
   - Error handling
   - Could be split into separate concerns

2. **Complex onSubmit (lines 129-201)**
   - API call handling
   - Error parsing and mapping
   - Status code handling (401, 403, 404)
   - Navigation logic
   - Toast notifications
   - 72 lines of nested conditionals

3. **Error State Management**
   - Multiple error states (`error`, form errors)
   - Error handling duplicated from `useProjectForm`

#### useProjectForm.ts - Complexity Issues

1. **Complex onSubmit (lines 150-205)**
   - Similar structure to `useProjectEditForm.onSubmit`
   - Duplicated error handling logic
   - Status code handling
   - Navigation logic

2. **Shared Utilities**
   - `transformFormData` and `mapServerErrorsToForm` are shared
   - But error handling patterns are duplicated

### 1.4 API Call Locations

#### Direct Fetch Calls

1. **useProjectForm.ts** (lines 157-163)
   ```typescript
   const response = await fetch("/api/projects", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify(projectData),
   });
   ```

2. **useProjectEditForm.ts** (lines 72-77, 137-143)
   ```typescript
   // Fetch project
   const response = await fetch(`/api/projects/${projectId}`, {
     method: "GET",
     // ...
   });
   
   // Update project
   const response = await fetch(`/api/projects/${projectId}`, {
     method: "PATCH",
     // ...
   });
   ```

3. **useAIGeneration.ts** (lines 203-211)
   ```typescript
   const response = await fetch(`/api/projects/${projectId}/ai-generate`, {
     method: "POST",
     // ...
   });
   ```

#### API Call Issues

1. **No Centralized API Service**
   - Direct `fetch` calls scattered across hooks
   - Inconsistent error handling
   - No request cancellation support
   - No retry logic
   - Duplicated headers and request setup

2. **Error Handling Duplication**
   - Similar error parsing in multiple places
   - Status code handling duplicated (401, 403, 404)
   - Network error detection via string matching
   - Error message extraction logic repeated

3. **No Type Safety**
   - Response types not guaranteed
   - Error response structure not typed
   - No request/response DTO validation

4. **Missing Features**
   - No request cancellation (except AI generation)
   - No request interceptors
   - No response transformation layer
   - No request/response logging

## 2. Refactoring Plan

### 2.1 Component Structure Changes

#### 2.1.1 Extract Form Field Components

**Create Reusable Field Components:**

1. **ProjectNameField.tsx**
   - Extract name input field (lines 103-128)
   - Include validation feedback logic
   - Props: `form`, `errors`, `touchedFields`

2. **ProjectDescriptionField.tsx**
   - Extract description textarea (lines 131-167)
   - Include character count display
   - Props: `form`, `errors`, `touchedFields`

3. **ProjectTechnologiesField.tsx**
   - Extract technologies management (lines 169-242)
   - Move technology logic to custom hook
   - Props: `form`, `errors`, `touchedFields`

4. **ProjectStatusField.tsx**
   - Extract status select (lines 258-290)
   - Props: `form`, `errors`, `control`

5. **ProjectUrlField.tsx** (reusable for repo/demo/preview)
   - Extract URL input pattern (lines 292-375)
   - Props: `form`, `errors`, `touchedFields`, `fieldName`, `label`, `placeholder`

**Benefits:**
- Reduces `ProjectForm.tsx` from 410 to ~150 lines
- Improves testability (test fields independently)
- Enables reuse across different forms
- Better separation of concerns

#### 2.1.2 Extract Technology Management Hook

**Create `useTechnologyManagement.ts`:**

```typescript
export function useTechnologyManagement(
  form: UseFormReturn<ProjectFormData>,
  maxTechnologies: number = 10
) {
  const watchedTechnologies = watch("technologies");
  const [newTechnology, setNewTechnology] = useState("");
  
  const addTechnology = useCallback(() => {
    // Add logic
  }, []);
  
  const removeTechnology = useCallback((index: number) => {
    // Remove logic
  }, []);
  
  return {
    technologies: watchedTechnologies,
    newTechnology,
    setNewTechnology,
    addTechnology,
    removeTechnology,
    canAddMore: (watchedTechnologies?.length ?? 0) < maxTechnologies,
  };
}
```

**Benefits:**
- Separates technology logic from form component
- Reusable across different forms
- Easier to test
- Cleaner component code

#### 2.1.3 Simplify Container Components

**ProjectEditView.tsx:**
- Keep as thin container
- Move loading/error UI to separate components if needed
- Consider extracting navigation to shared component

**NewProjectView.tsx:**
- Already minimal, no changes needed
- Consider extracting navigation to shared component

**Shared Navigation Component:**
```typescript
// BackToProjectsButton.tsx
export function BackToProjectsButton() {
  const handleClick = () => {
    window.location.href = "/projects";
  };
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className="mb-4 -ml-2"
      aria-label="Powrót do listy projektów"
    >
      <ArrowLeft className="size-4 mr-2" />
      Powrót
    </Button>
  );
}
```

### 2.2 React Hook Form Implementation

#### 2.2.1 Current State Assessment

**Already Well Implemented:**
- ✅ Using `useForm` with proper configuration
- ✅ Zod validation schemas
- ✅ `zodResolver` integration
- ✅ Form mode set to "onChange" for live validation
- ✅ Proper form state management

#### 2.2.2 Optimization Opportunities

**1. Use `useFormContext` for Deeply Nested Fields**

Instead of prop drilling `form` to field components:
```typescript
// ProjectForm.tsx
<FormProvider {...form}>
  <ProjectNameField />
  <ProjectDescriptionField />
</FormProvider>

// ProjectNameField.tsx
const { register, formState: { errors } } = useFormContext();
```

**Benefits:**
- Reduces prop drilling
- Cleaner component APIs
- Better performance (only re-renders when form state changes)

**2. Optimize Re-renders with `useWatch`**

Replace `watch()` calls with `useWatch()` for specific fields:
```typescript
// Instead of:
const watchedTechnologies = watch("technologies");

// Use:
const watchedTechnologies = useWatch({ control, name: "technologies" });
```

**Benefits:**
- Only re-renders when specific field changes
- Better performance for large forms
- More granular control

**3. Use `Controller` Consistently**

Currently only used for Select. Consider using for all fields for consistency:
- Better control over validation timing
- Easier to add custom validation logic
- Consistent API across all fields

**4. Add Form Reset on Success**

After successful submission, reset form state:
```typescript
form.reset(); // Clear form after successful create
form.reset(updatedData); // Reset with new data after successful update
```

**5. Use `trigger` for Manual Validation**

For technology field, trigger validation after add/remove:
```typescript
setValue("technologies", updated, { shouldValidate: true });
// Already doing this, good!
```

#### 2.2.3 Form Schema Improvements

**Current Schema Issues:**

1. **URL Validation Complexity** (lines 24-41 in useProjectForm.ts)
   - Complex union and transform logic
   - Could be simplified with custom Zod refinement

**Proposed Improvement:**
```typescript
const urlSchema = z
  .string()
  .optional()
  .transform((val) => (val === "" || val === null ? null : val))
  .refine((val) => val === null || z.string().url().safeParse(val).success, {
    message: "Nieprawidłowy format URL",
  });

export const createProjectFormSchema = z.object({
  // ...
  repoUrl: urlSchema,
  demoUrl: urlSchema,
  previewUrl: urlSchema,
});
```

**Benefits:**
- Reduces duplication
- Easier to maintain
- Consistent validation logic

### 2.3 Logic Optimization

#### 2.3.1 Extract Validation Feedback Logic

**Create `useFieldValidationFeedback.ts`:**
```typescript
export function useFieldValidationFeedback<TFieldName extends FieldPath<FormData>>(
  form: UseFormReturn<FormData>,
  fieldName: TFieldName,
  validationRules?: {
    minLength?: number;
    customValidator?: (value: unknown) => boolean;
  }
) {
  const value = useWatch({ control: form.control, name: fieldName });
  const error = form.formState.errors[fieldName];
  const touched = form.formState.touchedFields[fieldName];
  
  const isValid = touched && !error && (
    validationRules?.customValidator 
      ? validationRules.customValidator(value)
      : true
  );
  
  const showSuccess = isValid && value;
  
  return {
    hasError: !!error,
    errorMessage: error?.message,
    isValid,
    showSuccess,
    className: showSuccess 
      ? "border-green-500 dark:border-green-600" 
      : "",
  };
}
```

**Usage:**
```typescript
const nameFeedback = useFieldValidationFeedback(form, "name");
<Input className={nameFeedback.className} />
{nameFeedback.showSuccess && <p>Wygląda dobrze!</p>}
```

**Benefits:**
- Eliminates duplication
- Consistent validation feedback
- Easier to maintain
- Type-safe

#### 2.3.2 Simplify Error Handling

**Current Issues:**
- Error handling duplicated in `useProjectForm` and `useProjectEditForm`
- Status code handling repeated
- Error message extraction logic duplicated

**Proposed Solution:**

Create `useApiErrorHandler.ts`:
```typescript
export function useApiErrorHandler(form: UseFormReturn<any>) {
  const handleApiError = useCallback(async (
    response: Response,
    defaultMessage: string
  ) => {
    let errorMessage = defaultMessage;
    let errorDetails: string[] | undefined;

    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
      errorDetails = errorData.details;
      mapServerErrorsToForm(errorDetails, form);
    } catch {
      // Parsing failed
    }

    // Handle status codes
    if (response.status === 401) {
      window.location.href = "/login";
      return;
    }

    if (response.status === 403) {
      toast.error("Brak dostępu");
      window.location.href = "/projects";
      return;
    }

    if (response.status === 404) {
      toast.error("Nie znaleziono");
      window.location.href = "/projects";
      return;
    }

    toast.error(errorMessage);
  }, [form]);

  return { handleApiError };
}
```

**Usage:**
```typescript
const { handleApiError } = useApiErrorHandler(form);

if (!response.ok) {
  await handleApiError(response, "Nie udało się utworzyć projektu");
  return;
}
```

**Benefits:**
- Single source of truth for error handling
- Consistent error handling across forms
- Easier to update error handling logic
- Reduces code duplication

#### 2.3.3 Extract Form Submission Logic

**Create `useFormSubmission.ts`:**
```typescript
export function useFormSubmission<TData>(
  form: UseFormReturn<TData>,
  options: {
    transformData: (data: TData) => unknown;
    onSuccess: (response: unknown) => void;
    onError?: (error: Error) => void;
    getApiEndpoint: (data: TData) => string;
    method: "POST" | "PATCH";
  }
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { handleApiError } = useApiErrorHandler(form);

  const submit = useCallback(async (data: TData) => {
    setIsSubmitting(true);
    
    try {
      const transformedData = options.transformData(data);
      const endpoint = options.getApiEndpoint(data);
      
      const response = await fetch(endpoint, {
        method: options.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transformedData),
      });

      if (!response.ok) {
        await handleApiError(response, "Operacja nie powiodła się");
        return;
      }

      const result = await response.json();
      options.onSuccess(result);
    } catch (error) {
      options.onError?.(error as Error);
    } finally {
      setIsSubmitting(false);
    }
  }, [form, options]);

  return { submit, isSubmitting };
}
```

**Benefits:**
- Reusable submission logic
- Consistent error handling
- Easier to test
- Reduces hook complexity

### 2.4 API Call Management

#### 2.4.1 Create Project API Service

**Following the pattern from `AuthService`, create `ProjectService`:**

```typescript
// src/lib/services/project.service.ts
export class ProjectService {
  private readonly baseUrl: string;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    defaultError: string
  ): Promise<T> {
    // Similar to AuthService.request
    // Handle errors, network issues, etc.
  }

  async createProject(data: CreateProjectDto): Promise<ProjectDto> {
    return this.request<ProjectDto>(
      "/api/projects",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      "Nie udało się utworzyć projektu"
    );
  }

  async getProject(id: string): Promise<ProjectDto> {
    return this.request<ProjectDto>(
      `/api/projects/${id}`,
      { method: "GET" },
      "Nie udało się pobrać projektu"
    );
  }

  async updateProject(id: string, data: UpdateProjectDto): Promise<ProjectDto> {
    return this.request<ProjectDto>(
      `/api/projects/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
      "Nie udało się zaktualizować projektu"
    );
  }

  async getProjectQueryCount(id: string): Promise<number> {
    return this.request<{ count: number }>(
      `/api/projects/${id}/query-count`,
      { method: "GET" },
      "Nie udało się pobrać liczby zapytań"
    ).then((data) => data.count);
  }
}
```

**Benefits:**
- Centralized API logic
- Consistent error handling
- Type-safe API calls
- Easier to test
- Can add retry logic, interceptors, etc.

#### 2.4.2 Update Hooks to Use Service

**useProjectForm.ts:**
```typescript
export function useProjectForm(): UseProjectFormReturn {
  const form = useForm<CreateProjectFormData>({ /* ... */ });
  const projectService = useMemo(() => new ProjectService(), []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: CreateProjectFormData) => {
    setIsSubmitting(true);
    
    try {
      const projectData = transformFormData(data) as CreateProjectDto;
      const createdProject = await projectService.createProject(projectData);
      
      toast.success("Projekt został pomyślnie dodany");
      window.location.href = "/projects";
    } catch (error) {
      // Error handling via service
      if (error instanceof ApiError && error.field) {
        form.setError(error.field, { message: error.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return { form, isSubmitting, onSubmit };
}
```

**useProjectEditForm.ts:**
```typescript
export function useProjectEditForm(projectId: string): UseProjectEditFormReturn {
  const form = useForm<UpdateProjectFormData>({ /* ... */ });
  const projectService = useMemo(() => new ProjectService(), []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AIErrorType | null>(null);
  const [queryCount, setQueryCount] = useState(0);

  useEffect(() => {
    const fetchProject = async () => {
      setIsLoading(true);
      try {
        const project = await projectService.getProject(projectId);
        form.reset({
          name: project.name,
          description: project.description,
          technologies: project.technologies,
          status: project.status,
          repoUrl: project.repoUrl,
          demoUrl: project.demoUrl,
          previewUrl: project.previewUrl,
        });
        
        const count = await projectService.getProjectQueryCount(projectId);
        setQueryCount(count);
      } catch (error) {
        setError({ message: error.message });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProject();
  }, [projectId, form, projectService]);

  const onSubmit = async (data: UpdateProjectFormData) => {
    setIsSubmitting(true);
    try {
      const updateData = transformFormData(data) as UpdateProjectDto;
      await projectService.updateProject(projectId, updateData);
      
      toast.success("Projekt został pomyślnie zaktualizowany");
      window.location.href = "/projects";
    } catch (error) {
      // Error handling
    } finally {
      setIsSubmitting(false);
    }
  };

  return { form, isSubmitting, isLoading, onSubmit, error, queryCount };
}
```

#### 2.4.3 Error Handling Strategy

**Create Typed Error System:**

```typescript
// src/lib/utils/api-error.ts
export enum ApiErrorType {
  NETWORK = "NETWORK",
  VALIDATION = "VALIDATION",
  SERVER = "SERVER",
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  NOT_FOUND = "NOT_FOUND",
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly type: ApiErrorType,
    public readonly statusCode?: number,
    public readonly field?: string,
    public readonly details?: string[]
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function parseApiError(
  response: Response,
  errorData: unknown,
  defaultMessage: string
): ApiError {
  const status = response.status;
  let type: ApiErrorType;
  let message = defaultMessage;
  let details: string[] | undefined;

  if (status === 401) {
    type = ApiErrorType.AUTHENTICATION;
    message = "Nieautoryzowany dostęp";
  } else if (status === 403) {
    type = ApiErrorType.AUTHORIZATION;
    message = "Brak dostępu";
  } else if (status === 404) {
    type = ApiErrorType.NOT_FOUND;
    message = "Nie znaleziono";
  } else if (status === 400) {
    type = ApiErrorType.VALIDATION;
    if (errorData && typeof errorData === "object" && "details" in errorData) {
      details = errorData.details as string[];
    }
  } else if (status >= 500) {
    type = ApiErrorType.SERVER;
    message = "Błąd serwera";
  } else {
    type = ApiErrorType.SERVER;
  }

  if (errorData && typeof errorData === "object" && "error" in errorData) {
    message = errorData.error as string;
  }

  return new ApiError(message, type, status, undefined, details);
}
```

**Update ProjectService to use typed errors:**
```typescript
private async request<T>(/* ... */): Promise<T> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw parseApiError(response, errorData, defaultError);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network error
    throw new ApiError(
      "Błąd połączenia z serwerem",
      ApiErrorType.NETWORK
    );
  }
}
```

#### 2.4.4 Request Cancellation Support

**Add AbortController support to ProjectService:**
```typescript
export class ProjectService {
  private abortControllers = new Map<string, AbortController>();

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    defaultError: string,
    requestId?: string
  ): Promise<T> {
    // Cancel previous request with same ID
    if (requestId) {
      this.abortControllers.get(requestId)?.abort();
    }

    const controller = new AbortController();
    if (requestId) {
      this.abortControllers.set(requestId, controller);
    }

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      // ... rest of logic
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new ApiError("Request cancelled", ApiErrorType.NETWORK);
      }
      throw error;
    } finally {
      if (requestId) {
        this.abortControllers.delete(requestId);
      }
    }
  }

  cancelRequest(requestId: string): void {
    this.abortControllers.get(requestId)?.abort();
    this.abortControllers.delete(requestId);
  }
}
```

**Use in hooks:**
```typescript
useEffect(() => {
  const requestId = `fetch-project-${projectId}`;
  const fetchProject = async () => {
    // ... fetch logic
  };
  
  fetchProject();
  
  return () => {
    projectService.cancelRequest(requestId);
  };
}, [projectId]);
```

## 3. Testing Strategy

### 3.1 Component Testing

**ProjectForm.tsx:**
- Test form field rendering
- Test technology add/remove
- Test form validation feedback
- Test form submission
- Test AI section integration (edit mode)

**ProjectEditView.tsx:**
- Test loading state
- Test error state
- Test successful form rendering
- Test navigation

**NewProjectView.tsx:**
- Test form rendering
- Test navigation

**Field Components (after extraction):**
- Test individual field rendering
- Test validation feedback
- Test error display
- Test success indicators

### 3.2 Hook Testing

**useProjectForm:**
- Test form initialization
- Test form submission success
- Test form submission errors
- Test server error mapping
- Test navigation on success

**useProjectEditForm:**
- Test project data fetching
- Test form reset with project data
- Test query count fetching
- Test form submission
- Test error handling

**useTechnologyManagement:**
- Test adding technologies
- Test removing technologies
- Test max technologies limit
- Test duplicate prevention

**useFieldValidationFeedback:**
- Test validation states
- Test success feedback
- Test error display

### 3.3 Service Testing

**ProjectService:**
- Test createProject
- Test getProject
- Test updateProject
- Test getProjectQueryCount
- Test error handling
- Test request cancellation

### 3.4 Integration Testing

**Form Submission Flow:**
- Test create flow end-to-end
- Test edit flow end-to-end
- Test error scenarios
- Test navigation after success

**AI Integration:**
- Test AI generation flow
- Test form update after AI generation
- Test query count updates

### 3.5 Edge Cases

1. **Network Errors:**
   - Test offline scenario
   - Test timeout scenario
   - Test server error (500)

2. **Validation Edge Cases:**
   - Test empty form submission
   - Test max length validation
   - Test URL format validation
   - Test technology limits

3. **Concurrent Requests:**
   - Test multiple rapid submissions
   - Test cancellation of previous requests

4. **Form State:**
   - Test form reset after submission
   - Test form state persistence (if needed)
   - Test form state cleanup on unmount

## 4. Implementation Priority

### Phase 1: API Service Layer (High Priority)
1. Create `ProjectService` class
2. Create error handling utilities
3. Update hooks to use service
4. Add request cancellation support

**Benefits:** Immediate improvement in code organization and error handling

### Phase 2: Extract Field Components (Medium Priority)
1. Create reusable field components
2. Extract technology management hook
3. Refactor `ProjectForm` to use new components

**Benefits:** Improved maintainability and testability

### Phase 3: Optimize React Hook Form Usage (Medium Priority)
1. Implement `useFormContext`
2. Optimize with `useWatch`
3. Improve form schemas

**Benefits:** Better performance and cleaner code

### Phase 4: Extract Validation Logic (Low Priority)
1. Create `useFieldValidationFeedback`
2. Create `useFormSubmission`
3. Create `useApiErrorHandler`

**Benefits:** Further code deduplication and consistency

## 5. Migration Strategy

### Step-by-Step Migration

1. **Create API Service** (non-breaking)
   - Add new `ProjectService` class
   - Keep existing hooks working
   - Test new service independently

2. **Update Hooks Gradually** (non-breaking)
   - Update `useProjectForm` first
   - Test thoroughly
   - Update `useProjectEditForm` second
   - Test thoroughly

3. **Extract Components** (non-breaking)
   - Create field components
   - Update `ProjectForm` to use them
   - Test each field component

4. **Optimize Form Usage** (non-breaking)
   - Add `FormProvider`
   - Update field components to use `useFormContext`
   - Test form functionality

5. **Extract Validation Logic** (non-breaking)
   - Create validation hooks
   - Update components to use them
   - Remove duplicated code

### Backward Compatibility

- All changes maintain existing component APIs
- No breaking changes to props or return values
- Gradual migration allows testing at each step
- Can rollback individual changes if needed

## 6. Success Metrics

### Code Quality
- Reduce `ProjectForm.tsx` from 410 to ~150 lines
- Reduce hook complexity (cyclomatic complexity)
- Increase code reuse (field components)
- Improve test coverage

### Maintainability
- Single source of truth for API calls
- Consistent error handling
- Easier to add new fields
- Easier to modify validation logic

### Performance
- Reduced re-renders (via `useWatch`)
- Request cancellation support
- Better form state management

### Developer Experience
- Cleaner component code
- Better TypeScript types
- Easier to test
- Better error messages

