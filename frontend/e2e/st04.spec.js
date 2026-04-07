import { test, expect } from '@playwright/test';

test('ST04 - Student cannot proceed to review/submit without AI declaration (client validation)', async ({ page }) => {
  // Mock assignments list with one assignment
  await page.route('**/api/assignments', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 501,
          title: 'Validation Assignment ST04',
          course_id: 'TDT4242',
          created_by: 'instructor_user',
          created_at: new Date().toISOString(),
        },
      ]),
    });
  });

  // Open app and navigate to Submit Assignment
  await page.goto('/');
  await page.locator('nav').getByRole('button', { name: 'Submit Assignment' }).click();

  // Click Submit Assignment on the assignment card to open form
  const card = page.locator('.assignment-card', { hasText: 'Validation Assignment ST04' });
  await card.getByRole('button', { name: 'Submit Assignment' }).click();

  // Ensure AI declaration is empty (default)
  await expect(page.locator('#ai-declaration')).toHaveValue('');

  // Click Review & Confirm Logs; client-side validation should prevent modal and show error
  await page.getByRole('button', { name: 'Review & Confirm Logs' }).click();

  // Expect the specific validation error message to be visible
  await expect(
    page.getByText('Please provide an AI declaration summarizing your AI usage for this assignment.'),
  ).toBeVisible();
});
