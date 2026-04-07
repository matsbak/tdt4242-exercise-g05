import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { test, expect, vi } from "vitest";
import Navigation from "../components/Navigation";

test("Navigation calls onNavigate when buttons clicked", async () => {
  const user = userEvent.setup();
  const onNavigate = vi.fn();

  render(<Navigation currentPage="dashboard" onNavigate={onNavigate} />);

  // Click Create Assignment
  const createBtn = screen.getByRole("button", { name: /Create Assignment/i });
  await user.click(createBtn);
  expect(onNavigate).toHaveBeenCalledWith("create");

  // Click Submit Assignment
  const submitBtn = screen.getByRole("button", { name: /Submit Assignment/i });
  await user.click(submitBtn);
  expect(onNavigate).toHaveBeenCalledWith("submit");

  // Click Dashboard
  const dashBtn = screen.getByRole("button", { name: /Dashboard/i });
  await user.click(dashBtn);
  expect(onNavigate).toHaveBeenCalledWith("dashboard");
});

test("Navigation highlights active page button", () => {
  const onNavigate = vi.fn();

  // Render with 'create' active
  const { rerender } = render(
    <Navigation currentPage="create" onNavigate={onNavigate} />,
  );

  const createBtn = screen.getByRole("button", { name: /Create Assignment/i });
  expect(createBtn).toHaveClass("active");

  // Rerender with 'submit' active
  rerender(<Navigation currentPage="submit" onNavigate={onNavigate} />);
  const submitBtn = screen.getByRole("button", { name: /Submit Assignment/i });
  expect(submitBtn).toHaveClass("active");

  // Dashboard should not be active now
  const dashBtn = screen.getByRole("button", { name: /Dashboard/i });
  expect(dashBtn).not.toHaveClass("active");
});
