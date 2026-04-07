/* tdt4242-exercise-g05/frontend/src/__tests__/setupTests.js
 *
 * Shared test setup for Vitest + React Testing Library + jest-dom.
 *
 * This file is referenced from the Vite/Vitest test configuration and is
 * executed before each test suite. It configures:
 *  - jest-dom matchers on the Vitest expect
 *  - Testing Library cleanup behavior
 *  - Basic global fetch mock hook (optional extension in individual tests)
 */

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';

// Run cleanup after each test so React Testing Library unmounts components
// and clears the DOM between tests.
afterEach(() => {
  cleanup();
});

/**
 * Optional: provide a simple default fetch mock.
 *
 * Individual test files are still free to overwrite or spyOn(global.fetch)
 * for more specific behavior. This just ensures that tests which
 * accidentally call fetch without mocking will fail loudly instead of
 * hitting the network.
 */
if (!global.fetch) {
  global.fetch = async () => {
    throw new Error(
      'global.fetch was called from a test without being mocked. ' +
        'Mock fetch in your test file (e.g., vi.spyOn(global, "fetch") ...).'
    );
  };
}
