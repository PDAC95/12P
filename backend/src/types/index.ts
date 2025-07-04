import { Request } from "express";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    userType: string;
  };
}

export interface UserType {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  userType: "buyer" | "seller" | "agent" | "investor";
  avatar?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyType {
  _id: string;
  title: string;
  description: string;
  price: number;
  location: {
    address: string;
    city: string;
    province: string;
    postalCode: string;
    coordinates: [number, number];
  };
  type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  features: string[];
  images: string[];
  status: "active" | "sold" | "pending" | "draft";
  owner: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatSessionType {
  _id: string;
  user: string;
  messages: {
    type: "user" | "ai";
    content: string;
    timestamp: Date;
    searchResults?: string[];
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
