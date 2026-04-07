import { test, expect } from '@playwright/test';

test('ST03 - Instructor dashboard filtering by course works and Clear Filter restores view', async ({ page }) => {
  // Mock the assignments endpoint to return two assignments for different courses
  await page.route('**/api/assignments', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 401,
          title: 'Course A Assignment',
          course_id: 'COURSEA',
          created_by: 'instructor_user',
          created_at: new Date().toISOString(),
        },
        {
          id: 402,
          title: 'TDT4242 Assignment',
          course_id: 'TDT4242',
          created_by: 'instructor_user',
          created_at: new Date().toISOString(),
        },
      ]),
    });
  });

  // Mock the filtered assignments route for course TDT4242
  await page.route('**/api/assignments/course/TDT4242', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 402,
          title: 'TDT4242 Assignment',
          course_id: 'TDT4242',
          created_by: 'instructor_user',
          created_at: new Date().toISOString(),
        },
      ]),
    });
  });

  // Open the app (defaults to dashboard)
  await page.goto('/');

  // Ensure the dashboard header is visible
  await expect(page.getByText('Instructor Dashboard')).toBeVisible();

  // Type the course filter value
  await page.fill('#course-select', 'TDT4242');

  // The dashboard should indicate it's showing filtered results
  await expect(page.getByText('Showing assignments for TDT4242')).toBeVisible();

  // The filtered assignment should be visible
  await expect(page.getByText('TDT4242 Assignment')).toBeVisible();

  // Click the clear filter button
  await page.getByRole('button', { name: 'Clear Filter' }).click();

  // The dashboard should indicate it's showing all assignments again
  await expect(page.getByText('Showing all assignments')).toBeVisible();

  // Both assignments from the base route should be visible
  await expect(page.getByText('Course A Assignment')).toBeVisible();
  await expect(page.getByText('TDT4242 Assignment')).toBeVisible();
});
