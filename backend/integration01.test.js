import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from './app.js';
import db, { clearDatabase } from './db.js';

// IT01: GET /api/assignments - Get all assignments
describe('IT01 - GET /api/assignments', () => {
  beforeEach(() => {
    clearDatabase();
  });

  it('should return 200 OK with array of assignments', async () => {
    // Setup: Create test assignments
    const assignment1 = db.prepare(`
      INSERT INTO assignments (title, description, course_id, created_by, require_extra_ai_logs, require_extra_declarations, extra_ai_logs_content, extra_declarations_content)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'Test Assignment 1',
      'Description 1',
      'TDT0001',
      'John Doe',
      1,
      1,
      'Extra AI logs content',
      'Extra declarations content'
    );

    const assignment2 = db.prepare(`
      INSERT INTO assignments (title, description, course_id, created_by)
      VALUES (?, ?, ?, ?)
    `).run(
      'Test Assignment 2',
      'Description 2',
      'TDT0002',
      'Jane Doe'
    );

    // Execute
    const response = await request(app)
      .get('/api/assignments')
      .expect(200)
      .expect('Content-Type', /json/);

    // Verify
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2);
    
    const firstAssignment = response.body.find(a => a.id === assignment1.lastInsertRowid);
    expect(firstAssignment).toBeDefined();
    expect(firstAssignment.title).toBe('Test Assignment 1');
    expect(firstAssignment.description).toBe('Description 1');
    expect(firstAssignment.course_id).toBe('TDT0001');
    expect(firstAssignment.created_by).toBe('John Doe');
    expect(firstAssignment.require_extra_ai_logs).toBe(1);
    expect(firstAssignment.require_extra_declarations).toBe(1);
    expect(firstAssignment.extra_ai_logs_content).toBe('Extra AI logs content');
    expect(firstAssignment.extra_declarations_content).toBe('Extra declarations content');
    expect(firstAssignment.created_at).toBeDefined();
    expect(firstAssignment.updated_at).toBeDefined();

    const secondAssignment = response.body.find(a => a.id === assignment2.lastInsertRowid);
    expect(secondAssignment).toBeDefined();
    expect(secondAssignment.title).toBe('Test Assignment 2');
    expect(secondAssignment.require_extra_ai_logs).toBe(0);
    expect(secondAssignment.require_extra_declarations).toBe(0);
  });
});
