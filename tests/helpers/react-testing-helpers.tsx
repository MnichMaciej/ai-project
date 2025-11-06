import { render } from '@testing-library/react';
import type { ReactElement } from 'react';

/**
 * Custom render function that includes providers
 * Use this instead of the default render from @testing-library/react
 */
export function renderWithProviders(ui: ReactElement, options = {}) {
  return render(ui, {
    ...options,
  });
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

