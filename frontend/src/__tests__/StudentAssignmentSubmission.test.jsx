import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import StudentAssignmentSubmission from "../components/StudentAssignmentSubmission";

// Helper to flush pending promises/microtasks
const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("StudentAssignmentSubmission component (UT04, UT05)", () => {
  const ASSIGNMENTS_API = "/api/assignments";
  const SUBMIT_API_BASE = "/api/assignments";

  let fetchMock;

  const mockAssignments = [
    {
      id: 101,
      title: "AI Usage Reflection",
      description: "Reflect on how you used AI in this course.",
      course_id: "TDT4242",
    },
    {
      id: 102,
      title: "Another Assignment",
      description: "Some other task",
      course_id: "TDT4242",
    },
  ];

  const mockSubmissionResponse = {
    submission: {
      id: 1,
      assignment_id: 101,
      student_id: "student_001",
      submission_text: null,
      submitted_at: "2025-01-01T10:00:00Z",
    },
    ai_declaration: {
      id: 10,
      assignment_id: 101,
      student_id: "student_001",
      declaration_text: "Used ChatGPT and Copilot responsibly.",
      created_at: "2025-01-01T10:00:01Z",
    },
    manual_ai_logs: [
      {
        id: 100,
        tool_name: "ChatGPT",
        description: "Helped structure my answer",
        purpose: "Clarified structure",
      },
    ],
    simulated_ai_logs: [
      {
        id: 200,
        tool_name: "ChatGPT",
        prompt_text: "How should I structure my essay?",
        answer_text: "Use intro, body, conclusion...",
      },
      {
        id: 201,
        tool_name: "GitHub Copilot",
        prompt_text: "Generate Express route example",
        answer_text: "app.post(...);",
      },
    ],
  };

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  const setupAssignmentsFetch = () => {
    fetchMock.mockImplementation((url) => {
      if (url === ASSIGNMENTS_API) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: {
            get: (name) =>
              name.toLowerCase() === "content-type" ? "application/json" : null,
          },
          json: () => Promise.resolve(mockAssignments),
        });
      }

      // Default unexpected call
      return Promise.reject(new Error(`Unexpected fetch call to ${url}`));
    });
  };

  const setupSubmissionFetch = (assignmentId = 101, responseOverride) => {
    const responseBody = responseOverride ?? mockSubmissionResponse;

    fetchMock.mockImplementation((url, options) => {
      if (
        url === ASSIGNMENTS_API &&
        (!options || options.method === undefined)
      ) {
        // assignments list
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: {
            get: (name) =>
              name.toLowerCase() === "content-type" ? "application/json" : null,
          },
          json: () => Promise.resolve(mockAssignments),
        });
      }

      if (
        url === `${SUBMIT_API_BASE}/${assignmentId}/submit` &&
        options &&
        options.method === "POST"
      ) {
        return Promise.resolve({
          ok: true,
          status: 201,
          headers: {
            get: (name) =>
              name.toLowerCase() === "content-type" ? "application/json" : null,
          },
          json: () => Promise.resolve(responseBody),
        });
      }

      return Promise.reject(new Error(`Unexpected fetch call to ${url}`));
    });
  };

  const selectFirstAssignment = async () => {
    // Wait for assignments to be loaded
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(ASSIGNMENTS_API);
      expect(screen.getByText("AI Usage Reflection")).toBeInTheDocument();
    });

    const submitButtons = screen.getAllByRole("button", {
      name: /submit assignment/i,
    });

    // Click submit on first assignment
    fireEvent.click(submitButtons[0]);

    await screen.findByRole("heading", { name: "AI Usage Reflection" });
  };

  describe("UT04 – Happy-path submission with manual and automatic logs", () => {
    it("loads assignments, allows adding manual logs, confirms automatic logs, and submits with correct payload", async () => {
      setupSubmissionFetch();

      render(<StudentAssignmentSubmission />);

      // Initial assignments fetch
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(ASSIGNMENTS_API);
        expect(screen.getByText("AI Usage Reflection")).toBeInTheDocument();
      });

      // Select first assignment
      await selectFirstAssignment();

      // Fill AI declaration (required) - selected by id since there is no explicit label
      const declarationTextarea = document.getElementById("ai-declaration");
      expect(declarationTextarea).not.toBeNull();

      fireEvent.change(declarationTextarea, {
        target: {
          value: mockSubmissionResponse.ai_declaration.declaration_text,
        },
      });

      // Fill one manual AI log
      const toolInput = screen.getByPlaceholderText(
        /e\.g\., chatgpt, github copilot, claude, etc\./i,
      );
      fireEvent.change(toolInput, {
        target: { value: mockSubmissionResponse.manual_ai_logs[0].tool_name },
      });

      const contextTextarea = screen.getByPlaceholderText(
        /what was the context\? \(e\.g\., debugging code, writing documentation, etc\.\)/i,
      );
      fireEvent.change(contextTextarea, {
        target: {
          value: mockSubmissionResponse.manual_ai_logs[0].description,
        },
      });

      const resultsTextarea = screen.getByPlaceholderText(
        /what were the results\? how did the ai tool help\?/i,
      );
      fireEvent.change(resultsTextarea, {
        target: {
          value: mockSubmissionResponse.manual_ai_logs[0].purpose,
        },
      });

      // Click "Review & Confirm Logs" (this triggers handleSubmit and should open confirmation modal)
      const reviewButton = screen.getByRole("button", {
        name: /review & confirm logs/i,
      });
      fireEvent.click(reviewButton);

      // Confirmation modal appears
      await screen.findByRole("heading", {
        name: /review & confirm automatic ai usage logs/i,
      });

      // Acknowledge declaration checkbox is in the modal
      const ackCheckbox = screen.getByRole("checkbox", {
        name: /i acknowledge that this declaration accurately summarizes my ai usage for this assignment\./i,
      });

      // Confirm & Submit requires this to be checked
      fireEvent.click(ackCheckbox);
      expect(ackCheckbox).toBeChecked();

      // Confirm & Submit Assignment
      const confirmButton = screen.getByRole("button", {
        name: /confirm & submit assignment/i,
      });
      fireEvent.click(confirmButton);

      await flushPromises();

      // POST call expectation
      await waitFor(() => {
        // two calls: initial GET + POST
        expect(fetchMock).toHaveBeenCalledTimes(2);
      });

      const postCall = fetchMock.mock.calls.find(
        ([url, opts]) =>
          url === `${SUBMIT_API_BASE}/101/submit` &&
          opts &&
          opts.method === "POST",
      );
      expect(postCall).toBeTruthy();

      const [, postOptions] = postCall;
      expect(postOptions.headers["Content-Type"]).toBe("application/json");

      const body = JSON.parse(postOptions.body);
      // Student id defaults to "student_001"
      expect(body.student_id).toBe("student_001");

      // Manual logs
      expect(body.ai_logs).toHaveLength(1);
      expect(body.ai_logs[0]).toMatchObject({
        tool_name: mockSubmissionResponse.manual_ai_logs[0].tool_name,
        description: mockSubmissionResponse.manual_ai_logs[0].description,
        purpose: mockSubmissionResponse.manual_ai_logs[0].purpose,
      });

      // Automatic logs: since all checkboxes are initially checked and we never unchecked them,
      // confirmed_automatic_logs should be true
      expect(body.confirmed_automatic_logs).toBe(true);

      // Declaration
      expect(body.ai_declaration).toBe(
        mockSubmissionResponse.ai_declaration.declaration_text,
      );

      // UI success state
      await screen.findByText(/submitted successfully/i);
      expect(
        screen.getByText(/manual log\(s\) and .* confirmed ai usage log\(s\)/i),
      ).toBeInTheDocument();

      // Manual logs display
      expect(screen.getByText(/your ai usage logs/i)).toBeInTheDocument();

      // Simulated logs display
      expect(
        screen.getByText(/confirmed automatic ai usage logs/i),
      ).toBeInTheDocument();
    });
  });

  describe("UT05 – Blocking submission when declaration/confirmations are missing", () => {
    it("shows error and does not call backend when AI declaration is missing", async () => {
      setupAssignmentsFetch();

      render(<StudentAssignmentSubmission />);

      // Wait for assignments to load
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(ASSIGNMENTS_API);
        expect(screen.getByText("AI Usage Reflection")).toBeInTheDocument();
      });

      // Select assignment
      await selectFirstAssignment();

      // Ensure declaration is empty - selected by id since there is no explicit label
      const declarationTextarea = document.getElementById("ai-declaration");
      expect(declarationTextarea).not.toBeNull();
      expect(declarationTextarea).toHaveValue("");

      // Click "Review & Confirm Logs"
      const reviewButton = screen.getByRole("button", {
        name: /review & confirm logs/i,
      });
      fireEvent.click(reviewButton);

      // Since declaration is missing, we should stay on the same form
      // and show an error, without any new fetch calls beyond the GET.
      await screen.findByText(
        /please provide an ai declaration summarizing your ai usage for this assignment\./i,
      );

      // No POST request should have been made
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).not.toHaveBeenCalledWith(
        expect.stringContaining("/submit"),
        expect.anything(),
      );
    });

    it("blocks confirm & submit when declaration acknowledgment checkbox is not checked", async () => {
      setupSubmissionFetch();

      render(<StudentAssignmentSubmission />);

      // Initial assignments fetch
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(ASSIGNMENTS_API);
      });

      await selectFirstAssignment();

      // Fill AI declaration - selected by id since there is no explicit label
      const declarationTextarea = document.getElementById("ai-declaration");
      expect(declarationTextarea).not.toBeNull();
      fireEvent.change(declarationTextarea, {
        target: {
          value: "I used ChatGPT once.",
        },
      });

      // Click "Review & Confirm Logs" to open confirmation modal
      const reviewButton = screen.getByRole("button", {
        name: /review & confirm logs/i,
      });
      fireEvent.click(reviewButton);

      // Modal visible
      await screen.findByRole("heading", {
        name: /review & confirm automatic ai usage logs/i,
      });

      // Ensure acknowledgment checkbox is NOT checked
      const ackCheckbox = screen.getByRole("checkbox", {
        name: /i acknowledge that this declaration accurately summarizes my ai usage for this assignment\./i,
      });
      expect(ackCheckbox).not.toBeChecked();

      // Click Confirm & Submit without checking
      const confirmButton = screen.getByRole("button", {
        name: /confirm & submit assignment/i,
      });
      fireEvent.click(confirmButton);

      // Error message should be shown in the modal
      await screen.findByText(
        /please check the box to acknowledge your ai declaration before submitting\./i,
      );

      // No POST submit should have occurred yet (only the GET for assignments)
      // Note: depending on the exact fetchMock use above (setupSubmissionFetch),
      // there will be 1 call to /api/assignments at this point.
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).not.toHaveBeenCalledWith(
        expect.stringContaining("/submit"),
        expect.anything(),
      );
    });
  });
});
