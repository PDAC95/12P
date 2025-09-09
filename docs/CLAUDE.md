# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

12P is a real estate platform with Node.js/Express backend and Angular 20 frontend, featuring property listings, authentication, favorites, and map integration.

## Development Commands

### Backend
```bash
cd backend
npm install          # Install dependencies
npm run dev          # Start development server with nodemon (auto-reload)
npm start            # Start production server
npm run seed:more    # Generate additional mock properties
```

### Frontend
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
  - `/api/comparison` - Property comparison functionality

### Frontend Structure
- **Framework**: Angular 20 with standalone components
- **Routing**: Lazy-loaded routes in `frontend/src/app/app.routes.ts`
- **Guards**: `auth.guard.ts` and `email-verified-guard.ts` for route protection
- **State Management**: Service-based with RxJS
- **Key Features**:
  - Property listing with filters and map integration (Leaflet)
  - User authentication with Google OAuth support
  - Role-based dashboards (user, agent, admin)
  - Email verification enforcement

### Authentication Flow
1. User registers → Email sent with verification token
2. Auth interceptor (`frontend/src/app/interceptors/`) adds JWT to requests
3. Email verification guard blocks access to protected features
4. Refresh token system handles token renewal

### Key Technologies
- **Backend**: Express, MongoDB/Mongoose, JWT, Nodemailer, Helmet, CORS, Morgan
- **Frontend**: Angular 20, Bootstrap 5, Leaflet maps, Chart.js, RxJS
- **Development**: Nodemon (backend), Angular CLI (frontend)

### API Response Format
```javascript
{
  success: boolean,
  data?: any,
  message?: string,
  error?: string
}
```

### Environment Variables
Required in `backend/.env`:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` - Email configuration
- `PORT` - Server port (default: 5001)
- `NODE_ENV` - Environment (development/production)

### Testing
- Frontend: Karma/Jasmine (`npm test` in frontend/)
- Backend: No test framework configured

### Default Ports
- Backend: 5001
- Frontend: 4200 (Angular default)