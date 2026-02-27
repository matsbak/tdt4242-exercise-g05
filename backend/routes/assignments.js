const express = require('express');
const router = express.Router();
const db = require('../db');

// Create assignment
router.post('/', (req, res) => {
  const {
    title,
    description,
    course_id,
    created_by,
    require_extra_ai_logs,
    require_extra_declarations,
    extra_ai_logs_content,
    extra_declarations_content
  } = req.body;

  console.log('Creating assignment:', { title, course_id, created_by });

  // Validate required fields
  if (!title || !course_id || !created_by) {
    return res.status(400).json({
      error: 'Missing required fields: title, course_id, created_by'
    });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO assignments (
        title,
        description,
        course_id,
        created_by,
        require_extra_ai_logs,
        require_extra_declarations,
        extra_ai_logs_content,
        extra_declarations_content
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      title,
      description || null,
      course_id,
      created_by,
      require_extra_ai_logs ? 1 : 0,
      require_extra_declarations ? 1 : 0,
      extra_ai_logs_content || null,
      extra_declarations_content || null
    );

    const newAssignment = db.prepare(
      'SELECT * FROM assignments WHERE id = ?'
    ).get(result.lastInsertRowid);

    console.log('Assignment created:', newAssignment);
    res.status(201).json(newAssignment);
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// Get all assignments
router.get('/', (req, res) => {
  try {
    console.log('Fetching all assignments');
    const assignments = db.prepare(
      'SELECT * FROM assignments ORDER BY created_at DESC'
    ).all();

    console.log(`Found ${assignments.length} total assignments`);
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Get all assignments for a course
router.get('/course/:course_id', (req, res) => {
  try {
    const { course_id } = req.params;
    console.log('Fetching assignments for course:', course_id);
    const assignments = db.prepare(
      'SELECT * FROM assignments WHERE course_id = ? ORDER BY created_at DESC'
    ).all(course_id);

    console.log(`Found ${assignments.length} assignments for course ${course_id}`);
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Get single assignment
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const assignment = db.prepare(
      'SELECT * FROM assignments WHERE id = ?'
    ).get(id);

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json(assignment);
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
});

// Update assignment
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    require_extra_ai_logs,
    require_extra_declarations,
    extra_ai_logs_content,
    extra_declarations_content
  } = req.body;

  try {
    const assignment = db.prepare(
      'SELECT * FROM assignments WHERE id = ?'
    ).get(id);

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const stmt = db.prepare(`
      UPDATE assignments
      SET title = ?,
          description = ?,
          require_extra_ai_logs = ?,
          require_extra_declarations = ?,
          extra_ai_logs_content = ?,
          extra_declarations_content = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      title || assignment.title,
      description !== undefined ? description : assignment.description,
      require_extra_ai_logs !== undefined ? (require_extra_ai_logs ? 1 : 0) : assignment.require_extra_ai_logs,
      require_extra_declarations !== undefined ? (require_extra_declarations ? 1 : 0) : assignment.require_extra_declarations,
      extra_ai_logs_content !== undefined ? extra_ai_logs_content : assignment.extra_ai_logs_content,
      extra_declarations_content !== undefined ? extra_declarations_content : assignment.extra_declarations_content,
      id
    );

    const updated = db.prepare('SELECT * FROM assignments WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// Delete assignment
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  try {
    const assignment = db.prepare(
      'SELECT * FROM assignments WHERE id = ?'
    ).get(id);

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    db.prepare('DELETE FROM assignments WHERE id = ?').run(id);
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

// Submit assignment with AI logs
router.post('/:id/submit', (req, res) => {
  const { id } = req.params;
  const { student_id, submission_text, ai_logs } = req.body;

  // Validate required fields
  if (!student_id || !Array.isArray(ai_logs)) {
    return res.status(400).json({
      error: 'Missing required fields: student_id and ai_logs array'
    });
  }

  try {
    const assignment = db.prepare(
      'SELECT * FROM assignments WHERE id = ?'
    ).get(id);

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Create submission
    const submissionStmt = db.prepare(`
      INSERT INTO submissions (assignment_id, student_id, submission_text)
      VALUES (?, ?, ?)
    `);

    const submissionResult = submissionStmt.run(
      id,
      student_id,
      submission_text || null
    );

    // Create AI logs for this submission
    const aiLogStmt = db.prepare(`
      INSERT INTO ai_logs (assignment_id, student_id, tool_name, description, purpose, duration_minutes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    ai_logs.forEach(log => {
      aiLogStmt.run(
        id,
        student_id,
        log.tool_name || null,
        log.description || null,
        log.purpose || null,
        log.duration_minutes || null
      );
    });

    // Return submission with AI logs
    const submission = db.prepare(
      'SELECT * FROM submissions WHERE id = ?'
    ).get(submissionResult.lastInsertRowid);

    const logs = db.prepare(`
      SELECT id, tool_name, description, purpose, duration_minutes, created_at
      FROM ai_logs
      WHERE assignment_id = ? AND student_id = ?
      ORDER BY created_at DESC
    `).all(id, student_id);

    console.log('Assignment submitted with AI logs:', { submission, logs });
    res.status(201).json({
      submission,
      ai_logs: logs
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
});

// Get submission for a student
router.get('/:id/submissions/:student_id', (req, res) => {
  const { id, student_id } = req.params;

  try {
    const submission = db.prepare(`
      SELECT * FROM submissions
      WHERE assignment_id = ? AND student_id = ?
      ORDER BY submitted_at DESC
      LIMIT 1
    `).get(id, student_id);

    const ai_logs = db.prepare(`
      SELECT id, tool_name, description, purpose, duration_minutes, created_at
      FROM ai_logs
      WHERE assignment_id = ? AND student_id = ?
      ORDER BY created_at DESC
    `).all(id, student_id);

    res.json({
      submission: submission || null,
      ai_logs
    });
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

// Get all submissions for an assignment
router.get('/:id/submissions', (req, res) => {
  const { id } = req.params;

  try {
    const submissions = db.prepare(`
      SELECT * FROM submissions
      WHERE assignment_id = ?
      ORDER BY submitted_at DESC
    `).all(id);

    res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

module.exports = router;
