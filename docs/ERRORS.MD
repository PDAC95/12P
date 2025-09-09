# ERROR LOG - Plaice Real Estate Platform

## HOW TO DOCUMENT ERRORS

Each error entry must include:

1. **Date & Time** when error occurred
2. **File & Line** where error happened
3. **Error Message** complete and exact
4. **Context** what was being attempted
5. **Stack Trace** if applicable
6. **Solution Attempts** what was tried
7. **Resolution** final solution or current status

Format:

```markdown
- [ ] [2025-MM-DD HH:MM] Brief error description
  - **File:** path/to/file.js:lineNumber
  - **Error:** Complete error message
  - **Context:** What operation was being performed
  - **Stack:** Stack trace if relevant
  - **Attempted:**
    1. First solution attempt
    2. Second solution attempt
  - **Status:** [ACTIVE/RESOLVED/BLOCKED]
  - **Solution:** How it was fixed (if resolved)
```

---

## 🔴 CRITICAL ERRORS (Blockers)

Errors that completely prevent development or break the system

### Active Critical Errors:

_No critical errors currently active_

---

## 🟡 ACTIVE ERRORS (Non-Critical)

Errors that don't block development but need fixing

### Active Non-Critical Errors:

- [ ] [2025-08-15 10:00] Angular build warnings - Optional chaining operators

  - **File:** frontend/src/app/pages/dashboard/agent-dashboard/agent-dashboard.html:167-266
  - **Error:** "NG8107: The left side of this optional chain operation does not include 'null' or 'undefined'"
  - **Context:** Building Angular application
  - **Stack:** Multiple warnings during `ng serve`
  - **Attempted:**
    1. Identified unnecessary optional operators in template
    2. Need to remove `?.` where not needed
  - **Status:** ACTIVE
  - **Solution:** Pending - Remove unnecessary optional chaining

- [ ] [2025-08-15 10:00] SASS deprecation warnings

  - **File:** Multiple .scss files in frontend
  - **Error:** "darken() and lighten() are deprecated. Use color.adjust() instead"
  - **Context:** Compiling SCSS during build
  - **Stack:**
    ```
    agent-dashboard.scss:757, 830, 834, 838
    my-properties.scss:794, 803
    compare-drawer.component.scss:160, 292, 360, 361, 378
    ```
  - **Attempted:**
    1. Identified all deprecated function usage
  - **Status:** ACTIVE
  - **Solution:** Replace with color.adjust() or color.scale()

- [ ] [2025-08-15 10:00] Unused imports in components
  - **File:**
    - frontend/src/app/pages/favorites/favorites.ts (RouterLink)
    - frontend/src/app/pages/agent/my-properties/my-properties.ts (PropertyCard)
    - frontend/src/app/shared/components/compare-drawer/compare-drawer.component.ts (RouterLink)
  - **Error:** "TS-998113: [Component] is not used within the template"
  - **Context:** TypeScript compilation
  - **Attempted:**
    1. Identified unused imports
  - **Status:** ACTIVE
  - **Solution:** Remove unused imports from components

---

## 🟢 RESOLVED ERRORS (Reference)

Keep for future reference when similar issues occur

### Recently Resolved:

- [x] [2025-08-08 11:00] Email verification token expiring too quickly

  - **File:** backend/src/controllers/authController.js:45
  - **Error:** "Token expired" when users click verification link
  - **Context:** Users registering and trying to verify email
  - **Attempted:**
    1. Checked token generation logic
    2. Verified EMAIL_VERIFICATION_EXPIRY in .env
  - **Status:** RESOLVED
  - **Solution:** Changed EMAIL_VERIFICATION_EXPIRY from 3600000 (1hr) to 86400000 (24hrs)

- [x] [2025-08-05 15:00] Property images not displaying after upload
  - **File:** backend/src/app.js:32
  - **Error:** "Cannot GET /uploads/image.jpg"
  - **Context:** Viewing uploaded property images
  - **Attempted:**
    1. Checked file upload path
    2. Verified static file serving configuration
  - **Status:** RESOLVED
  - **Solution:** Added `app.use('/uploads', express.static('uploads'))` to serve static files

---

## ⚠️ PROBLEMATIC PATTERNS

Recurring issues and their solutions

### Pattern: Missing .env variables in development

**Problem:** Backend crashes with "Cannot read property of undefined"
**Solution:** Always check for required environment variables on startup

```javascript
// backend/src/server.js
const requiredEnvVars = [
  "MONGO_URI",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "PORT",
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    process.exit(1);
  }
});
```

### Pattern: MongoDB connection failures on startup

**Problem:** "MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017"
**Solution:** Implement retry logic with exponential backoff

```javascript
// backend/src/config/database.js
const connectDB = async (maxRetries = 5) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("✅ MongoDB Connected Successfully");
      return;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error.message);
      if (i === maxRetries - 1) throw error;
      await new Promise((r) => setTimeout(r, 5000 * Math.pow(2, i)));
    }
  }
};
```

### Pattern: Angular standalone component import issues

**Problem:** "Component is not a known element"
**Solution:** Always import required components in standalone components

```typescript
// frontend/src/app/pages/properties/property-list.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PropertyCard } from '../../shared/components/property-card/property-card';

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [CommonModule, RouterLink, PropertyCard], // All imports required
  templateUrl: './property-list.html'
})
```

### Pattern: CORS issues between frontend and backend

**Problem:** "Access to XMLHttpRequest blocked by CORS policy"
**Solution:** Proper CORS configuration in Express

```javascript
// backend/src/app.js
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:4200",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
```

### Pattern: JWT token not being sent with requests

**Problem:** "401 Unauthorized" on protected routes
**Solution:** Use Angular HTTP interceptor

```typescript
// frontend/src/app/interceptors/auth.interceptor.ts
intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  const token = localStorage.getItem('access_token');
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  return next.handle(req);
}
```

---

## 📚 LESSONS LEARNED

### MongoDB Issues

- Always ensure MongoDB service is running: `mongod` or `brew services start mongodb-community`
- Connection string for local: `mongodb://localhost:27017/12p`
- Use proper indexes for frequently queried fields
- Enable query logging in development for debugging

### Angular 20 Issues

- Standalone components require ALL imports explicitly
- Lazy loading requires proper route configuration with loadComponent
- Don't use `.component.ts` suffix in Angular 20
- RxJS subscriptions should use takeUntilDestroyed() or manual unsubscribe

### Authentication Issues

- Store JWT in httpOnly cookies for production (localStorage for dev is OK)
- Implement refresh token rotation for security
- Always validate email before allowing full access
- Handle token expiration gracefully with interceptors

### File Upload Issues

- Set proper multer limits to prevent large file attacks
- Always validate file type AND extension
- Create uploads directory if it doesn't exist
- Use unique filenames to prevent conflicts

---

## 🔧 COMMON SOLUTION SNIPPETS

### Plaice-Specific: Property Image Upload Handler

```javascript
// backend/src/middleware/upload.js
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/properties";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `property-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG and WebP images are allowed"));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter,
});
```

### Plaice-Specific: Email Verification with Retry

```javascript
// backend/src/services/emailService.js
const sendVerificationEmail = async (user, maxRetries = 3) => {
  const token = generateVerificationToken();
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  for (let i = 0; i < maxRetries; i++) {
    try {
      if (process.env.NODE_ENV === "development") {
        console.log(`📧 Verification URL: ${verificationUrl}`);
        return { success: true, message: "Email logged to console (dev mode)" };
      }

      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: "Verify your Plaice account",
        html: emailTemplate(verificationUrl),
      });

      return { success: true };
    } catch (error) {
      console.error(`Email attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) throw error;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
};
```

### Plaice-Specific: Property Search with Filters

```javascript
// backend/src/controllers/propertyController.js
const searchProperties = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      sortBy = "createdAt",
      sortOrder = "desc",
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      type,
      city,
      amenities,
    } = req.query;

    const query = { published: true };

    // Build dynamic query
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (bedrooms) query["features.bedrooms"] = { $gte: Number(bedrooms) };
    if (bathrooms) query["features.bathrooms"] = { $gte: Number(bathrooms) };
    if (type) query.type = type;
    if (city) query["location.city"] = new RegExp(city, "i");
    if (amenities) {
      query["features.amenities"] = {
        $in: amenities.split(",").map((a) => a.trim()),
      };
    }

    const properties = await Property.find(query)
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Property.countDocuments(query);

    res.json({
      success: true,
      data: {
        results: properties,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalResults: count,
          resultsPerPage: limit,
        },
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Search failed", code: "SEARCH_ERROR" },
    });
  }
};
```

---

## 🚨 FRAMEWORK-SPECIFIC ERRORS

### Angular 20 Errors

- Component import issues with standalone components
- Lazy loading route configuration problems
- Change detection issues with OnPush strategy
- RxJS memory leaks from unsubscribed observables

### Express.js Errors

- Middleware order issues (body-parser must come before routes)
- Async error handling without try-catch
- Missing error handler middleware
- CORS configuration problems

### MongoDB/Mongoose Errors

- Schema validation errors
- Index creation failures
- Connection pool exhaustion
- Query timeout issues

### Development Environment Errors

- Port already in use (5001 or 4200)
- Node version incompatibility
- Missing npm packages after pull
- Environment variable not loaded

---

## 📊 ERROR LOG HISTORY

### Week of 2025-08-12 to 2025-08-18

- Total errors encountered: 5
- Critical errors: 0
- Resolved: 2 (40% resolution rate)
- Still active: 3
- Average fix time: 17.5 minutes
- Most common category: Build warnings (60%)

### Previous Week 2025-08-05 to 2025-08-11

- Total errors encountered: 8
- Critical errors: 2
- Resolved: 8 (100% resolution rate)
- Average fix time: 25 minutes

### Error Categories Breakdown:

- **Build/Compilation:** 3 errors (60%)
- **Configuration:** 1 error (20%)
- **Runtime:** 1 error (20%)

---

## 🏷️ QUICK SEARCH TAGS

**Common Tags:**

- `#angular` - Angular-specific errors
- `#backend` - Backend/Express errors
- `#mongodb` - Database errors
- `#auth` - Authentication issues
- `#build` - Build/compilation errors
- `#styling` - CSS/SASS issues
- `#deployment` - Deployment errors
- `#api` - API endpoint errors
- `#performance` - Performance issues
- `#security` - Security vulnerabilities

---

## 🔍 DEBUGGING CHECKLIST

When encountering a new error:

1. **Immediate Actions:**

   - [ ] Copy exact error message
   - [ ] Note file and line number
   - [ ] Check browser console for additional errors
   - [ ] Check backend logs: `tail -f backend/logs/error.log`
   - [ ] Verify all services running (MongoDB, backend, frontend)

2. **Investigation:**

   - [ ] Search this file for similar errors
   - [ ] Check recent git commits for changes
   - [ ] Verify `npm install` in both frontend and backend
   - [ ] Check MongoDB connection: `mongosh`
   - [ ] Review network tab in browser DevTools

3. **Common Fixes to Try:**

   - [ ] Restart all services
   - [ ] Clear browser cache and localStorage
   - [ ] Delete node_modules and reinstall
   - [ ] Check .env file has all required variables
   - [ ] Verify MongoDB is running

4. **Documentation:**
   - [ ] Add error to appropriate section above
   - [ ] Document all solution attempts
   - [ ] Update status (ACTIVE/RESOLVED/BLOCKED)
   - [ ] Add solution when found
   - [ ] Create reusable snippet if applicable

---

**Last Updated:** 2025-08-15 11:00  
**Total Documented Errors:** 5  
**Resolution Rate:** 40%  
**Most Common Issue:** Build warnings (60% of errors)
