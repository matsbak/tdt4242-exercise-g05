import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from './app.js';
import db, { clearDatabase } from './db.js';

// IT04: GET /api/assignments/:id/submissions
describe('IT04 - GET /api/assignments/:id/submissions', () => {
  let assignmentId;

  beforeEach(() => {
    clearDatabase();
    
    // Create a test assignment
    const assignmentResult = db.prepare(`
      INSERT INTO assignments (title, description, course_id, created_by)
      VALUES (?, ?, ?, ?)
    `).run('Test Assignment', 'Test Description', 'TDT0001', 'John Doe');
    
    assignmentId = assignmentResult.lastInsertRowid;

    // Create test submissions
    db.prepare(`
      INSERT INTO submissions (assignment_id, student_id, submission_text)
      VALUES (?, ?, ?)
    `).run(assignmentId, 'student_1', 'Submission text 1');

    db.prepare(`
      INSERT INTO submissions (assignment_id, student_id, submission_text)
      VALUES (?, ?, ?)
    `).run(assignmentId, 'student_2', 'Submission text 2');

    db.prepare(`
      INSERT INTO submissions (assignment_id, student_id, submission_text)
      VALUES (?, ?, ?)
    `).run(assignmentId, 'student_3', 'Submission text 3');
  });

  it('IT04: should return 200 OK with array of submissions', async () => {
    const response = await request(app)
      .get(`/api/assignments/${assignmentId}/submissions`)
      .expect(200)
      .expect('Content-Type', /json/);

    // Verify response is an array
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(3);

    // Verify each submission has required fields
    response.body.forEach((submission) => {
      expect(submission).toHaveProperty('id');
      expect(typeof submission.id).toBe('number');
      expect(submission).toHaveProperty('assignment_id');
      expect(submission.assignment_id).toBe(assignmentId);
      expect(submission).toHaveProperty('student_id');
      expect(typeof submission.student_id).toBe('string');
      expect(submission).toHaveProperty('submission_text');
      expect(typeof submission.submission_text).toBe('string');
      expect(submission).toHaveProperty('submitted_at');
      expect(typeof submission.submitted_at).toBe('string');
    });

    // Verify specific submissions exist
    const student1Submission = response.body.find(s => s.student_id === 'student_1');
    expect(student1Submission).toBeDefined();
    expect(student1Submission.submission_text).toBe('Submission text 1');

    const student2Submission = response.body.find(s => s.student_id === 'student_2');
    expect(student2Submission).toBeDefined();
    expect(student2Submission.submission_text).toBe('Submission text 2');

    const student3Submission = response.body.find(s => s.student_id === 'student_3');
    expect(student3Submission).toBeDefined();
    expect(student3Submission.submission_text).toBe('Submission text 3');
  });
});
