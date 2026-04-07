import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import InstructorDashboard from "../components/InstructorDashboard";

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

describe("InstructorDashboard", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Ensure fetch exists and is mockable
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it("loads all assignments on mount and shows submission counts (UT03)", async () => {
    const assignments = [
      {
        id: 1,
        title: "Assignment 1",
        description: "Desc 1",
        course_id: "TDT4242",
      },
      {
        id: 2,
        title: "Assignment 2",
        description: "Desc 2",
        course_id: "TDT4242",
      },
    ];

    const submissionsFor1 = [
      {
        id: 1,
        assignment_id: 1,
        student_id: "s1",
        submission_text: "text",
        submitted_at: "2025-01-01T00:00:00Z",
      },
    ];
    const submissionsFor2 = [
      {
        id: 2,
        assignment_id: 2,
        student_id: "s1",
        submission_text: "text",
        submitted_at: "2025-01-02T00:00:00Z",
      },
      {
        id: 3,
        assignment_id: 2,
        student_id: "s2",
        submission_text: "text",
        submitted_at: "2025-01-03T00:00:00Z",
      },
    ];

    // First call: /api/assignments
    // Second call: /api/assignments/1/submissions
    // Third call: /api/assignments/2/submissions
    global.fetch
      .mockResolvedValueOnce(createJsonResponse(assignments))
      .mockResolvedValueOnce(createJsonResponse(submissionsFor1))
      .mockResolvedValueOnce(createJsonResponse(submissionsFor2));

    render(<InstructorDashboard />);

    // Initial state: loading happens implicitly, we mainly care that data is rendered eventually
    await waitFor(() => {
      expect(screen.getByText("Assignment 1")).toBeInTheDocument();
      expect(screen.getByText("Assignment 2")).toBeInTheDocument();
    });

    // Verify fetch calls for initial load
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch).toHaveBeenNthCalledWith(1, "/api/assignments");

    // Ensure submission count fetches use correct URLs
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "/api/assignments/1/submissions",
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      3,
      "/api/assignments/2/submissions",
    );

    // Verify submission counts text is correct
    expect(screen.getByText("1 submission")).toBeInTheDocument();
    expect(screen.getByText("2 submissions")).toBeInTheDocument();

    // Filter status should indicate "Showing all assignments" initially
    expect(screen.getByText("Showing all assignments")).toBeInTheDocument();
  });

  it("filters assignments by course when course filter is changed (UT03)", async () => {
    const allAssignments = [
      {
        id: 1,
        title: "Assignment 1",
        description: "Desc 1",
        course_id: "TDT4242",
      },
      {
        id: 2,
        title: "Assignment 2",
        description: "Desc 2",
        course_id: "TDT4120",
      },
    ];

    const filteredAssignments = [
      {
        id: 1,
        title: "Assignment 1",
        description: "Desc 1",
        course_id: "TDT4242",
      },
    ];

    const submissionsFor1 = [
      {
        id: 1,
        assignment_id: 1,
        student_id: "s1",
        submission_text: "text",
        submitted_at: "2025-01-01T00:00:00Z",
      },
    ];

    // Call order:
    // 1) /api/assignments  -> allAssignments
    // 2) /api/assignments/1/submissions for first assignment in allAssignments
    // 3) /api/assignments/2/submissions for second assignment in allAssignments
    // 4) /api/assignments/course/TDT4242 -> filteredAssignments
    // 5) /api/assignments/1/submissions again for filtered list
    global.fetch
      .mockResolvedValueOnce(createJsonResponse(allAssignments))
      .mockResolvedValueOnce(createJsonResponse(submissionsFor1))
      .mockResolvedValueOnce(createJsonResponse([])) // no submissions for id 2
      .mockResolvedValueOnce(createJsonResponse(filteredAssignments))
      .mockResolvedValueOnce(createJsonResponse(submissionsFor1));

    render(<InstructorDashboard />);

    // Wait for initial assignments load
    await waitFor(() => {
      expect(screen.getByText("Assignment 1")).toBeInTheDocument();
      expect(screen.getByText("Assignment 2")).toBeInTheDocument();
    });

    const filterInput = screen.getByPlaceholderText(
      "Enter course ID (e.g., TDT4242)",
    );

    // Change the filter to TDT4242
    fireEvent.change(filterInput, { target: { value: "TDT4242" } });

    // After change, it should call the course-specific endpoint
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/assignments/course/TDT4242",
      );
    });

    // Now the filtered list should only show Assignment 1
    await waitFor(() => {
      expect(screen.getByText("Assignment 1")).toBeInTheDocument();
      expect(screen.queryByText("Assignment 2")).not.toBeInTheDocument();
    });

    // Filter status should reflect the active course filter
    expect(
      screen.getByText("Showing assignments for TDT4242"),
    ).toBeInTheDocument();
  });

  it("uses the Refresh button to reload assignments with current filter (UT03)", async () => {
    const initialAssignments = [
      {
        id: 1,
        title: "Assignment 1",
        description: "Desc 1",
        course_id: "TDT4242",
      },
    ];

    const refreshedAssignments = [
      {
        id: 1,
        title: "Assignment 1",
        description: "Desc 1",
        course_id: "TDT4242",
      },
      {
        id: 3,
        title: "Assignment 3",
        description: "Desc 3",
        course_id: "TDT4242",
      },
    ];

    // Submissions for id 1 and id 3
    const submissionsFor1 = [
      {
        id: 1,
        assignment_id: 1,
        student_id: "s1",
        submission_text: "text",
        submitted_at: "2025-01-01T00:00:00Z",
      },
    ];
    const submissionsFor3 = [
      {
        id: 3,
        assignment_id: 3,
        student_id: "s2",
        submission_text: "text",
        submitted_at: "2025-01-03T00:00:00Z",
      },
    ];

    // Call order:
    // 1) /api/assignments -> initialAssignments
    // 2) /api/assignments/1/submissions
    // 3) /api/assignments/course/TDT4242 -> refreshedAssignments (when filter typed)
    // 4) /api/assignments/1/submissions (for refreshedAssignments)
    // 5) /api/assignments/3/submissions
    // 6) /api/assignments/course/TDT4242 -> refreshedAssignments (when Refresh clicked)
    // 7) /api/assignments/1/submissions
    // 8) /api/assignments/3/submissions
    global.fetch
      .mockResolvedValueOnce(createJsonResponse(initialAssignments))
      .mockResolvedValueOnce(createJsonResponse(submissionsFor1))
      .mockResolvedValueOnce(createJsonResponse(refreshedAssignments))
      .mockResolvedValueOnce(createJsonResponse(submissionsFor1))
      .mockResolvedValueOnce(createJsonResponse(submissionsFor3))
      .mockResolvedValueOnce(createJsonResponse(refreshedAssignments))
      .mockResolvedValueOnce(createJsonResponse(submissionsFor1))
      .mockResolvedValueOnce(createJsonResponse(submissionsFor3));

    render(<InstructorDashboard />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Assignment 1")).toBeInTheDocument();
    });

    // Apply a course filter
    const filterInput = screen.getByPlaceholderText(
      "Enter course ID (e.g., TDT4242)",
    );
    fireEvent.change(filterInput, { target: { value: "TDT4242" } });

    // Wait for filtered list (Assignment 3 appears)
    await waitFor(() => {
      expect(screen.getByText("Assignment 3")).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole("button", { name: /refresh/i });

    // Click refresh and ensure it reloads via the course-specific endpoint
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/assignments/course/TDT4242",
      );
    });

    // Still shows both assignments after refresh
    await waitFor(() => {
      expect(screen.getByText("Assignment 1")).toBeInTheDocument();
      expect(screen.getByText("Assignment 3")).toBeInTheDocument();
    });
  });

  it("shows error message when loading assignments fails (UT03)", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Failed to load assignments" }), {
        status: 500,

        headers: { "Content-Type": "application/json" },
      }),
    );

    render(<InstructorDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load assignments"),
      ).toBeInTheDocument();
    });

    // We primarily care that the error message is shown; the surrounding UI
    // (like section headers) may still render, so we avoid over-constraining
    // the expectations here.
  });
});
