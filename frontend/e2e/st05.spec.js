import { test, expect } from "@playwright/test";

test("ST05 - Backend 400 when student_id missing; frontend surfaces backend error", async ({
  page,
}) => {
  // Mock GET /api/assignments to return the assignment used in this test
  await page.route("**/api/assignments", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: 602,
          title: "Submission Error Assignment ST05",
          course_id: "TDT4242",
          created_by: "instructor_user",
          created_at: new Date().toISOString(),
        },
      ]),
    });
  });

  // Intercept the submit endpoint to simulate a backend 400 response
  await page.route("**/api/assignments/602/submit", async (route) => {
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({ error: "Missing required field: student_id" }),
    });
  });

  // Open the app and navigate to Submit Assignment page
  await page.goto("/");
  await page
    .locator("nav")
    .getByRole("button", { name: "Submit Assignment" })
    .click();

  // Ensure the student-id input is visible on the assignments list and clear it
  // (the student-id input exists only on the list view; clear it before selecting an assignment)
  await expect(page.locator("#student-id")).toBeVisible();
  await page.fill("#student-id", "");

  // Select the assignment card and click its submit button
  const card = page.locator(".assignment-card", {
    hasText: "Submission Error Assignment ST05",
  });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Submit Assignment" }).click();

  // Wait for the AI declaration textarea to appear in the submission form, then fill it
  await expect(page.locator("#ai-declaration")).toBeVisible();
  await page.fill(
    "#ai-declaration",
    "This is a valid declaration for testing ST05.",
  );

  // Open the confirmation modal
  await page.getByRole("button", { name: "Review & Confirm Logs" }).click();
  await expect(
    page.getByText("Review & Confirm Automatic AI Usage Logs"),
  ).toBeVisible();

  // Acknowledge the declaration (the UI requires this before submission)
  await page.locator(".acknowledgment-checkbox").check();

  // Attempt to confirm & submit — the mocked backend will return 400
  await page
    .getByRole("button", { name: "Confirm & Submit Assignment" })
    .click();

  // The frontend should surface the backend error message
  await expect(
    page.getByText("Missing required field: student_id"),
  ).toBeVisible();
});
