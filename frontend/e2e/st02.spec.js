import { test, expect } from "@playwright/test";

test("ST02 - Instructor can create an assignment via Create Assignment page", async ({
  page,
}) => {
  // Intercept assignments endpoint to handle both GET and POST
  await page.route("**/api/assignments", async (route, request) => {
    const method = request.method().toUpperCase();
    if (method === "POST") {
      let post = {};
      try {
        post = await request.postDataJSON();
      } catch {
        post = {};
      }

      const created = {
        id: 303,
        title: post.title || "Created Assignment",
        description: post.description || null,
        course_id: post.course_id || "TDT0000",
        created_by: post.created_by || "instructor_user",
        created_at: new Date().toISOString(),
        require_extra_ai_logs: post.require_extra_ai_logs ? 1 : 0,
        require_extra_declarations: post.require_extra_declarations ? 1 : 0,
        extra_ai_logs_content: post.extra_ai_logs_content || null,
        extra_declarations_content: post.extra_declarations_content || null,
      };

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(created),
      });
      return;
    }

    // Default GET behavior: return empty assignments array
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  // Open the app and navigate to Create Assignment
  await page.goto("/");
  await page
    .locator("nav")
    .getByRole("button", { name: "Create Assignment" })
    .click();

  // Wait for Create Assignment page to be visible (scope to main)
  await expect(page.locator("main >> h1")).toHaveText("Create Assignment");

  // Fill form fields
  await page.fill("#title", "E2E Created Assignment ST02");
  await page.fill("#description", "Created by playwright test for ST02");
  await page.fill("#course_id", "TDT4242");

  // Toggle extra requirements and provide content
  await page.check("#require_extra_ai_logs");
  await page.fill("#extra_ai_logs_content", "Please include model versions.");
  await page.check("#require_extra_declarations");
  await page.fill(
    "#extra_declarations_content",
    "Explain ethical considerations.",
  );

  // Submit the form (scope to main to avoid ambiguity with nav button)
  await page
    .locator("main")
    .getByRole("button", { name: "Create Assignment" })
    .click();

  // Expect success message with assignment title
  await expect(
    page.getByText(
      'Assignment "E2E Created Assignment ST02" created successfully!',
    ),
  ).toBeVisible();
});
