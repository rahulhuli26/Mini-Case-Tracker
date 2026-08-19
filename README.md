# Mini Case Tracker

A full-stack MERN app for managing client cases with role-based access for Managers and Agents.

## Live demo
- App: https://mini-case-tracker-nu.vercel.app/
- Source: https://github.com/rahulhuli26/Mini-Case-Tracker/tree/main

## Features
- JWT login with Manager and Agent roles
- Manager can create and assign cases
- Agent can view only assigned cases, upload files, add notes, and submit work
- Server-side status transition enforcement
- Audit log tracking status changes
- Search, status filter, agent filter, and pagination on the list page
- Case detail page with comments and timeline
- Local file storage for uploads
- MongoDB Mongoose models and validation

## Tech stack
- React + Vite + MUI
- Node.js + Express
- MongoDB + Mongoose

## Quick start

### 1) Clone and install
```bash
git clone <your-repo-url>
cd Mini-Case-Tracker-main
npm install --prefix backend
npm install --prefix frontend
```

### 2) Start MongoDB
Make sure MongoDB is running locally on port 27017.

### 3) Configure environment variables
Copy the example files and update values as needed.

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

The root `.env` file should look like:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/mini-case-tracker
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
```

The frontend `.env` file should look like:
```env
VITE_API_URL=http://localhost:5000/api
```

### 4) Run the app
```bash
npm run dev
```

This runs both the backend and frontend.

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

### 5) Seeded logins
The application seeds two users automatically when the backend starts.

Manager
- Email: manager@caseflow.test
- Password: Manager123!

Agent
- Email: agent@caseflow.test
- Password: Agent123!

Agent (second seeded account)
- Email: agent2@caseflow.test
- Password: Agent123!

## Core status flow
New → Assigned → In Progress → Submitted → Cleared / Discrepant

Transitions are validated server-side and each change is logged in the case audit trail.

## Assumptions
- Local file storage is used for uploaded documents instead of cloud storage.
- MongoDB runs locally in development.
- The app uses a single database for all users and cases.
- Authentication is handled with JWT for simplicity and local development speed.

## Rough time spent
Approximately 8-10 hours building the core app, validation, and documentation.

## Notes
The frontend is deployed on Vercel and the backend on Render, with MongoDB Atlas for the database. See [Live demo](#live-demo) above.
