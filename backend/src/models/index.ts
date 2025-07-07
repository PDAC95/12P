// src/types/index.ts
import { Document, Types } from "mongoose";

// Use Types.ObjectId instead of ObjectId
export type ObjectId = Types.ObjectId;

// Base interface for all documents
export interface BaseDocument extends Document {
  _id: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// User related types
export type UserType = "buyer" | "seller" | "agent" | "investor";

export interface IUser extends BaseDocument {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  userType: UserType;
  avatar?: string;
  isVerified: boolean;
  emailVerificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;

  // Instance methods
  comparePassword?(candidatePassword: string): Promise<boolean>;
  getFullName?(): string;
  generateEmailVerificationToken?(): string;
  generatePasswordResetToken?(): string;
}

// Location interface for properties
export interface ILocation {
  address: string;
  city: string;
  province: string;
  postalCode: string;
  coordinates: [number, number]; // [longitude, latitude]
}

// Property related types
export type PropertyType =
  | "Condo"
  | "Detached House"
  | "Townhouse"
  | "Bungalow"
  | "Loft"
  | "Apartment"
  | "Commercial"
  | "Land";
export type PropertyStatus =
  | "active"
  | "sold"
  | "pending"
  | "draft"
  | "inactive";

export interface IProperty extends BaseDocument {
  title: string;
  description: string;
  price: number;
  location: ILocation;
  type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  area: number; // square feet
  features: string[];
  images: string[];
  status: PropertyStatus;
  owner: ObjectId; // Reference to User
  views: number;
  featured: boolean;
  listingDate: Date;

  // Virtual properties
  pricePerSqFt?: number;
  daysOnMarket?: number;

  // Instance methods
  incrementViews?(): Promise<IProperty>;
  getFormattedPrice?(): string;
  getFullAddress?(): string;
  isAvailable?(): boolean;
}

// Chat and AI Search related types
export type MessageType = "user" | "ai";

export interface IChatMessage {
  _id?: Types.ObjectId;
  type: MessageType;
  content: string;
  timestamp: Date;
  searchResults?: Types.ObjectId[];
  metadata?: {
    searchQuery?: string;
    filters?: any;
    resultCount?: number;
  };
}

export interface IChatSession extends BaseDocument {
  user: ObjectId; // Reference to User
  title?: string; // Optional title for the chat session
  messages: IChatMessage[];
  isActive: boolean;
  lastActivity: Date;

  // Virtual properties
  duration?: number;
  formattedDuration?: string;
  messageSummary?: {
    total: number;
    user: number;
    ai: number;
  };

  // Instance methods
  addUserMessage?(content: string): Promise<IChatSession>;
  addAIMessage?(
    content: string,
    searchResults?: ObjectId[],
    metadata?: any
  ): Promise<IChatSession>;
  getRecentMessages?(limit?: number): IChatMessage[];
  getMessageCount?(): number;
  getUserMessageCount?(): number;
  getAIMessageCount?(): number;
  archive?(): Promise<IChatSession>;
  reactivate?(): Promise<IChatSession>;
  clearMessages?(): Promise<IChatSession>;
}

// Contact form interface
export interface IContactMessage extends BaseDocument {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  isRead: boolean;
  respondedAt?: Date;
  response?: string;
}

// Auth related types
export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ILoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface IRegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  userType: UserType;
  agreeToTerms: boolean;
}

// API Response types
export interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// Search and Filter types
export interface IPropertyFilters {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: PropertyType;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minArea?: number;
  maxArea?: number;
  features?: string[];
  status?: PropertyStatus;
}

export interface ISearchQuery {
  query?: string;
  filters?: IPropertyFilters;
  sortBy?: "price" | "date" | "area" | "relevance";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// AI Search specific types
export interface IAISearchResult {
  property: IProperty;
  relevanceScore: number;
  reason: string;
  matchedCriteria: string[];
}

export interface IAISearchResponse {
  query: string;
  results: IAISearchResult[];
  totalResults: number;
  processingTime: number;
  suggestions?: string[];
}

// File upload types
export interface IUploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

// Environment variables type
export interface IEnvironmentVariables {
  PORT: string;
  NODE_ENV: string;
  MONGODB_URI: string;
  DB_NAME: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_EXPIRE: string;
  JWT_REFRESH_EXPIRE: string;
  FRONTEND_URL: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
}

// JWT Payload interface
export interface IJWTPayload {
  userId: ObjectId;
  email: string;
  userType: UserType;
  iat?: number;
  exp?: number;
}

// Request interface with user
export interface IAuthenticatedRequest extends Request {
  user?: IUser;
}
