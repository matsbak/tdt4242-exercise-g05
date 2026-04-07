import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from './app.js';
import db, { clearDatabase } from './db.js';

// IT03-1, IT03-2, IT03-3, IT03-4, IT03-5: POST /api/assignments
describe('IT03 - POST /api/assignments', () => {
  beforeEach(() => {
    clearDatabase();
  });

  // IT03-1: Create assignment with all fields
  it('IT03-1: should return 201 Created with full assignment details when all fields are provided', async () => {
    const requestBody = {
      title: 'Make test plan',
      description: 'Make a test plan for a balanced test suite',
      course_id: 'TDT0001',
      created_by: 'John Doe',
      require_extra_ai_logs: true,
      require_extra_declarations: true,
      extra_ai_logs_content: 'Specify how model helped generate tests',
      extra_declarations_content: 'Include type of tests generated'
    };

    const response = await request(app)
      .post('/api/assignments')
      .send(requestBody)
      .expect(201)
      .expect('Content-Type', /json/);

    // Verify response
    expect(response.body).toHaveProperty('id');
    expect(typeof response.body.id).toBe('number');
    expect(response.body.title).toBe('Make test plan');
    expect(response.body.description).toBe('Make a test plan for a balanced test suite');
    expect(response.body.course_id).toBe('TDT0001');
    expect(response.body.created_by).toBe('John Doe');
    expect(response.body.created_at).toBeDefined();
    expect(response.body.updated_at).toBeDefined();
    expect(response.body.require_extra_ai_logs).toBe(1);
    expect(response.body.require_extra_declarations).toBe(1);
    expect(response.body.extra_ai_logs_content).toBe('Specify how model helped generate tests');
    expect(response.body.extra_declarations_content).toBe('Include type of tests generated');
  });

  // IT03-2: Create assignment with only required fields
  it('IT03-2: should return 201 Created with defaults for optional fields when only required fields are provided', async () => {
    const requestBody = {
      title: 'Make test plan',
      description: 'Make a test plan for a balanced test suite',
      course_id: 'TDT0001',
      created_by: 'John Doe'
    };

    const response = await request(app)
      .post('/api/assignments')
      .send(requestBody)
      .expect(201)
      .expect('Content-Type', /json/);

    // Verify response
    expect(response.body).toHaveProperty('id');
    expect(typeof response.body.id).toBe('number');
    expect(response.body.title).toBe('Make test plan');
    expect(response.body.description).toBe('Make a test plan for a balanced test suite');
    expect(response.body.course_id).toBe('TDT0001');
    expect(response.body.created_by).toBe('John Doe');
    expect(response.body.created_at).toBeDefined();
    expect(response.body.updated_at).toBeDefined();
    expect(response.body.require_extra_ai_logs).toBe(0);
    expect(response.body.require_extra_declarations).toBe(0);
    expect(response.body.extra_ai_logs_content).toBeNull();
    expect(response.body.extra_declarations_content).toBeNull();
  });

  // IT03-3: Create assignment with empty title
  it('IT03-3: should return 400 Bad Request when title is empty', async () => {
    const requestBody = {
      title: '',
      description: 'Make a test plan for a balanced test suite',
      course_id: 'TDT0001',
      created_by: 'John Doe',
      require_extra_ai_logs: true,
      require_extra_declarations: true,
      extra_ai_logs_content: 'Specify how model helped generate tests',
      extra_declarations_content: 'Include type of tests generated'
    };

    const response = await request(app)
      .post('/api/assignments')
      .send(requestBody)
      .expect(400)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Missing required fields: title, course_id, created_by');
  });

  // IT03-4: Create assignment with empty course_id
  it('IT03-4: should return 400 Bad Request when course_id is empty', async () => {
    const requestBody = {
      title: 'Make test plan',
      description: 'Make a test plan for a balanced test suite',
      course_id: '',
      created_by: 'John Doe',
      require_extra_ai_logs: true,
      require_extra_declarations: true,
      extra_ai_logs_content: 'Specify how model helped generate tests',
      extra_declarations_content: 'Include type of tests generated'
    };

    const response = await request(app)
      .post('/api/assignments')
      .send(requestBody)
      .expect(400)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Missing required fields: title, course_id, created_by');
  });

  // IT03-5: Create assignment with empty created_by
  it('IT03-5: should return 400 Bad Request when created_by is empty', async () => {
    const requestBody = {
      title: 'Make test plan',
      description: 'Make a test plan for a balanced test suite',
      course_id: 'TDT0001',
      created_by: '',
      require_extra_ai_logs: true,
      require_extra_declarations: true,
      extra_ai_logs_content: 'Specify how model helped generate tests',
      extra_declarations_content: 'Include type of tests generated'
    };

    const response = await request(app)
      .post('/api/assignments')
      .send(requestBody)
      .expect(400)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Missing required fields: title, course_id, created_by');
  });
});
