import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from './app.js';
import db, { clearDatabase } from './db.js';

// IT05-1, IT05-2: GET /api/assignments/:id/student-logs
describe('IT05 - GET /api/assignments/:id/student-logs', () => {
  let assignmentId;

  beforeEach(() => {
    clearDatabase();
    
    // Create a test assignment
    const assignmentResult = db.prepare(`
      INSERT INTO assignments (title, description, course_id, created_by)
      VALUES (?, ?, ?, ?)
    `).run('Test Assignment', 'Test Description', 'TDT0001', 'John Doe');
    
    assignmentId = assignmentResult.lastInsertRowid;

    // Create test submissions for multiple students
    db.prepare(`
      INSERT INTO submissions (assignment_id, student_id, submission_text)
      VALUES (?, ?, ?)
    `).run(assignmentId, 'student_1', 'Submission text 1');

    db.prepare(`
      INSERT INTO submissions (assignment_id, student_id, submission_text)
      VALUES (?, ?, ?)
    `).run(assignmentId, 'student_2', 'Submission text 2');

    // Create AI declarations for students
    db.prepare(`
      INSERT INTO ai_declarations (assignment_id, student_id, declaration_text)
      VALUES (?, ?, ?)
    `).run(assignmentId, 'student_1', 'I used ChatGPT for brainstorming');

    db.prepare(`
      INSERT INTO ai_declarations (assignment_id, student_id, declaration_text)
      VALUES (?, ?, ?)
    `).run(assignmentId, 'student_2', 'I used Copilot for code completion');

    // Create manual AI logs for student_1
    db.prepare(`
      INSERT INTO ai_logs (assignment_id, student_id, tool_name, description, purpose, is_simulated)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(assignmentId, 'student_1', 'ChatGPT', 'Brainstorming session', 'Generate ideas', 0);

    db.prepare(`
      INSERT INTO ai_logs (assignment_id, student_id, tool_name, description, purpose, is_simulated)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(assignmentId, 'student_1', 'Claude', 'Code review', 'Check for bugs', 0);

    // Create simulated AI logs for student_1
    db.prepare(`
      INSERT INTO ai_logs (assignment_id, student_id, tool_name, description, purpose, prompt_text, answer_text, duration_minutes, is_simulated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      assignmentId,
      'student_1',
      'GitHub Copilot',
      'Auto-completion',
      'Speed up coding',
      'Write a function to validate email',
      'Here is a regex pattern for email validation',
      5,
      1
    );

    // Create manual AI logs for student_2
    db.prepare(`
      INSERT INTO ai_logs (assignment_id, student_id, tool_name, description, purpose, is_simulated)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(assignmentId, 'student_2', 'Copilot', 'Code suggestions', 'Faster development', 0);
  });

  // IT05-1: Successful retrieval of student logs
  it('IT05-1: should return 200 OK with assignment and student_submissions containing all logs', async () => {
    const response = await request(app)
      .get(`/api/assignments/${assignmentId}/student-logs`)
      .expect(200)
      .expect('Content-Type', /json/);

    // Verify top-level structure
    expect(response.body).toHaveProperty('assignment');
    expect(response.body).toHaveProperty('student_submissions');
    expect(response.body).toHaveProperty('total_submissions');

    // Verify assignment details
    const { assignment } = response.body;
    expect(assignment.id).toBe(assignmentId);
    expect(assignment.title).toBe('Test Assignment');
    expect(assignment.description).toBe('Test Description');
    expect(assignment.course_id).toBe('TDT0001');
    expect(assignment.created_at).toBeDefined();

    // Verify student_submissions array
    const { student_submissions } = response.body;
    expect(Array.isArray(student_submissions)).toBe(true);
    expect(student_submissions.length).toBe(2);

    // Verify total_submissions
    expect(response.body.total_submissions).toBe(2);

    // Find student_1 submission
    const student1Data = student_submissions.find(s => s.student_id === 'student_1');
    expect(student1Data).toBeDefined();
    
    // Verify student_1 submission
    expect(student1Data.submission).toBeDefined();
    expect(student1Data.submission.id).toBeDefined();
    expect(student1Data.submission.assignment_id).toBe(assignmentId);
    expect(student1Data.submission.student_id).toBe('student_1');
    expect(student1Data.submission.submission_text).toBe('Submission text 1');
    expect(student1Data.submission.submitted_at).toBeDefined();

    // Verify student_1 AI declaration
    expect(student1Data.ai_declaration).toBeDefined();
    expect(student1Data.ai_declaration.id).toBeDefined();
    expect(student1Data.ai_declaration.assignment_id).toBe(assignmentId);
    expect(student1Data.ai_declaration.student_id).toBe('student_1');
    expect(student1Data.ai_declaration.declaration_text).toBe('I used ChatGPT for brainstorming');
    expect(student1Data.ai_declaration.created_at).toBeDefined();

    // Verify student_1 manual AI logs
    expect(Array.isArray(student1Data.manual_ai_logs)).toBe(true);
    expect(student1Data.manual_ai_logs.length).toBe(2);
    
    const chatGPTLog = student1Data.manual_ai_logs.find(log => log.tool_name === 'ChatGPT');
    expect(chatGPTLog).toBeDefined();
    expect(chatGPTLog.id).toBeDefined();
    expect(chatGPTLog.tool_name).toBe('ChatGPT');
    expect(chatGPTLog.description).toBe('Brainstorming session');
    expect(chatGPTLog.purpose).toBe('Generate ideas');
    expect(chatGPTLog.created_at).toBeDefined();

    const claudeLog = student1Data.manual_ai_logs.find(log => log.tool_name === 'Claude');
    expect(claudeLog).toBeDefined();
    expect(claudeLog.tool_name).toBe('Claude');
    expect(claudeLog.description).toBe('Code review');
    expect(claudeLog.purpose).toBe('Check for bugs');

    // Verify student_1 simulated AI logs
    expect(Array.isArray(student1Data.simulated_ai_logs)).toBe(true);
    expect(student1Data.simulated_ai_logs.length).toBe(1);
    
    const simulatedLog = student1Data.simulated_ai_logs[0];
    expect(simulatedLog.id).toBeDefined();
    expect(simulatedLog.tool_name).toBe('GitHub Copilot');
    expect(simulatedLog.description).toBe('Auto-completion');
    expect(simulatedLog.purpose).toBe('Speed up coding');
    expect(simulatedLog.prompt_text).toBe('Write a function to validate email');
    expect(simulatedLog.answer_text).toBe('Here is a regex pattern for email validation');
    expect(simulatedLog.duration_minutes).toBe(5);
    expect(simulatedLog.created_at).toBeDefined();

    // Find student_2 submission
    const student2Data = student_submissions.find(s => s.student_id === 'student_2');
    expect(student2Data).toBeDefined();
    
    // Verify student_2 has 1 manual log and 0 simulated logs
    expect(student2Data.manual_ai_logs.length).toBe(1);
    expect(student2Data.simulated_ai_logs.length).toBe(0);
  });

  // IT05-2: Assignment not found
  it('IT05-2: should return 404 Not Found when assignment does not exist', async () => {
    const nonExistentId = 999;

    const response = await request(app)
      .get(`/api/assignments/${nonExistentId}/student-logs`)
      .expect(404)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Assignment not found');
  });
});
