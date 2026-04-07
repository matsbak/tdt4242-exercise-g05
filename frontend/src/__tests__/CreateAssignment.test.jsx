import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import React from "react";

import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import CreateAssignment from "../components/CreateAssignment.jsx";

// These tests cover UT01 and UT02 from the test plan for the CreateAssignment component.

describe("CreateAssignment component", () => {
  beforeEach(() => {
    // Fresh mock for each test

    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,

      status: 201,

      headers: {
        get: () => "application/json",
      },

      json: async () => ({
        id: 1,

        title: "Test Assignment",

        description: "A test description",

        course_id: "TDT4242",

        created_by: "instructor_user",

        require_extra_ai_logs: false,

        require_extra_declarations: false,

        extra_ai_logs_content: null,

        extra_declarations_content: null,
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  //

  // UT01 – Successful submission with valid input

  //

  it("submits form with valid input, sends correct POST body and shows success + resets form (UT01)", async () => {
    render(<CreateAssignment />);

    const titleInput = screen.getByLabelText(/assignment title \*/i);

    const descriptionInput = screen.getByLabelText(/^description$/i);

    const courseIdInput = screen.getByLabelText(/course id \*/i);

    const requireExtraLogsCheckbox = screen.getByLabelText(
      /require extra ai usage logs content/i,
    );

    const requireExtraDeclsCheckbox = screen.getByLabelText(
      /require extra ai declaration content/i,
    );

    const submitButton = screen.getByRole("button", {
      name: /create assignment/i,
    });

    // Fill basic fields

    fireEvent.change(titleInput, { target: { value: "Balanced test plan" } });

    fireEvent.change(descriptionInput, {
      target: { value: "Create a balanced test plan" },
    });

    fireEvent.change(courseIdInput, { target: { value: "TDT4242" } });

    // Toggle checkboxes and fill extra content to ensure they are passed in body

    fireEvent.click(requireExtraLogsCheckbox);

    fireEvent.click(requireExtraDeclsCheckbox);

    const extraLogsContent = await screen.findByLabelText(
      /additional ai logs requirements/i,
    );

    const extraDeclsContent = await screen.findByLabelText(
      /additional declaration requirements/i,
    );

    fireEvent.change(extraLogsContent, {
      target: { value: "Students must specify how AI helped generate tests." },
    });

    fireEvent.change(extraDeclsContent, {
      target: { value: "Students must describe the types of tests generated." },
    });

    // Submit form

    fireEvent.click(submitButton);

    // Verify POST was called with correct URL and body

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    const [url, options] = global.fetch.mock.calls[0];

    expect(url).toBe("/api/assignments");

    expect(options.method).toBe("POST");

    expect(options.headers).toMatchObject({
      "Content-Type": "application/json",
    });

    const body = JSON.parse(options.body);

    expect(body).toMatchObject({
      title: "Balanced test plan",

      description: "Create a balanced test plan",

      course_id: "TDT4242",

      require_extra_ai_logs: true,

      require_extra_declarations: true,

      extra_ai_logs_content:
        "Students must specify how AI helped generate tests.",

      extra_declarations_content:
        "Students must describe the types of tests generated.",

      created_by: "instructor_user",
    });

    // Success message appears (relax expected text to match prefix only)

    const successMessage = await screen.findByText(
      /assignment "test assignment" created successfully!/i,
    );

    expect(successMessage).toBeInTheDocument();

    // Error message should not be shown

    expect(screen.queryByText(/is required/i)).not.toBeInTheDocument();

    // Form reset: basic fields should be empty, checkboxes unchecked

    expect(titleInput).toHaveValue("");

    expect(descriptionInput).toHaveValue("");

    expect(courseIdInput).toHaveValue("");

    expect(requireExtraLogsCheckbox).not.toBeChecked();

    expect(requireExtraDeclsCheckbox).not.toBeChecked();

    // Extra content fields should no longer be in the document after reset

    expect(
      screen.queryByLabelText(/additional ai logs requirements/i),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByLabelText(/additional declaration requirements/i),
    ).not.toBeInTheDocument();
  });

  //

  // UT02 – Client-side validation for missing required fields

  //

  it("shows validation error and does not call fetch when title is missing (UT02 - title)", async () => {
    render(<CreateAssignment />);

    const titleInput = screen.getByLabelText(/assignment title \*/i);

    const courseIdInput = screen.getByLabelText(/course id \*/i);

    const submitButton = screen.getByRole("button", {
      name: /create assignment/i,
    });

    // Ensure title is empty

    fireEvent.change(titleInput, { target: { value: "" } });

    fireEvent.change(courseIdInput, { target: { value: "TDT4242" } });

    fireEvent.click(submitButton);

    // Should not have called fetch

    expect(global.fetch).not.toHaveBeenCalled();

    // Error message for title required (relax to substring search)

    const error = await screen.findByText((content) =>
      content.toLowerCase().includes("assignment title is required"),
    );

    expect(error).toBeInTheDocument();
  });

  it("shows validation error and does not call fetch when course_id is missing (UT02 - course_id)", async () => {
    render(<CreateAssignment />);

    const titleInput = screen.getByLabelText(/assignment title \*/i);

    const courseIdInput = screen.getByLabelText(/course id \*/i);

    const submitButton = screen.getByRole("button", {
      name: /create assignment/i,
    });

    fireEvent.change(titleInput, { target: { value: "Some title" } });

    fireEvent.change(courseIdInput, { target: { value: "" } });

    fireEvent.click(submitButton);

    // Should not have called fetch

    expect(global.fetch).not.toHaveBeenCalled();

    // Error message for course id required (relax to substring search)

    const error = await screen.findByText((content) =>
      content.toLowerCase().includes("course id is required"),
    );

    expect(error).toBeInTheDocument();
  });
});
