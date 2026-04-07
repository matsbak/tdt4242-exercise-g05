import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from './app.js';
import db, { clearDatabase } from './db.js';

// IT02-1, IT02-2, IT02-3, IT02-4, IT02-5: POST /api/assignments/:id/submit
describe('IT02 - POST /api/assignments/:id/submit', () => {
  let assignmentId;

  beforeEach(() => {
    clearDatabase();
    
    // Create a test assignment for submission tests
    const result = db.prepare(`
      INSERT INTO assignments (title, description, course_id, created_by)
      VALUES (?, ?, ?, ?)
    `).run('Test Assignment', 'Test Description', 'TDT0001', 'John Doe');
    
    assignmentId = result.lastInsertRowid;
  });

  // IT02-1: Successful submission with confirmed automatic logs
  it('IT02-1: should return 201 Created with submission, declaration, manual and simulated logs when confirmed_automatic_logs is true', async () => {
    const requestBody = {
      student_id: 'student_100',
      submission_text: 'My submission text',
      ai_logs: [
        {
          tool_name: 'Copilot',
          description: 'Copilot prompt',
          purpose: 'Copilot prompt purpose'
        },
        {
          tool_name: 'Claude',
          description: 'Claude prompt',
          purpose: 'Claude prompt purpose'
        }
      ],
      confirmed_automatic_logs: true,
      ai_declaration: 'Used Copilot and Claude'
    };

    const response = await request(app)
      .post(`/api/assignments/${assignmentId}/submit`)
      .send(requestBody)
      .expect(201)
      .expect('Content-Type', /json/);

    // Verify response structure
    expect(response.body).toHaveProperty('submission');
    expect(response.body).toHaveProperty('ai_declaration');
    expect(response.body).toHaveProperty('manual_ai_logs');
    expect(response.body).toHaveProperty('simulated_ai_logs');

    // Verify submission
    const { submission } = response.body;
    expect(submission.assignment_id).toBe(assignmentId);
    expect(submission.student_id).toBe('student_100');
    expect(submission.submission_text).toBe('My submission text');
    expect(submission.submitted_at).toBeDefined();

    // Verify AI declaration
    const { ai_declaration } = response.body;
    expect(ai_declaration.assignment_id).toBe(assignmentId);
    expect(ai_declaration.student_id).toBe('student_100');
    expect(ai_declaration.declaration_text).toBe('Used Copilot and Claude');
    expect(ai_declaration.created_at).toBeDefined();

    // Verify manual AI logs
    const { manual_ai_logs } = response.body;
    expect(manual_ai_logs).toHaveLength(2);
    expect(manual_ai_logs[0].tool_name).toBe('Copilot');
    expect(manual_ai_logs[0].description).toBe('Copilot prompt');
    expect(manual_ai_logs[0].purpose).toBe('Copilot prompt purpose');
    expect(manual_ai_logs[0].created_at).toBeDefined();
    expect(manual_ai_logs[1].tool_name).toBe('Claude');

    // Verify simulated AI logs (should have 3 simulated logs)
    const { simulated_ai_logs } = response.body;
    expect(simulated_ai_logs.length).toBeGreaterThan(0);
    expect(simulated_ai_logs[0]).toHaveProperty('tool_name');
    expect(simulated_ai_logs[0]).toHaveProperty('description');
    expect(simulated_ai_logs[0]).toHaveProperty('purpose');
    expect(simulated_ai_logs[0]).toHaveProperty('prompt_text');
    expect(simulated_ai_logs[0]).toHaveProperty('answer_text');
    expect(simulated_ai_logs[0]).toHaveProperty('duration_minutes');
    expect(simulated_ai_logs[0]).toHaveProperty('created_at');
  });

  // IT02-2: Successful submission with NO confirmed automatic logs
  it('IT02-2: should return 201 Created with empty simulated_ai_logs when confirmed_automatic_logs is false', async () => {
    const requestBody = {
      student_id: 'student_100',
      submission_text: 'My submission text',
      ai_logs: [
        {
          tool_name: 'Copilot',
          description: 'Copilot prompt',
          purpose: 'Copilot prompt purpose'
        },
        {
          tool_name: 'Claude',
          description: 'Claude prompt',
          purpose: 'Claude prompt purpose'
        }
      ],
      confirmed_automatic_logs: false,
      ai_declaration: 'Used Copilot and Claude'
    };

    const response = await request(app)
      .post(`/api/assignments/${assignmentId}/submit`)
      .send(requestBody)
      .expect(201)
      .expect('Content-Type', /json/);

    // Verify response structure
    expect(response.body).toHaveProperty('submission');
    expect(response.body).toHaveProperty('ai_declaration');
    expect(response.body).toHaveProperty('manual_ai_logs');
    expect(response.body).toHaveProperty('simulated_ai_logs');

    // Verify submission
    const { submission } = response.body;
    expect(submission.assignment_id).toBe(assignmentId);
    expect(submission.student_id).toBe('student_100');
    expect(submission.submission_text).toBe('My submission text');

    // Verify AI declaration
    const { ai_declaration } = response.body;
    expect(ai_declaration.declaration_text).toBe('Used Copilot and Claude');

    // Verify manual AI logs
    const { manual_ai_logs } = response.body;
    expect(manual_ai_logs).toHaveLength(2);

    // Verify simulated AI logs should be empty
    const { simulated_ai_logs } = response.body;
    expect(simulated_ai_logs).toHaveLength(0);
  });

  // IT02-3: Submission to non-existent assignment
  it('IT02-3: should return 404 Not Found when assignment does not exist', async () => {
    const nonExistentId = 999;
    const requestBody = {
      student_id: 'student_100',
      submission_text: 'My submission text',
      ai_logs: [
        {
          tool_name: 'Copilot',
          description: 'Copilot prompt',
          purpose: 'Copilot prompt purpose'
        },
        {
          tool_name: 'Claude',
          description: 'Claude prompt',
          purpose: 'Claude prompt purpose'
        }
      ],
      confirmed_automatic_logs: true,
      ai_declaration: 'Used Copilot and Claude'
    };

    const response = await request(app)
      .post(`/api/assignments/${nonExistentId}/submit`)
      .send(requestBody)
      .expect(404)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Assignment not found');
  });

  // IT02-4: Submission with empty student_id
  it('IT02-4: should return 400 Bad Request when student_id is empty', async () => {
    const requestBody = {
      student_id: '',
      submission_text: 'My submission text',
      ai_logs: [
        {
          tool_name: 'Copilot',
          description: 'Copilot prompt',
          purpose: 'Copilot prompt purpose'
        },
        {
          tool_name: 'Claude',
          description: 'Claude prompt',
          purpose: 'Claude prompt purpose'
        }
      ],
      confirmed_automatic_logs: true,
      ai_declaration: 'Used Copilot and Claude'
    };

    const response = await request(app)
      .post(`/api/assignments/${assignmentId}/submit`)
      .send(requestBody)
      .expect(400)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Missing required field: student_id');
  });

  // IT02-5: Submission with empty ai_declaration
  it('IT02-5: should return 400 Bad Request when ai_declaration is empty', async () => {
    const requestBody = {
      student_id: 'student_100',
      submission_text: 'My submission text',
      ai_logs: [
        {
          tool_name: 'Copilot',
          description: 'Copilot prompt',
          purpose: 'Copilot prompt purpose'
        },
        {
          tool_name: 'Claude',
          description: 'Claude prompt',
          purpose: 'Claude prompt purpose'
        }
      ],
      confirmed_automatic_logs: true,
      ai_declaration: ''
    };

    const response = await request(app)
      .post(`/api/assignments/${assignmentId}/submit`)
      .send(requestBody)
      .expect(400)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('AI declaration is required for assignment submission');
  });
});
