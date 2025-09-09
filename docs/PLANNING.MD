# PLANNING.md - Plaice Real Estate Platform Technical Architecture

## Project Vision

Plaice is a modern real estate platform that revolutionizes property search by integrating artificial intelligence with traditional filters. The platform enables users to find properties using both structured search and natural conversations with an AI assistant. Currently in Sprint 3 of active development with core functionalities implemented (authentication, property CRUD, favorites), the platform is preparing for its main differentiators: AI-powered conversational search and advanced filtering capabilities.

**MVP Scope:** Basic authentication with email verification, property CRUD with images, traditional search, favorites system, role-based dashboards, Google OAuth integration  
**Current Status:** Sprint 3 - Core features implemented, working on dashboards and preparing AI integration  
**Target Launch:** Q4 2025 (MVP completed, adding advanced features)

## Technical Architecture

### System Architecture Diagram

```
┌───────────────────────────────────────────────────────────┐
│                   Cloudflare/CDN                          │
└───────────────┬───────────────────────────┬──────────────┘
                │                           │
    ┌───────────▼──────────┐    ┌──────────▼──────────┐
    │   Angular 20 SPA     │    │   Angular 20 SPA     │
    │    (Port 4200)       │    │    (Port 4200)       │
    └───────────┬──────────┘    └──────────┬──────────┘
                │                           │
    ┌───────────▼───────────────────────────▼──────────┐
    │              NGINX (API Gateway)                  │
    └───────────┬───────────────────────────┬──────────┘
                │                           │
    ┌───────────▼──────────┐    ┌──────────▼──────────┐
    │  Express.js Server   │    │  Express.js Server   │
    │    (Port 5001)       │    │    (Port 5001)       │
    └───────────┬──────────┘    └──────────┬──────────┘
                │                           │
    ┌───────────▼───────────────────────────▼──────────┐
    │          MongoDB Atlas (Primary + Replica)        │
    └───────────────────────────────────────────────────┘
                │                           │
    ┌───────────▼──────────┐    ┌──────────▼──────────┐
    │  Redis Cache/Session │    │  AWS S3 (Images)     │
    └──────────────────────┘    └─────────────────────┘
                │                           │
    ┌───────────▼──────────┐    ┌──────────▼──────────┐
    │   OpenAI API         │    │  Google Maps API     │
    └──────────────────────┘    └─────────────────────┘
```

### Frontend Architecture

- **Framework:** Angular 20 with standalone components
- **Component Structure:**
  ```
  frontend/src/
  ├── app/
  │   ├── features/          # Feature modules
  │   │   ├── auth/          # Authentication feature
  │   │   ├── properties/    # Property management
  │   │   ├── chat/          # AI chat feature
  │   │   ├── dashboard/     # Role-based dashboards
  │   │   └── favorites/     # User favorites
  │   ├── shared/            # Shared components
  │   │   ├── components/    # Reusable UI components
  │   │   ├── pipes/         # Custom pipes
  │   │   └── directives/    # Custom directives
  │   ├── core/              # Core services and models
  │   │   ├── models/        # TypeScript interfaces
  │   │   ├── services/      # Singleton services
  │   │   └── constants/     # App constants
  │   ├── guards/            # Route guards
  │   ├── interceptors/      # HTTP interceptors
  │   └── layouts/           # Layout components
  ```
- **State Management:** Service-based with RxJS BehaviorSubjects
- **Routing:** Lazy loaded modules for performance
- **Build Optimization:** Angular CLI production build with tree-shaking

### Backend Architecture

- **Framework:** Express.js with modular architecture
- **Folder Structure:**
  ```
  backend/src/
  ├── controllers/       # Request handlers
  │   ├── authController.js
  │   ├── propertyController.js
  │   ├── userController.js
  │   ├── chatController.js
  │   └── favoriteController.js
  ├── models/           # Mongoose schemas
  │   ├── User.js
  │   ├── Property.js
  │   ├── Conversation.js
  │   └── Favorite.js
  ├── services/         # Business logic
  │   ├── authService.js
  │   ├── emailService.js
  │   ├── aiService.js
  │   └── imageService.js
  ├── middleware/       # Custom middleware
  │   ├── authMiddleware.js
  │   ├── errorHandler.js
  │   └── validation.js
  ├── routes/           # API routes
  │   ├── authRoutes.js
  │   ├── propertyRoutes.js
  │   └── chatRoutes.js
  ├── utils/            # Helper functions
  │   ├── emailTemplates.js
  │   ├── tokenGenerator.js
  │   └── imageProcessor.js
  ├── config/           # Configuration files
  │   ├── database.js
  │   └── constants.js
  ├── app.js           # Express app setup
  └── server.js        # Server entry point
  ```
- **API Design:** RESTful with consistent response format
- **Authentication:** JWT with refresh tokens and email verification
- **Database ORM/ODM:** Mongoose for MongoDB

### Database Design

- **Type:** MongoDB (NoSQL)
- **Collections:**
  - **users**: User accounts with roles (client, agent, admin)
  - **properties**: Real estate listings with features and location
  - **conversations**: AI chat histories and context
  - **favorites**: User saved properties
  - **notifications**: User notification preferences and history
  - **sessions**: Active user sessions for security
- **Indexes:**
  - `properties.location.coordinates`: 2dsphere index for geo queries
  - `properties.price + properties.type`: Compound index for filtering
  - `users.email`: Unique index for authentication
  - `conversations.userId + createdAt`: For user chat history
- **Relationships:** Referenced relationships using ObjectId

## Technology Stack

### Frontend

```yaml
Framework: Angular 20
Version: 20.0.0
UI Library: Bootstrap 5.3.0 + Custom SCSS
State Management: RxJS 7.8.0 with Services
HTTP Client: Angular HttpClient
Routing: Angular Router with Guards
Forms: Reactive Forms with custom validators
Maps: Leaflet 1.9.4
Charts: Chart.js 4.4.0
Testing: Karma + Jasmine
Build Tool: Angular CLI with Webpack
PWA: @angular/pwa for offline capability
i18n: @angular/localize for multi-language
```

### Backend

```yaml
Language: JavaScript (ES6+)
Runtime: Node.js 20.x LTS
Framework: Express.js 4.18.2
Database: MongoDB 7.0 with MongoDB Atlas
ODM: Mongoose 8.0.0
Authentication: JWT (jsonwebtoken 9.0.2)
Password: bcryptjs 2.4.3
Validation: express-validator 7.0.1
File Upload: Multer 1.4.5
Email Service: Nodemailer with Gmail/SendGrid
AI Integration: OpenAI API SDK 4.0.0
Security: Helmet 7.1.0, cors 2.8.5
Logging: Morgan 1.10.0 + Winston 3.11.0
Rate Limiting: express-rate-limit 7.1.5
Testing: Jest 29.7.0 + Supertest
API Docs: Swagger/OpenAPI 3.0
```

### DevOps & Tools

```yaml
Version Control: Git/GitHub
Repository: github.com/PDAC95/plaice2.0
CI/CD: GitHub Actions
Container: Docker + Docker Compose
Monitoring: PM2 for Node.js processes
Error Tracking: Sentry (planned)
Analytics: Google Analytics 4
Package Manager: npm 10.x
Linting: ESLint + Prettier
Pre-commit: Husky + lint-staged
Environment: dotenv for configuration
```

## Code Conventions

### Naming Conventions

```javascript
// Frontend (Angular)
Components: property-list.component.ts (kebab-case)
Services: auth.service.ts (kebab-case)
Guards: auth.guard.ts (kebab-case)
Interfaces: IProperty, IUser (PascalCase with I prefix)
Models: property.model.ts (kebab-case)
Constants: APP_CONSTANTS.ts (UPPER_SNAKE_CASE)
Modules: properties.module.ts (kebab-case)

// Backend (Node.js)
Models: User.js, Property.js (PascalCase)
Controllers: authController.js (camelCase)
Routes: authRoutes.js (camelCase)
Middleware: authMiddleware.js (camelCase)
Services: emailService.js (camelCase)
Utils: dateHelper.js (camelCase)
Config: database.config.js (kebab-case)
```

### Git Commit Format

```
type(scope): subject

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Adding tests
- chore: Maintenance
- perf: Performance improvement

Examples:
feat(chat): integrate OpenAI API for property search
fix(auth): resolve JWT refresh token rotation issue
docs(api): update property endpoints documentation
```

### API Response Format

```javascript
// Success Response
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful",
  "metadata": {
    "timestamp": "2025-08-15T10:30:00Z",
    "version": "1.0"
  }
}

// Error Response
{
  "success": false,
  "error": {
    "message": "Detailed error description",
    "code": "ERROR_CODE",
    "statusCode": 400,
    "field": "fieldName" // For validation errors
  }
}

// Paginated Response
{
  "success": true,
  "data": {
    "results": [],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalResults": 100,
      "resultsPerPage": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### Error Handling Pattern

```javascript
// Backend Error Handler
class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
  }
}

// Usage
try {
  const result = await propertyService.create(data);
  res.status(201).json({ success: true, data: result });
} catch (error) {
  logger.error(`Error creating property: ${error.message}`);
  next(new AppError(error.message, 500, "PROPERTY_CREATE_ERROR"));
}

// Frontend Error Handling
this.propertyService
  .create(data)
  .pipe(
    catchError((error: HttpErrorResponse) => {
      this.notificationService.error(error.error.message);
      return throwError(() => error);
    })
  )
  .subscribe({
    next: (response) => console.log("Success:", response),
    error: (error) => console.error("Error:", error),
  });
```

## Environment Configuration

### Backend Environment Variables (.env)

```bash
# Server Configuration
NODE_ENV=development
PORT=5001
API_VERSION=v1

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/plaice
DB_NAME=plaice

# Authentication
JWT_SECRET=your-256-bit-secret-key-here
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRE=30d

# Email Service
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=Plaice <noreply@plaice.com>

# OpenAI Configuration
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=500

# Google Maps
GOOGLE_MAPS_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxx

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
ALLOWED_EXTENSIONS=jpg,jpeg,png,webp

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
FRONTEND_URL=http://localhost:4200
ALLOWED_ORIGINS=http://localhost:4200,https://plaice.com

# Redis (Future)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Sentry (Future)
SENTRY_DSN=
```

### Frontend Environment Variables

```typescript
// environment.development.ts
export const environment = {
  production: false,
  apiUrl: "http://localhost:5001/api",
  wsUrl: "ws://localhost:5001",
  googleMapsKey: "AIzaSyxxxxxxxxxxxxxxxxxx",
  googleAnalyticsId: "",
  supportedLanguages: ["en", "es"],
  defaultLanguage: "en",
  maxFileSize: 10485760, // 10MB
  allowedImageTypes: ["image/jpeg", "image/png", "image/webp"],
};

// environment.production.ts
export const environment = {
  production: true,
  apiUrl: "https://api.plaice.com/api",
  wsUrl: "wss://api.plaice.com",
  googleMapsKey: "AIzaSyxxxxxxxxxxxxxxxxxx",
  googleAnalyticsId: "G-XXXXXXXXXX",
  supportedLanguages: ["en", "es"],
  defaultLanguage: "en",
  maxFileSize: 10485760,
  allowedImageTypes: ["image/jpeg", "image/png", "image/webp"],
};
```

## API Design Patterns

### RESTful Endpoints Structure

```
# Authentication
POST   /api/auth/register          # User registration
POST   /api/auth/login             # User login
POST   /api/auth/refresh           # Refresh JWT token
POST   /api/auth/logout            # Logout user
GET    /api/auth/verify/:token     # Verify email
POST   /api/auth/forgot-password   # Request password reset
POST   /api/auth/reset-password    # Reset password
POST   /api/auth/google            # Google OAuth

# Properties
GET    /api/properties             # List properties (paginated)
GET    /api/properties/:id         # Get property details
POST   /api/properties             # Create property (agent only)
PUT    /api/properties/:id         # Update property (owner only)
PATCH  /api/properties/:id         # Partial update (owner only)
DELETE /api/properties/:id         # Delete property (owner only)
POST   /api/properties/:id/duplicate  # Duplicate property (agent)
POST   /api/properties/:id/schedule   # Schedule publication
GET    /api/properties/search      # Advanced search
GET    /api/properties/nearby      # Geo-based search

# AI Chat
POST   /api/chat/message           # Send message to AI
GET    /api/chat/conversations     # Get user conversations
GET    /api/chat/conversations/:id # Get conversation details
DELETE /api/chat/conversations/:id # Delete conversation
POST   /api/chat/feedback          # Rate AI response

# Favorites
GET    /api/favorites              # Get user favorites
POST   /api/favorites              # Add to favorites
DELETE /api/favorites/:propertyId  # Remove from favorites

# Users
GET    /api/users/profile          # Get current user profile
PUT    /api/users/profile          # Update profile
GET    /api/users/:id              # Get user info (public)
PUT    /api/users/preferences      # Update preferences
DELETE /api/users/account          # Delete account

# Analytics (Agent Dashboard)
GET    /api/analytics/properties   # Property performance
GET    /api/analytics/leads        # Lead statistics
GET    /api/analytics/views        # View analytics
```

### Authentication Flow

```
1. User Registration
   → POST /api/auth/register
   → Email verification sent
   → User redirected to verify page

2. Email Verification
   → GET /api/auth/verify/:token
   → Account activated
   → User can now login

3. Login Flow
   → POST /api/auth/login
   → Receive access_token + refresh_token
   → Store tokens securely

4. Token Refresh
   → POST /api/auth/refresh
   → New access_token issued
   → Refresh token rotated

5. Protected Request
   → Include Authorization: Bearer <token>
   → Token validated by middleware
   → Access granted/denied
```

## Security Standards

### Authentication & Authorization

- JWT with RS256 algorithm
- Refresh token rotation
- Role-based access control (client, agent, admin)
- Email verification required
- Password complexity requirements
- Account lockout after failed attempts
- Two-factor authentication (planned)

### Data Protection

- Input validation with express-validator
- MongoDB injection prevention
- XSS protection with DOMPurify
- CSRF tokens for state-changing operations
- Rate limiting per IP and user
- File upload restrictions
- API key rotation policy

### Security Headers

```javascript
// Helmet.js configuration
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        scriptSrc: ["'self'", "https://maps.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: [
          "'self'",
          "https://api.openai.com",
          "https://maps.googleapis.com",
        ],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
```

## Performance Optimization

### Backend Optimization

- MongoDB query optimization with proper indexing
- Mongoose lean() for read-only queries
- Connection pooling (default 10 connections)
- Response compression with gzip
- Pagination with cursor-based approach
- Caching strategy with Redis (planned)
- Image optimization on upload
- Lazy loading relationships

### Frontend Optimization

- Lazy loading Angular modules
- OnPush change detection strategy
- Image lazy loading with IntersectionObserver
- Bundle splitting per feature
- Tree shaking unused code
- Service Worker for offline capability
- HTTP caching headers
- CDN for static assets
- Preloading critical resources
- Virtual scrolling for large lists

### Monitoring Metrics

- API response time < 200ms (p95)
- Frontend Core Web Vitals:
  - LCP (Largest Contentful Paint) < 2.5s
  - FID (First Input Delay) < 100ms
  - CLS (Cumulative Layout Shift) < 0.1
- Database query time < 100ms
- Error rate < 1%
- Uptime > 99.9%

## Testing Strategy

### Unit Testing

```javascript
// Coverage targets
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

// Backend example (Jest)
describe('PropertyService', () => {
  it('should create a new property', async () => {
    const propertyData = { title: 'Test Property', price: 500000 };
    const result = await propertyService.create(propertyData);
    expect(result).toHaveProperty('_id');
    expect(result.title).toBe(propertyData.title);
  });
});

// Frontend example (Jasmine)
describe('PropertyComponent', () => {
  it('should display property list', () => {
    const fixture = TestBed.createComponent(PropertyListComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.property-card')).toBeTruthy();
  });
});
```

### Integration Testing

- API endpoint testing with Supertest
- Database operations with test database
- External service mocks (OpenAI, Email)
- Authentication flow testing
- File upload testing

### E2E Testing

- Critical user journeys:
  - User registration and verification
  - Property search with filters
  - AI chat interaction
  - Property creation (agent)
  - Favorites management
- Cross-browser testing (Chrome, Firefox, Safari, Edge)
- Mobile responsiveness testing
- Performance testing with Lighthouse

### Testing Tools

```yaml
Frontend:
  - Unit: Karma + Jasmine
  - Component: Angular Testing Library
  - E2E: Cypress 13.0

Backend:
  - Unit: Jest 29.7
  - Integration: Supertest 6.3
  - API: Postman/Newman
  - Load: Artillery 2.0
```

## Deployment Architecture

### Development Environment

- Local MongoDB instance
- Node.js with nodemon
- Angular dev server with HMR
- Mock data seeders
- Debug logging enabled

### Staging Environment

- MongoDB Atlas M10 cluster
- Docker containers
- NGINX reverse proxy
- SSL with Let's Encrypt
- Error tracking enabled
- Performance monitoring

### Production Environment

- MongoDB Atlas M30 cluster with replica set
- Load balanced Node.js instances
- Angular SSR for SEO (planned)
- CloudFlare CDN
- Auto-scaling enabled
- Full monitoring suite
- Automated backups

### CI/CD Pipeline

```yaml
name: Deploy Pipeline

on:
  push:
    branches: [main, develop]

jobs:
  test:
    steps: 1. Checkout code
      2. Install dependencies
      3. Run linting
      4. Run unit tests
      5. Run integration tests
      6. Build application

  deploy-staging:
    if: branch == develop
    steps: 1. Build Docker images
      2. Push to registry
      3. Deploy to staging
      4. Run smoke tests
      5. Notify team

  deploy-production:
    if: branch == main
    steps: 1. Manual approval required
      2. Build production images
      3. Blue-green deployment
      4. Health checks
      5. Rollback if failed
      6. Update monitoring
```

## Scaling Strategy

### Horizontal Scaling

- Node.js cluster mode (PM2)
- MongoDB sharding for properties collection
- Read replicas for analytics
- Queue system for email/notifications (Bull)
- Microservices architecture (future):
  - Auth service
  - Property service
  - Chat service
  - Notification service

### Vertical Scaling

- Auto-scaling policies based on:
  - CPU usage > 70%
  - Memory usage > 80%
  - Request queue length
  - Response time degradation

### Caching Strategy

```javascript
// Cache layers
1. Browser cache (static assets)
2. CDN cache (images, CSS, JS)
3. Application cache (Redis):
   - Session data (TTL: 24h)
   - Property searches (TTL: 5m)
   - User preferences (TTL: 1h)
   - AI responses (TTL: 1h)
4. Database cache (MongoDB):
   - Query result cache
   - Aggregation pipeline cache
```

## Risk Mitigation

### Technical Risks

- **OpenAI API Downtime**

  - Fallback to basic keyword search
  - Cache recent AI responses
  - Implement retry logic with exponential backoff

- **Database Performance**

  - Implement read replicas
  - Query optimization reviews
  - Index performance monitoring

- **Security Breaches**
  - Regular security audits
  - Dependency vulnerability scanning
  - Penetration testing quarterly

### Business Risks

- **Low User Adoption**

  - A/B testing for features
  - User feedback loops
  - Iterative improvements

- **Scaling Costs**
  - Cost monitoring alerts
  - Resource optimization
  - Reserved instance planning

## Development Workflow

### Branch Strategy

```
main           → Production deployment
├── develop    → Staging deployment
    ├── feature/PLAICE-XXX-description
    ├── bugfix/PLAICE-XXX-description
    └── hotfix/PLAICE-XXX-description
```

### Code Review Process

1. Create feature branch from develop
2. Implement feature with tests
3. Create pull request with description
4. Automated tests run
5. Peer review required
6. Merge after approval
7. Deploy to staging automatically
8. QA verification
9. Merge to main for production

### Definition of Done

- [ ] Code complete with comments
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] No console errors/warnings
- [ ] Performance benchmarks met
- [ ] Security scan passed
- [ ] Deployed to staging
- [ ] QA approved

---

**Document Status:**

- Created: August 2025
- Last Updated: August 2025
- Version: 1.0
- Maintained by: Engineering Team
- Next Review: September 2025
