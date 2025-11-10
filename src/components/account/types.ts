// Frontend types for account components
// These types are used only in frontend components, not in API endpoints

import type { UserDto } from "../../types";

// Account view model for managing account state
export interface AccountViewModel {
  user: UserDto | null;
  isLoading: boolean;
  error: string | null;
  isDeleting: boolean;
}
