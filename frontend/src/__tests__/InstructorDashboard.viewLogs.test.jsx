import React from "react";
import { test, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InstructorDashboard from "../components/InstructorDashboard";

// Mock the ViewStudentLogs component used inside InstructorDashboard.
// The mock will render a close button that calls the provided onClose prop
// and displays the assignmentId so the test can assert it's shown.
vi.mock("../components/ViewStudentLogs", () => {
  return {
    default: ({ assignmentId, onClose }) => {
      return (
        <div data-testid="mock-view-student-logs">
          <button onClick={onClose}>↑ Back to Dashboard</button>
          <div>Mock logs for assignment: {assignmentId}</div>
        </div>
      );
    },
  };
});

// Helper to build a resolved fetch Response with JSON
function createJsonResponse(body, init = {}) {
  const jsonBody = JSON.stringify(body);
  return new Response(jsonBody, {
    status: 200,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    ...init,
    body: jsonBody,
  });
}

test("opens View Logs and closes back to dashboard (view logs flow)", async () => {
  const originalFetch = globalThis.fetch;
  try {
    // Prepare mock data: one assignment with an existing submission so View Logs button appears
    const assignments = [
      {
        id: 10,
        title: "Assignment X",
        description: "Test assignment for view logs",
        course_id: "TDT4242",
      },
    ];

    const submissionsFor10 = [
      {
        id: 100,
        assignment_id: 10,
        student_id: "student_1",
        submission_text: "hello",
        submitted_at: new Date().toISOString(),
      },
    ];

    // Mock fetch sequence:
    // 1) GET /api/assignments -> assignments
    // 2) GET /api/assignments/10/submissions -> submissionsFor10
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(createJsonResponse(assignments))
      .mockResolvedValueOnce(createJsonResponse(submissionsFor10));

    render(<InstructorDashboard />);

    // Wait for the assignment card to render
    await waitFor(() => {
      expect(screen.getByText("Assignment X")).toBeInTheDocument();
    });

    // The View Logs button should appear for the assignment with submissions
    const assignmentCard = screen
      .getByText("Assignment X")
      .closest(".assignment-card");
    expect(assignmentCard).toBeTruthy();

    // Within the card, find the View Logs button and click it
    const viewLogsButton = assignmentCard.querySelector("button");
    // Use userEvent to click more realistically
    const user = userEvent.setup();
    await user.click(viewLogsButton);

    // After clicking, our mocked ViewStudentLogs component should be visible
    await waitFor(() => {
      expect(screen.getByTestId("mock-view-student-logs")).toBeInTheDocument();
      expect(
        screen.getByText(/Mock logs for assignment: 10/),
      ).toBeInTheDocument();
    });

    // Click the mock component's back button to close it
    const backButton = screen.getByRole("button", {
      name: "↑ Back to Dashboard",
    });
    await user.click(backButton);

    // After closing, the dashboard heading should be visible again
    await waitFor(() => {
      expect(screen.getByText("Instructor Dashboard")).toBeInTheDocument();
    });
  } finally {
    // Restore original fetch to avoid side effects for other tests
    globalThis.fetch = originalFetch;
  }
});
