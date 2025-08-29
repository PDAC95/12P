# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

12P is a real estate platform built with a Node.js/Express backend and Angular frontend, featuring property listings, user authentication, favorites, and map integration.

## Development Commands

### Backend (Node.js/Express)
```bash
cd backend
npm install          # Install dependencies
npm run dev          # Start development server with nodemon (auto-reload)
npm start            # Start production server
npm run seed:more    # Generate additional mock properties
```

### Frontend (Angular)
```bash
cd frontend
npm install          # Install dependencies
npm start            # Start development server (ng serve)
npm run build        # Build for production
npm test             # Run unit tests with Karma
```

## Architecture

### Backend Structure
- **Entry Point**: `backend/src/server.js` → `backend/src/app.js`
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based with email verification system
- **API Routes**:
  - `/api/auth` - Authentication (login, register, email verification)
  - `/api/properties` - Property CRUD operations with filtering
  - `/api/users` - User profile management
  - `/api/favorites` - User favorites functionality

### Frontend Structure
- **Framework**: Angular 20 with standalone components
- **Routing**: Lazy-loaded routes with auth guards and email verification guards
- **State Management**: Service-based with RxJS
- **Key Features**:
  - Property listing with filters and map integration (Leaflet)
  - User authentication with Google OAuth support
  - Role-based dashboards (user, agent, admin)
  - Email verification enforcement for protected routes

### Authentication Flow
1. User registers → Email sent with verification token
2. Auth interceptor automatically adds JWT to requests
3. Email verification guard blocks access to protected features
4. Refresh token system handles token renewal

### Key Technologies
- **Backend**: Express, MongoDB/Mongoose, JWT, Nodemailer, Helmet, CORS
- **Frontend**: Angular 20, Bootstrap 5, Leaflet maps, RxJS
- **Development**: Nodemon (backend), Angular CLI

### API Response Format
```javascript
{
  success: boolean,
  data?: any,
  message?: string,
  error?: string
}
```

### Environment Variables (Backend)
Required in `backend/.env`:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` - Email configuration
- `PORT` - Server port (default: 5001)

### Testing Approach
- Frontend: Karma/Jasmine test files alongside components (*.spec.ts)
- Backend: No test framework configured yet

### Current Git Branch
Working on `feature/mobile-responsive-map` - Implementing property filtering by distance radius and map improvements.