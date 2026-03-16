# Creoed LMS

A modern, professional Learning Management System (LMS) built with React (Frontend) and Node.js (Backend).

## Repository
[https://github.com/santhosh-labs/creoed-lms.git](https://github.com/santhosh-labs/creoed-lms.git)

## Project Structure
- **/frontend**: React + Vite application for the student, tutor, and admin interfaces.
- **/backend**: Node.js + Express API with SQL Server integration.

## Getting Started

### Prerequisites
- Node.js (v16+)
- Docker & Docker Compose (optional, for containerized deployment)
- SQL Server

### Local Development

#### Backend
1. `cd backend`
2. `npm install`
3. Configure `.env` file with your database credentials.
4. `npm start` (or `npm run dev` with nodemon)

#### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Docker Deployment
```bash
docker-compose up --build
```

## Features
- **User Roles**: Student, Tutor, Admin, Super Admin.
- **Course Management**: Create and manage courses, modules, and lessons.
- **Assignments & Quizzes**: Submit assignments and take real-time quizzes.
- **Attendance**: Track student attendance for sessions.
- **Ticketing System**: Support system for students to interact with tutors.
- **Fees Management**: Track payments and pending balances.
- **Messaging**: Real-time communication within the platform.
