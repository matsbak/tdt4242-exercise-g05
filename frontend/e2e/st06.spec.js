import { test, expect } from "@playwright/test";

test.describe("ST06 - Instructor dashboard viewing student logs", () => {
  test("instructor can open dashboard, view assignments and inspect student logs", async ({
    page,
  }) => {
    // Mock assignments list
    await page.route("**/api/assignments", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: 101,
            title: "Test Assignment ST06",
            description: "Assignment for instructor logs view test",
            course_id: "TDT4242",
            created_by: "instructor_user",
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

    // Mock submissions list for assignment 101 (used to show submission count)
    await page.route("**/api/assignments/101/submissions", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: 201,
            assignment_id: 101,
            student_id: "student_100",
            submission_text: "Student submission text",
            submitted_at: new Date().toISOString(),
          },
        ]),
      });
    });

    // Mock student-logs endpoint (detailed data for ViewStudentLogs)
    await page.route("**/api/assignments/101/student-logs", (route) => {
      const response = {
        assignment: {
          id: 101,
          title: "Test Assignment ST06",
          description: "Assignment for instructor logs view test",
          course_id: "TDT4242",
          created_at: new Date().toISOString(),
        },
        student_submissions: [
          {
            student_id: "student_100",
            submission: {
              id: 201,
              assignment_id: 101,
              student_id: "student_100",
              submission_text: "Student submission text",
              submitted_at: new Date().toISOString(),
            },
            ai_declaration: {
              id: 301,
              assignment_id: 101,
              student_id: "student_100",
              declaration_text:
                "I used Copilot and ChatGPT for scaffolding and wording.",
              created_at: new Date().toISOString(),
            },
            manual_ai_logs: [
              {
                id: 401,
                tool_name: "GitHub Copilot",
                description: "Generated route boilerplate",
                purpose: "Saved development time",
                created_at: new Date().toISOString(),
              },
            ],
            simulated_ai_logs: [
              {
                id: 501,
                tool_name: "ChatGPT",
                description: "Brainstormed solution structure",
                purpose: "Helped design component structure",
                prompt_text: "How should I structure a React component?",
                answer_text:
                  "Use useEffect for fetching, keep loading/error state...",
                duration_minutes: 10,
                created_at: new Date().toISOString(),
              },
            ],
          },
        ],
        total_submissions: 1,
      };

      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(response),
      });
    });

    // Open the app
    await page.goto("/");

    // Ensure we are on the Instructor Dashboard (App defaults to dashboard)
    await expect(page.getByText("Instructor Dashboard")).toBeVisible();

    // Ensure assignment card is visible
    await expect(page.getByText("Test Assignment ST06")).toBeVisible();

    // The dashboard shows a "View Logs" button when there are submissions;
    // click it to open the ViewStudentLogs view
    const assignmentCard = page.locator(".assignment-card", {
      hasText: "Test Assignment ST06",
    });
    await expect(assignmentCard).toBeVisible();
    await assignmentCard.getByRole("button", { name: "View Logs" }).click();

    // ViewStudentLogs header should be visible
    await expect(
      page.getByText("Student AI Logs & Declarations"),
    ).toBeVisible();
    // Also check the specific assignment title appears in header
    await expect(
      page.getByRole("heading", {
        name: /Test Assignment ST06 - Student AI Logs & Declarations/,
      }),
    ).toBeVisible();

    // The student list should contain our mocked student id
    const studentCard = page.getByText("student_100");
    await expect(studentCard).toBeVisible();

    // Expand the student's entry to reveal details
    await studentCard.click();

    // AI Declaration content should be visible
    await expect(page.getByText("AI Declaration")).toBeVisible();
    await expect(
      page.getByText("I used Copilot and ChatGPT for scaffolding and wording."),
    ).toBeVisible();

    // Manual AI log should be visible
    await expect(page.getByText("GitHub Copilot")).toBeVisible();
    await expect(page.getByText("Generated route boilerplate")).toBeVisible();

    // Simulated AI log should be visible (scope to simulated logs section to avoid matching declaration text)
    await expect(
      page.locator(".simulated-logs-section").getByText("ChatGPT"),
    ).toBeVisible();
    await expect(
      page
        .locator(".simulated-logs-section")
        .getByText("Brainstormed solution structure"),
    ).toBeVisible();

    // Test the filter input: apply a filter that yields no results
    const filterInput = page.locator(".filter-input");
    await filterInput.fill("no-such-student");
    await expect(
      page.getByText("No submissions found for the selected filter."),
    ).toBeVisible();

    // Clear the filter using the clear button and confirm the student reappears
    await page.getByRole("button", { name: "Clear Filter" }).click();
    await expect(page.getByText("student_100")).toBeVisible();

    // Finally, click the back button to return to the dashboard and ensure we are back
    await page.getByRole("button", { name: "↑ Back to Dashboard" }).click();
    await expect(page.getByText("Instructor Dashboard")).toBeVisible();
  });
});
