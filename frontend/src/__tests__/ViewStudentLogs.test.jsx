import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ViewStudentLogs from "../components/ViewStudentLogs";

describe("ViewStudentLogs component (UT06)", () => {
  const assignmentId = 101;
  const onClose = vi.fn();

  function mockFetchOnce(status, jsonBody) {
    global.fetch = vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: vi.fn().mockResolvedValue(jsonBody),
    });
  }

  beforeEach(() => {
    onClose.mockClear();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading state while data is being fetched", async () => {
    const fetchPromise = new Promise(() => {});
    global.fetch = vi.fn().mockReturnValue(fetchPromise);

    render(<ViewStudentLogs assignmentId={assignmentId} onClose={onClose} />);

    expect(screen.getByText("Loading student logs...")).toBeInTheDocument();

    expect(global.fetch).toHaveBeenCalledWith(
      `/api/assignments/${assignmentId}/student-logs`,
    );
  });

  it("renders error state when fetch fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({ error: "Internal error" }),
    });

    render(<ViewStudentLogs assignmentId={assignmentId} onClose={onClose} />);

    await waitFor(() =>
      expect(screen.getByText("Internal error")).toBeInTheDocument(),
    );

    expect(screen.getByText("↑ Back to Dashboard")).toBeInTheDocument();
  });

  it('renders "No data available" when API returns null payload', async () => {
    mockFetchOnce(200, null);

    render(<ViewStudentLogs assignmentId={assignmentId} onClose={onClose} />);

    await waitFor(() =>
      expect(screen.getByText("No data available")).toBeInTheDocument(),
    );
  });

  it("renders assignment info and student logs, and allows expand/collapse", async () => {
    const apiResponse = {
      assignment: {
        id: assignmentId,
        title: "AI Usage Assignment",
        description: "Test assignment",
        course_id: "TDT4242",
        created_at: "2025-01-01T10:00:00Z",
      },
      student_submissions: [
        {
          student_id: "s123456",
          submission: {
            id: 1,
            assignment_id: assignmentId,
            student_id: "s123456",
            submission_text: "My submission text",
            submitted_at: "2025-01-02T10:00:00Z",
          },
          ai_declaration: {
            id: 10,
            assignment_id: assignmentId,
            student_id: "s123456",
            declaration_text: "Used ChatGPT and Copilot",
            created_at: "2025-01-02T11:00:00Z",
          },
          manual_ai_logs: [
            {
              id: 100,
              tool_name: "ChatGPT",
              description: "Helped with brainstorming",
              purpose: "Clarified ideas",
              created_at: "2025-01-02T12:00:00Z",
            },
          ],
          simulated_ai_logs: [
            {
              id: 200,
              tool_name: "Copilot",
              description: "Code suggestions",
              purpose: "Completed boilerplate",
              prompt_text: "Some prompt",
              answer_text: "Some answer",
              duration_minutes: 5,
              created_at: "2025-01-02T12:30:00Z",
            },
          ],
        },
      ],
      total_submissions: 1,
    };

    mockFetchOnce(200, apiResponse);

    render(<ViewStudentLogs assignmentId={assignmentId} onClose={onClose} />);

    await waitFor(() =>
      expect(
        screen.getByText(
          "AI Usage Assignment - Student AI Logs & Declarations",
        ),
      ).toBeInTheDocument(),
    );

    expect(
      screen.getByText("Course: TDT4242 | Total Submissions: 1"),
    ).toBeInTheDocument();

    expect(screen.getByText("s123456")).toBeInTheDocument();

    expect(
      screen.queryByText("No submissions found for this assignment."),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("s123456"));

    await waitFor(() =>
      expect(screen.getByText("Submission")).toBeInTheDocument(),
    );

    expect(screen.getByText("AI Declaration")).toBeInTheDocument();

    expect(screen.getByText("Manual AI Logs (1)")).toBeInTheDocument();

    expect(screen.getByText("Simulated AI Logs (1)")).toBeInTheDocument();

    expect(screen.getByText("Helped with brainstorming")).toBeInTheDocument();

    expect(screen.getByText("Code suggestions")).toBeInTheDocument();

    fireEvent.click(screen.getByText("s123456"));

    expect(screen.queryByText("Submission")).not.toBeInTheDocument();
  });

  it("filters students by student id substring", async () => {
    const apiResponse = {
      assignment: {
        id: assignmentId,
        title: "AI Usage Assignment",
        description: "Test assignment",
        course_id: "TDT4242",
        created_at: "2025-01-01T10:00:00Z",
      },
      student_submissions: [
        {
          student_id: "s123456",
          submission: null,
          ai_declaration: null,
          manual_ai_logs: [],
          simulated_ai_logs: [],
        },
        {
          student_id: "s654321",
          submission: null,
          ai_declaration: null,
          manual_ai_logs: [],
          simulated_ai_logs: [],
        },
      ],
      total_submissions: 2,
    };

    mockFetchOnce(200, apiResponse);

    render(<ViewStudentLogs assignmentId={assignmentId} onClose={onClose} />);

    await waitFor(() =>
      expect(
        screen.getByPlaceholderText("Filter by student ID..."),
      ).toBeInTheDocument(),
    );

    expect(screen.getByText("s123456")).toBeInTheDocument();
    expect(screen.getByText("s654321")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Filter by student ID..."), {
      target: { value: "123" },
    });

    expect(screen.getByText("s123456")).toBeInTheDocument();
    expect(screen.queryByText("s654321")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Clear Filter"));

    expect(screen.getByText("s123456")).toBeInTheDocument();
    expect(screen.getByText("s654321")).toBeInTheDocument();
  });

  it('shows "No submissions found" messaging when filter hides all students', async () => {
    const apiResponse = {
      assignment: {
        id: assignmentId,
        title: "AI Usage Assignment",
        description: "Test assignment",
        course_id: "TDT4242",
        created_at: "2025-01-01T10:00:00Z",
      },
      student_submissions: [
        {
          student_id: "s123456",
          submission: null,
          ai_declaration: null,
          manual_ai_logs: [],
          simulated_ai_logs: [],
        },
      ],
      total_submissions: 1,
    };

    mockFetchOnce(200, apiResponse);

    render(<ViewStudentLogs assignmentId={assignmentId} onClose={onClose} />);

    await waitFor(() =>
      expect(
        screen.getByPlaceholderText("Filter by student ID..."),
      ).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByPlaceholderText("Filter by student ID..."), {
      target: { value: "no-match" },
    });

    expect(
      screen.getByText("No submissions found for the selected filter."),
    ).toBeInTheDocument();
  });
});
