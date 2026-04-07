# TDT4242 Exercise G05

Project in course
[TDT4242 Advanced Software Engineering](https://www.ntnu.edu/studies/courses/TDT4242) at
[NTNU](https://www.ntnu.edu/). The project is part of *Exercise 2* in the course and is done by
group 5.

The AI tool used for the exercise is [GitHub Copilot](https://github.com/features/copilot).

### How to run

Backend (integrated database):

```bash
cd backend
npm install
node index.js
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

### Running Tests

Backend Integration Tests:

```bash
cd backend
npm install
npm test
```

Frontend Unit Tests:

```bash
cd frontend
npm install
npm test
```

System tests

```bash
cd frontend
npm install
npm test:e2e
```

Note: Make sure backend is already running in different terminal

### Technology stack

- SQLite (better-sqlite3)
- Express.js
- React.js (Vite)
- Vitest (Testing framework)
- Supertest (HTTP assertions for integration tests)
