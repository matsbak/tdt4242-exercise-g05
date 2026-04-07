import { test, expect } from '@playwright/test';

test.describe('ST01 - Student assignment submission flow', () => {
  test('student can submit an assignment with manual AI log and confirm automatic logs', async ({ page }) => {
    // Mock assignments list returned by the backend
    await page.route('**/api/assignments', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 101,
            title: 'Test Assignment ST01',
            description: 'A sample assignment for E2E',
            course_id: 'TDT4242',
            created_by: 'instructor_user',
            created_at: new Date().toISOString(),
            updated_at: null,
            require_extra_ai_logs: 0,
            require_extra_declarations: 0,
            extra_ai_logs_content: null,
            extra_declarations_content: null,
          },
        ]),
      });
    });

    // Intercept submit endpoint and return a simulated successful submission
    await page.route('**/api/assignments/101/submit', async (route) => {
      let post = {};
      try {
        post = (await route.request().postDataJSON()) || {};
      } catch {
        // ignore parse errors - keep post empty
        post = {};
      }

      const manualLogs = (post.ai_logs || [])
        .filter((l) => l && l.tool_name && l.tool_name.trim())
        .map((l, i) => ({
          id: i + 1,
          tool_name: l.tool_name,
          description: l.description || null,
          purpose: l.purpose || null,
          created_at: new Date().toISOString(),
        }));

      const simulatedLogs = post.confirmed_automatic_logs
        ? [
            {
              id: 1001,
              tool_name: 'ChatGPT',
              prompt_text: 'How should I structure a React component?',
              answer_text: 'Use useEffect for fetching...',
              description: 'Used to brainstorm solution structure',
              purpose: 'Clarified possible implementation approaches',
              duration_minutes: 12,
              created_at: new Date().toISOString(),
            },
          ]
        : [];

      const response = {
        submission: {
          id: 201,
          assignment_id: 101,
          student_id: post.student_id || 'student_001',
          submission_text: post.submission_text || null,
          submitted_at: new Date().toISOString(),
        },
        ai_declaration: {
          id: 301,
          assignment_id: 101,
          student_id: post.student_id || 'student_001',
          declaration_text: post.ai_declaration || '',
          created_at: new Date().toISOString(),
        },
        manual_ai_logs: manualLogs,
        simulated_ai_logs: simulatedLogs,
      };

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });

    // Visit the app
    await page.goto('/');

    // Navigate to Submit Assignment via the navigation bar
    // The nav has a button labeled "Submit Assignment"
    await page.locator('nav').getByRole('button', { name: 'Submit Assignment' }).click();

    // Ensure the assignment card is visible
    await expect(page.getByText('Test Assignment ST01')).toBeVisible();

    // Click the assignment's Submit Assignment button inside the assignment card
    const assignmentCard = page.locator('.assignment-card', { hasText: 'Test Assignment ST01' });
    await expect(assignmentCard).toBeVisible();
    await assignmentCard.getByRole('button', { name: 'Submit Assignment' }).click();

    // Fill a manual AI log
    await page.fill('#tool-name-0', 'GitHub Copilot');
    await page.fill('#context-0', 'Used to generate route boilerplate');
    await page.fill('#purpose-0', 'Saved time writing handlers');

    // Fill AI declaration (required)
    await page.fill('#ai-declaration', 'I used Copilot to scaffold some backend routes and ChatGPT to refine wording.');

    // Click Review & Confirm Logs button
    await page.getByRole('button', { name: 'Review & Confirm Logs' }).click();

    // Confirmation modal should appear
    await expect(page.getByText('Review & Confirm Automatic AI Usage Logs')).toBeVisible();

    // Acknowledge the declaration checkbox in the modal
    await page.locator('.acknowledgment-checkbox').check();

    // Confirm & Submit
    await page.getByRole('button', { name: 'Confirm & Submit Assignment' }).click();

    // After successful submission, success message should appear
    await expect(page.getByText('submitted successfully')).toBeVisible();

    // Manual log should be listed in the success view
    await expect(page.getByText('GitHub Copilot')).toBeVisible();

    // Confirm simulated log is present (since we confirmed automatic logs)
    await expect(page.getByText('ChatGPT')).toBeVisible();
  });
});
