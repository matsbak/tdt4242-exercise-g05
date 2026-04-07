// Setup file to run before all tests
process.env.NODE_ENV = 'test';

// Global teardown - just close the database, don't delete (it will be reused)
import { afterAll } from 'vitest';
import { closeDatabase } from './db.js';

afterAll(() => {
  closeDatabase();
});
