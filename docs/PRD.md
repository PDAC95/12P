# Product Requirements Document (PRD)

## Plaice Real Estate Platform

**Version:** 1.0  
**Date:** August 2025  
**Author:** Product Team  
**Status:** Active Development

---

## Executive Summary

Plaice is a modern real estate platform that revolutionizes property search by integrating artificial intelligence with traditional filters. The platform enables users to find properties using both structured search and natural conversations with an AI assistant, creating a unique experience in the real estate market.

The current real estate market suffers from outdated interfaces and inefficient search processes that frustrate both buyers and agents. Plaice addresses this problem by offering an intuitive experience where users can describe their needs in natural language ("Looking for a 3-bedroom house near schools with a garden under $500k") and receive personalized and intelligent recommendations.

The platform is built with MEAN stack technology (MongoDB, Express.js, Angular 20, Node.js) to ensure scalability and performance. With differentiated role systems for clients, agents, and administrators, Plaice facilitates all real estate ecosystem interactions from initial search to transaction closure.

Currently in active development with core functionalities implemented, Plaice is positioned to capture a significant portion of the digital real estate market through its unique value proposition centered on conversational AI and superior user experience.

## Problem Statement

### Identified Problems

- **Inefficient Search:** Current platforms require multiple complex filters and technical knowledge of the real estate market
- **Fragmented Information:** Users must consult multiple sources to obtain complete property information
- **Poor Communication:** Lack of direct and efficient channels between buyers and agents
- **Outdated User Experience:** Antiquated interfaces that don't leverage modern technologies
- **Lack of Personalization:** Systems that don't learn from user preferences and behavior
- **Complex Transactional Process:** Multiple disconnected platforms and tools to complete transactions

### Problem Impact

- Excessive time in property search (average 8-12 weeks)
- User frustration with complex interfaces
- Lost opportunities due to slow communication
- Inefficiency in real estate agent work
- Lower overall satisfaction in the buying/renting process

## Target Users

### Primary User: Buyer/Renter (Client)

**Profile:** Young professional (25-35 years) searching for first home or upgrade

- **Needs:** Efficient search, complete information, direct communication with agents
- **Frustrations:** Complex platforms, outdated information, slow processes
- **Technology:** High adoption, mobile-first, values automation and AI
- **Behavior:** Researches extensively before making decisions, prefers digital experiences

### Secondary User: Real Estate Agent

**Profile:** Real estate professional (35-50 years) with medium-high experience, manages multiple properties

- **Needs:** Efficient listing management, qualified leads, communication tools
- **Frustrations:** Outdated platforms, low-quality leads, repetitive manual processes
- **Technology:** Medium-high adoption, seeks efficiency in work tools
- **Behavior:** Results-oriented, values tools that increase productivity

### Tertiary User: Platform Administrator

**Profile:** Operations manager (30-45 years) at real estate company or proptech

- **Needs:** Complete visibility, quality control, analytics and reports
- **Frustrations:** Lack of insights, intensive manual moderation, fragmented reports
- **Technology:** High technical competence, seeks comprehensive dashboards
- **Behavior:** Data-driven, focused on business metrics and operational optimization

## User Stories

### Search and Discovery

1. **As a client**, I want to search properties using natural language to find options without knowing technical real estate terminology
2. **As a client**, I want to filter properties by location, price, type and features to refine results according to my specific criteria
3. **As a client**, I want to see properties on an interactive map to understand locations and geographical context
4. **As a client**, I want to receive personalized recommendations based on my history to discover relevant properties

### Property Management

5. **As an agent**, I want to publish properties with complete information and multiple images to attract qualified buyers
6. **As an agent**, I want to duplicate similar properties to streamline the publication process of comparable listings
7. **As an agent**, I want to schedule property publications to coordinate marketing strategies

### Interaction and Communication

8. **As a client**, I want to start conversations about specific properties to obtain detailed information from the agent
9. **As a client**, I want to receive notifications when properties appear that match my criteria to not miss opportunities
10. **As an agent**, I want to receive qualified leads with AI conversation context to maximize conversion rate

### Account Management

11. **As a client**, I want to save favorite properties to review and compare options later
12. **As a user**, I want to maintain active session with secure authentication for convenient access without compromising security
13. **As an administrator**, I want to moderate content and manage users to maintain platform quality

## Functional Requirements

### Authentication and User Management

- Registration/login system with email and password
- OAuth authentication with Google and Facebook
- Mandatory email verification before full access
- Role system (client, agent, administrator) with differentiated permissions
- Profile management with personal information and preferences
- Password recovery with secure tokens

### Property Management

- Complete property CRUD with data validation
- Multiple image upload with drag & drop
- Map integration for geographical visualization
- Advanced filter system (price, location, type, features)
- Free text search and geolocation
- Status system (active, paused, sold, rented)
- Publication scheduling for specific dates

### Chat and Artificial Intelligence

- Conversational chat interface for natural language search
- Integration with AI APIs (OpenAI) for language processing
- Persistent conversation history
- Automatic suggestions based on context
- Iterative search refinement capability

### Favorites and Comparison System

- Save/remove properties from favorites list
- Side-by-side comparison of up to 3 properties
- Popularity counters (how many people saved as favorite)
- Personal notes on saved properties

### Notifications

- Email and push notification alerts
- Notifications when agents respond in chat
- Alerts for new properties matching criteria
- Granular notification preference configuration

### Dashboard and Analytics

- Personalized dashboard per user role
- Performance metrics for agents
- Platform analytics for administrators
- Activity and engagement reports

## Non-Functional Requirements

### Performance

- Initial load time < 3 seconds
- API response < 500ms for simple queries
- Support for 1000+ concurrent users
- Automatic image optimization
- Intelligent caching of frequently accessed data

### Security

- HTTPS encryption in all communications
- JWT tokens with expiration and automatic refresh
- User input validation and sanitization
- Rate limiting to prevent API abuse
- Protection against CSRF and XSS attacks
- Critical action auditing

### Scalability

- Horizontal scalable architecture
- Database optimized for complex queries
- CDN for static content distribution
- Load balancing for traffic distribution
- Microservices for specific functionalities

### Usability

- Responsive interface for desktop, tablet and mobile
- Learning time < 10 minutes for new users
- WCAG 2.1 AA compliance accessibility
- Multiple language support (Spanish, English)
- Consistent design with established design system

### Availability

- 99.5% minimum uptime
- Automatic daily backups
- Documented disaster recovery plan
- 24/7 monitoring and alerts
- Scheduled maintenance with minimal downtime

## Technology Stack

### Frontend

- **Framework:** Angular 20 with standalone components
- **Styling:** Bootstrap 5 + custom SCSS
- **State Management:** RxJS with services
- **Maps:** Leaflet for geographical visualization
- **Charts:** Chart.js for analytics
- **Build:** Angular CLI with production optimizations

### Backend

- **Runtime:** Node.js with Express.js framework
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT + Passport.js
- **Email:** Nodemailer with templates
- **File Upload:** Multer with file validation
- **Logging:** Winston with log rotation

### Infrastructure

- **Hosting:** Cloud provider (AWS/Google Cloud)
- **CI/CD:** GitHub Actions for automatic deployment
- **Monitoring:** Application performance monitoring
- **CDN:** CloudFront for content distribution
- **Database:** MongoDB Atlas for scalability
- **Email Service:** SendGrid for reliability

### External Integrations

- **AI Service:** OpenAI API for intelligent chat
- **Maps:** Google Maps API for geocoding
- **Social Auth:** Google/Facebook OAuth APIs
- **Payment:** Stripe for transactions (future)
- **Analytics:** Google Analytics for insights

## Success Metrics

### Adoption Metrics

- **Monthly Active Users (MAU):** Target 10,000 users in 12 months
- **User Registration Rate:** 15% of visitors register
- **Feature Adoption Rate:** 70% users use AI chat within first week
- **Mobile Usage:** 60% traffic from mobile devices

### Engagement Metrics

- **Session Duration:** Average 8+ minutes per session
- **Pages per Session:** 4+ pages per visit
- **Return User Rate:** 40% users return within 30 days
- **Chat Interactions:** 3+ messages average per chat session

### Business Metrics

- **Lead Quality Score:** 85% leads qualify as "high quality" by agents
- **Time to First Contact:** < 2 hours average between lead and contact
- **Property View to Inquiry Rate:** 12% conversion
- **Agent Satisfaction:** 4.5/5 rating in quarterly surveys

### Technical Metrics

- **API Response Time:** < 500ms 95th percentile
- **Error Rate:** < 1% of requests fail
- **Uptime:** 99.5% availability
- **Page Load Speed:** < 3 seconds load time

## MVP vs Full Version

### MVP (Minimum Viable Product)

**Timeline: 3-4 months**

**Included Features:**

- Basic authentication (email/password + Google OAuth)
- Property CRUD with images
- Traditional search and filters
- Favorites system
- Basic AI chat for search
- Simple dashboard per role
- Basic responsive design

**Excluded Features:**

- Interactive maps
- Push notifications
- Advanced analytics
- Complex external integrations
- Payment system

### Full Version

**Timeline: 8-12 months**

**Additional Features:**

- Interactive maps with geolocation
- Complete notification system
- Advanced analytics and reports
- 360° virtual tours
- External CRM integration
- Payment and commission system
- Native mobile app (PWA)
- Local MLS integrations
- Review and rating system
- Automated marketing tools

## Risks and Mitigations

### Technical Risks

**Risk:** Performance issues with large data volumes

- **Probability:** Medium
- **Impact:** High
- **Mitigation:** Implement caching, query optimization, proactive monitoring

**Risk:** Dependency on external APIs (OpenAI, Google Maps)

- **Probability:** Medium
- **Impact:** Medium
- **Mitigation:** Implement fallbacks, rate limiting, multiple providers

### Business Risks

**Risk:** Competition from established platforms

- **Probability:** High
- **Impact:** High
- **Mitigation:** Focus on AI differentiation, partnership with local agents

**Risk:** Changing regulations in real estate market

- **Probability:** Low
- **Impact:** High
- **Mitigation:** Specialized legal consulting, flexible architecture

### Adoption Risks

**Risk:** Agent resistance to new technology

- **Probability:** Medium
- **Impact:** Medium
- **Mitigation:** Onboarding program, training, dedicated support

**Risk:** Excessive expectations of AI capabilities

- **Probability:** Medium
- **Impact:** Medium
- **Mitigation:** Clear communication of limitations, user education

## Estimated Timeline

### Phase 1: MVP Development (Months 1-4)

- **Month 1:** Infrastructure setup, authentication, property base
- **Month 2:** Basic AI chat, favorites system, core frontend
- **Month 3:** Complete integration, testing, optimizations
- **Month 4:** Beta testing, refinements, MVP launch

### Phase 2: Feature Expansion (Months 5-8)

- **Month 5:** Interactive maps, basic notifications
- **Month 6:** Analytics dashboard, agent tools
- **Month 7:** Mobile optimizations, external integrations
- **Month 8:** Advanced features, scale preparation

### Phase 3: Scale & Optimize (Months 9-12)

- **Month 9:** Performance optimization, advanced monitoring
- **Month 10:** Enterprise features, CRM integrations
- **Month 11:** Advanced analytics, machine learning
- **Month 12:** Preparation for geographical expansion

## Next Steps

### Next 5 Concrete Steps

1. **Complete Current Sprint 3**

   - Finalize advanced property functionalities
   - Implement specific filters for co-living
   - Develop property duplication system
   - **Timeline:** 2 weeks

2. **Implement Functional AI Chat**

   - Fully integrate OpenAI API
   - Develop conversational interface
   - Create context management system
   - **Timeline:** 3 weeks

3. **Production Infrastructure Setup**

   - Configure staging/production environments
   - Implement CI/CD pipeline
   - Setup monitoring and logging
   - **Timeline:** 1 week

4. **Beta Testing Program**

   - Recruit 20-30 beta users (mix of clients and agents)
   - Implement feedback collection system
   - Create structured testing plan
   - **Timeline:** 2 weeks

5. **Go-to-Market Strategy**
   - Define pricing model
   - Create marketing materials
   - Establish partnerships with local agents
   - **Timeline:** 4 weeks

## Data Model Specification

### Core Data Schemas

#### Property Schema

```javascript
{
  _id: ObjectId,
  title: String, // required
  description: String,
  price: Number, // required
  type: String, // enum: ['house', 'apartment', 'condo', 'townhouse', 'commercial']
  listingType: String, // enum: ['sale', 'rent']
  status: String, // enum: ['available', 'pending', 'sold', 'rented']

  // Location
  location: {
    address: String, // required
    city: String, // required
    state: String, // required
    zipCode: String,
    country: String, // default: 'CA'
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },

  // Property Details
  features: {
    bedrooms: Number,
    bathrooms: Number,
    area: Number, // square feet
    lotSize: Number,
    yearBuilt: Number,
    parking: Number,
    amenities: [String] // ['pool', 'gym', 'balcony', 'garden']
  },

  // Media
  images: [{
    url: String,
    caption: String,
    isPrimary: Boolean,
    order: Number
  }],
  virtualTour: {
    url: String,
    provider: String // '360', 'matterport'
  },

  // Ownership & Management
  owner: ObjectId, // ref: User (agent)
  published: Boolean, // default: false
  publishedAt: Date,
  scheduledPublishAt: Date,

  // Analytics
  views: Number, // default: 0
  inquiries: Number, // default: 0
  favorites: Number, // default: 0

  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  expiresAt: Date
}
```

#### User Schema

```javascript
{
  _id: ObjectId,
  firstName: String, // required
  lastName: String, // required
  email: String, // required, unique
  password: String, // hashed, required if local auth
  phone: String,

  // Authentication
  role: String, // enum: ['client', 'agent', 'admin']
  authProvider: String, // enum: ['local', 'google', 'facebook']
  googleId: String,
  facebookId: String,
  isEmailVerified: Boolean, // default: false
  emailVerificationToken: String,
  emailVerificationExpires: Date,

  // Profile
  avatar: String, // URL
  profilePicture: String, // URL from social login
  bio: String,
  preferences: {
    notifications: {
      email: Boolean, // default: true
      push: Boolean, // default: true
      sms: Boolean // default: false
    },
    language: String, // default: 'en'
    currency: String, // default: 'CAD'
    searchCriteria: {
      priceRange: {
        min: Number,
        max: Number
      },
      propertyTypes: [String],
      locations: [String],
      features: {
        minBedrooms: Number,
        minBathrooms: Number,
        amenities: [String]
      }
    }
  },

  // Agent-specific fields
  agentInfo: {
    license: String,
    company: String,
    specializations: [String],
    experience: Number, // years
    rating: Number, // 0-5
    reviewCount: Number,
    verified: Boolean,
    activeListings: Number
  },

  // Activity tracking
  lastLogin: Date,
  isActive: Boolean, // default: true
  favorites: [ObjectId], // ref: Property
  savedSearches: [{
    name: String,
    criteria: Object,
    createdAt: Date
  }],

  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

#### Conversation Schema

```javascript
{
  _id: ObjectId,
  userId: ObjectId, // ref: User, required
  propertyId: ObjectId, // ref: Property, optional
  agentId: ObjectId, // ref: User (agent), optional

  // Conversation metadata
  type: String, // enum: ['ai_search', 'agent_inquiry', 'general']
  status: String, // enum: ['active', 'resolved', 'archived']
  subject: String,

  // Messages
  messages: [{
    _id: ObjectId,
    sender: {
      id: ObjectId,
      type: String, // enum: ['user', 'agent', 'ai']
      name: String
    },
    content: String, // required
    messageType: String, // enum: ['text', 'property_suggestion', 'system']
    timestamp: Date, // default: Date.now

    // AI-specific fields
    aiContext: {
      intent: String, // 'search', 'question', 'refinement'
      extractedCriteria: Object,
      suggestedProperties: [ObjectId],
      confidence: Number // 0-1
    },

    // Metadata
    isRead: Boolean, // default: false
    reactions: [{
      userId: ObjectId,
      type: String // 'like', 'helpful', 'not_helpful'
    }]
  }],

  // Analytics
  totalMessages: Number, // default: 0
  lastActivity: Date,
  responseTime: Number, // average in seconds
  satisfaction: {
    rating: Number, // 1-5
    feedback: String,
    submittedAt: Date
  },

  // Search context (for AI conversations)
  searchContext: {
    originalQuery: String,
    refinedCriteria: Object,
    viewedProperties: [ObjectId],
    bookmarkedProperties: [ObjectId]
  },

  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Angular 20    │    │   Express.js    │    │   MongoDB       │
│   Frontend      │◄──►│   Backend       │◄──►│   Database      │
│                 │    │                 │    │                 │
│ • Components    │    │ • REST APIs     │    │ • Collections   │
│ • Services      │    │ • Middleware    │    │ • Indexes       │
│ • Guards        │    │ • Controllers   │    │ • Aggregations  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  External APIs  │    │   File Storage  │    │   Monitoring    │
│                 │    │                 │    │                 │
│ • OpenAI        │    │ • Images        │    │ • Logs          │
│ • Google Maps   │    │ • Documents     │    │ • Metrics       │
│ • Social Auth   │    │ • CDN           │    │ • Alerts        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### User Flow Diagrams

#### Property Search Flow

```
[User] → [Home Page] → [Search Input] → [AI Processing] → [Results Display]
   │                                                            │
   └── [Traditional Filters] → [Filter Logic] → [Filtered Results]
                                                       │
                                                       ▼
                                           [Property Details] → [Contact Agent]
                                                       │              │
                                                       ▼              ▼
                                               [Add to Favorites] [Start Chat]
```

#### Agent Property Management Flow

```
[Agent Login] → [Dashboard] → [Add Property] → [Property Form] → [Image Upload]
                     │                                               │
                     └── [My Listings] → [Edit Property] → [Update Status]
                                              │                    │
                                              ▼                    ▼
                                        [Schedule Publish] → [Analytics View]
```

## AI Chat Specifications

### Example Conversations

#### Conversation 1: Initial Property Search

```
User: "I'm looking for a family home in Toronto under $800k"

AI: "I'd be happy to help you find a family home in Toronto! To provide the best recommendations, could you tell me:
- How many bedrooms do you need?
- Any specific neighborhoods you prefer?
- Important features like parking or yard space?"

User: "3 bedrooms, preferably North York, and definitely need parking"

AI: "Perfect! I found 12 properties in North York with 3+ bedrooms, parking, and under $800k. Here are the top matches:

🏠 Beautiful 3BR Townhouse - $749,000
📍 North York • 3 bed, 2 bath • 2-car garage
Recently renovated with modern kitchen

🏠 Spacious Family Home - $775,000
📍 North York • 4 bed, 3 bath • Driveway + garage
Large backyard, close to schools

Would you like to see more details on any of these?"

User: "Tell me more about the townhouse"

AI: "Great choice! Here are the details for the 3BR Townhouse:

📋 Property Details:
• Address: 123 Maple Street, North York
• Built: 2018 (5 years old)
• Size: 1,850 sq ft
• Lot: 25' x 100'

✨ Key Features:
• Open concept main floor
• Upgraded kitchen with quartz counters
• Master bedroom with ensuite
• Finished basement
• 2-car attached garage

🏫 Nearby:
• Earl Haig Secondary (0.3km)
• Fairview Mall (1.2km)
• TTC Bus route (2 min walk)

Would you like to schedule a viewing or see similar properties?"
```

#### Conversation 2: Refinement Search

```
User: "The townhouse looks good but do you have anything with a bigger yard?"

AI: "Absolutely! Looking for larger outdoor space. I'll search for properties with bigger yards in North York.

Here are 3 options with more substantial yard space:

🏠 4BR Detached Home - $789,000
📍 Yards: 50' x 120' (6,000 sq ft lot!)
Large deck, mature trees, garden space

🏠 3BR Bungalow - $729,000
📍 Corner lot with wraparound yard
Perfect for kids and pets

Would you prefer a detached home for more privacy, or are you open to other styles with large yards?"

User: "The detached home sounds perfect! Can I see photos?"

AI: "Excellent! The 4BR detached home has a beautiful property. I've pulled up the photo gallery showing:

📸 Available Photos:
• Front exterior and landscaping
• Spacious backyard with deck
• Interior rooms and layout
• Kitchen and bathrooms

[Property Gallery Display]

This home also has recent upgrades including new HVAC and flooring. The backyard is fantastic for families - it has a large deck, mature maple trees, and space for a garden.

Would you like me to connect you with the listing agent to arrange a viewing?"
```

### AI Model Limitations

#### What the AI Can Do:

- **Natural Language Processing:** Understand conversational property descriptions
- **Criteria Extraction:** Parse requirements from casual conversation
- **Property Matching:** Find relevant properties based on extracted criteria
- **Context Retention:** Remember previous conversation context
- **Smart Suggestions:** Recommend similar or alternative properties
- **Question Generation:** Ask clarifying questions to refine search

#### What the AI Cannot Do:

- **Provide Legal Advice:** Cannot advise on contracts, regulations, or legal matters
- **Make Financial Recommendations:** Cannot suggest mortgage options or investment advice
- **Guarantee Accuracy:** Property information may change; always verify with agent
- **Replace Professional Services:** Cannot substitute for real estate agent expertise
- **Access Private Information:** Cannot see non-public property details or pricing
- **Predict Market Changes:** Cannot forecast property values or market trends

### Specific Use Cases

#### Use Case 1: First-Time Buyer

**Scenario:** Young professional, unfamiliar with real estate terminology
**AI Approach:**

- Use simple, friendly language
- Explain real estate terms when introduced
- Ask budget-setting questions carefully
- Suggest neighborhoods based on lifestyle preferences
- Provide educational context about the buying process

#### Use Case 2: Experienced Investor

**Scenario:** Real estate investor looking for rental properties
**AI Approach:**

- Use technical terminology appropriately
- Focus on investment metrics (cap rates, cash flow potential)
- Suggest properties based on rental market data
- Provide comparative market analysis information
- Discuss property management considerations

#### Use Case 3: Family Relocation

**Scenario:** Family moving from another city/country
**AI Approach:**

- Focus heavily on neighborhood amenities
- Highlight school districts and ratings
- Discuss transportation and commute options
- Suggest family-friendly communities
- Provide local area information and resources

### Error Handling and Fallbacks

#### Technical Errors

```
AI Response: "I'm experiencing a temporary issue accessing property data. Let me try a different approach or connect you with one of our agents who can help immediately."

Fallback Actions:
1. Retry query with simplified parameters
2. Suggest manual search filters
3. Offer to connect with human agent
4. Provide general property search tips
```

#### Ambiguous Queries

```
User: "I want something nice"

AI Response: "I'd love to help you find something perfect! 'Nice' means different things to different people. Could you help me understand what's most important to you:

• A specific location or neighborhood?
• Your budget range?
• Type of property (house, condo, apartment)?
• Key features that matter most to you?

Even one or two details will help me find much better matches!"
```

#### No Results Found

```
AI Response: "I didn't find any properties that match all your criteria in North York under $600k with 4+ bedrooms. Here are some alternatives:

🔄 Expand Search:
• Increase budget to $650k (3 more options)
• Consider 3-bedroom homes with bonus room
• Look at nearby areas like Richmond Hill

Would you like to adjust any of these criteria, or should I show you the closest matches I found?"
```

#### Out of Scope Requests

```
User: "What's the best mortgage rate I can get?"

AI Response: "That's a great question about financing! However, mortgage rates depend on many personal factors that I cannot access or evaluate.

I'd recommend speaking with:
• Your bank's mortgage specialist
• A mortgage broker
• Our partner lenders who can provide personalized quotes

I can help you find properties that fit your budget once you have pre-approval information. Would you like to continue looking at homes in your price range?"
```

## API Specification (Key Endpoints)

### Authentication Endpoints

#### POST /api/auth/register

**Description:** Register new user account
**Request Body:**

```json
{
  "firstName": "string", // required
  "lastName": "string", // required
  "email": "string", // required, valid email
  "password": "string", // required, min 6 chars
  "phone": "string", // optional
  "role": "string", // enum: ['client', 'agent'], default: 'client'
  "agentInfo": {
    // required if role === 'agent'
    "license": "string",
    "company": "string",
    "specializations": ["string"]
  }
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": {
    "user": {
      "id": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "role": "string",
      "isEmailVerified": false
    },
    "token": "string",
    "expiresIn": "7d"
  }
}
```

#### POST /api/auth/login

**Description:** User authentication
**Request Body:**

```json
{
  "email": "string", // required
  "password": "string" // required
}
```

#### POST /api/auth/google

**Description:** Google OAuth authentication
**Request Body:**

```json
{
  "token": "string" // Google ID token
}
```

### Property Endpoints

#### GET /api/properties

**Description:** Search and filter properties
**Query Parameters:**

```
?page=1&limit=12&sortBy=price&sortOrder=desc&type=house&minPrice=200000&maxPrice=800000&city=Toronto&bedrooms=3&bathrooms=2&amenities=parking,garden
```

**Available Filters:**

- `page` (number): Page number for pagination
- `limit` (number): Items per page (max 50)
- `sortBy` (string): Sort field ['price', 'createdAt', 'area', 'bedrooms']
- `sortOrder` (string): Sort direction ['asc', 'desc']
- `type` (string): Property type ['house', 'apartment', 'condo', 'townhouse']
- `listingType` (string): Listing type ['sale', 'rent']
- `minPrice`/`maxPrice` (number): Price range
- `city`, `state`, `zipCode` (string): Location filters
- `bedrooms`, `bathrooms` (number): Room requirements
- `minArea`/`maxArea` (number): Square footage range
- `amenities` (string): Comma-separated amenities
- `keywords` (string): Free text search

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "string",
        "title": "string",
        "price": 750000,
        "type": "house",
        "listingType": "sale",
        "location": {
          "address": "string",
          "city": "string",
          "state": "string"
        },
        "features": {
          "bedrooms": 3,
          "bathrooms": 2,
          "area": 1850
        },
        "images": [
          {
            "url": "string",
            "isPrimary": true
          }
        ],
        "published": true,
        "publishedAt": "2025-08-15T10:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 25,
      "totalResults": 294,
      "resultsPerPage": 12,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

#### GET /api/properties/:id

**Description:** Get detailed property information
**Path Parameters:**

- `id` (string): Property ID

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "description": "string",
    "price": 750000,
    "type": "house",
    "listingType": "sale",
    "status": "available",
    "location": {
      "address": "123 Main Street",
      "city": "Toronto",
      "state": "Ontario",
      "zipCode": "M1A 1A1",
      "coordinates": {
        "latitude": 43.6532,
        "longitude": -79.3832
      }
    },
    "features": {
      "bedrooms": 3,
      "bathrooms": 2,
      "area": 1850,
      "lotSize": 6000,
      "yearBuilt": 2018,
      "parking": 2,
      "amenities": ["garage", "garden", "hardwood"]
    },
    "images": [
      {
        "url": "string",
        "caption": "string",
        "isPrimary": true,
        "order": 1
      }
    ],
    "virtualTour": {
      "url": "string",
      "provider": "360"
    },
    "owner": {
      "id": "string",
      "name": "Agent Name",
      "company": "Real Estate Inc",
      "phone": "+1-555-0123",
      "email": "agent@example.com"
    },
    "analytics": {
      "views": 245,
      "inquiries": 12,
      "favorites": 8
    },
    "publishedAt": "2025-08-15T10:30:00Z",
    "createdAt": "2025-08-15T09:15:00Z",
    "updatedAt": "2025-08-15T14:22:00Z"
  }
}
```

#### POST /api/properties

**Description:** Create new property listing (Agent only)
**Headers:** `Authorization: Bearer <token>`
**Request Body:**

```json
{
  "title": "string", // required
  "description": "string",
  "price": 750000, // required
  "type": "house", // required
  "listingType": "sale", // required
  "location": {
    "address": "string", // required
    "city": "string", // required
    "state": "string", // required
    "zipCode": "string"
  },
  "features": {
    "bedrooms": 3,
    "bathrooms": 2,
    "area": 1850,
    "yearBuilt": 2018,
    "amenities": ["garage", "garden"]
  },
  "published": false,
  "scheduledPublishAt": "2025-08-20T09:00:00Z"
}
```

### Chat Endpoints

#### POST /api/chat/message

**Description:** Send message to AI chat system
**Headers:** `Authorization: Bearer <token>`
**Request Body:**

```json
{
  "message": "string", // required, user message
  "conversationId": "string", // optional, for continuing conversation
  "propertyId": "string", // optional, for property-specific chat
  "context": {
    "searchCriteria": {
      "priceRange": { "min": 200000, "max": 800000 },
      "location": "Toronto",
      "propertyType": "house"
    },
    "previouslyViewed": ["propertyId1", "propertyId2"]
  }
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "conversationId": "string",
    "response": {
      "message": "string", // AI response text
      "messageType": "text", // ['text', 'property_suggestion', 'clarification']
      "suggestedProperties": [
        {
          "id": "string",
          "title": "string",
          "price": 750000,
          "location": "Toronto, ON",
          "bedrooms": 3,
          "matchReason": "Matches your budget and location preferences"
        }
      ],
      "extractedCriteria": {
        "priceRange": { "min": 200000, "max": 800000 },
        "location": "Toronto",
        "bedrooms": 3,
        "amenities": ["parking"]
      },
      "followUpQuestions": [
        "Would you prefer a specific neighborhood in Toronto?",
        "How important is proximity to transit?"
      ],
      "confidence": 0.85 // AI confidence in understanding (0-1)
    },
    "conversation": {
      "id": "string",
      "messageCount": 3,
      "lastActivity": "2025-08-15T14:30:00Z"
    }
  }
}
```

#### GET /api/chat/conversations

**Description:** Get user's chat conversations
**Headers:** `Authorization: Bearer <token>`
**Query Parameters:**

```
?page=1&limit=10&type=ai_search&status=active
```

#### GET /api/chat/conversations/:id

**Description:** Get specific conversation with full message history
**Headers:** `Authorization: Bearer <token>`

### Favorites Endpoints

#### POST /api/favorites

**Description:** Add property to favorites
**Headers:** `Authorization: Bearer <token>`
**Request Body:**

```json
{
  "propertyId": "string", // required
  "notes": "string", // optional
  "tags": ["string"] // optional
}
```

#### DELETE /api/favorites/:propertyId

**Description:** Remove property from favorites
**Headers:** `Authorization: Bearer <token>`

#### GET /api/favorites

**Description:** Get user's favorite properties
**Headers:** `Authorization: Bearer <token>`

### Error Responses

**Validation Error (400):**

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "statusCode": 400,
    "details": [
      {
        "field": "email",
        "message": "Valid email is required"
      }
    ]
  }
}
```

**Authentication Error (401):**

```json
{
  "success": false,
  "error": {
    "message": "Authentication required",
    "statusCode": 401
  }
}
```

**Not Found (404):**

```json
{
  "success": false,
  "error": {
    "message": "Property not found",
    "statusCode": 404
  }
}
```

**Server Error (500):**

```json
{
  "success": false,
  "error": {
    "message": "Internal server error",
    "statusCode": 500
  }
}
```

---

**Document Control:**

- Last Updated: August 2025
- Next Review: September 2025
- Owner: Product Team
- Stakeholders: Engineering, Design, Business Development
