// frontend/src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'client' | 'agent' | 'admin';
  isEmailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  preferences?: {
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    language: string;
  };
  agentInfo?: any;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
    expiresIn: string;
  };
  timestamp: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'client' | 'agent';
  agentInfo?: any;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
  data: null;
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = 'http://localhost:5001/api/auth';
  private readonly TOKEN_KEY = '12p_auth_token';
  private readonly USER_KEY = '12p_user_data';

  // BehaviorSubject to track authentication state
  private currentUserSubject = new BehaviorSubject<User | null>(
    this.getUserFromStorage()
  );
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(
    this.hasValidToken()
  );

  // Public observables
  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    // Check token validity on service initialization
    this.checkTokenValidity();
  }

  /**
   * Login user with email and password
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/login`, credentials)
      .pipe(
        tap((response) => {
          if (response.success) {
            this.handleAuthSuccess(response.data);
          }
        })
      );
  }

  /**
   * Register new user
   */
  register(userData: RegisterData): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/register`, userData)
      .pipe(
        tap((response) => {
          if (response.success) {
            this.handleAuthSuccess(response.data);
          }
        })
      );
  }

  /**
   * Get current user profile from server
   */
  getCurrentUser(): Observable<any> {
    return this.http.get(`${this.API_URL}/me`);
  }

  /**
   * Update current user profile
   */
  updateProfile(updateData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    preferences?: any;
  }): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(`${this.API_URL}/me`, updateData).pipe(
      tap((response) => {
        if (response.success) {
          // Update the current user data in memory
          this.currentUserSubject.next(response.data.user);

          // Update localStorage with new user data
          localStorage.setItem(
            this.USER_KEY,
            JSON.stringify(response.data.user)
          );

          console.log('✅ Profile updated successfully:', {
            user: response.data.user.email,
            updatedFields: Object.keys(updateData),
          });
        }
      })
    );
  }

  /**
   * Change user password
   */
  changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Observable<ChangePasswordResponse> {
    return this.http
      .put<ChangePasswordResponse>(
        `${this.API_URL}/change-password`,
        passwordData
      )
      .pipe(
        tap((response) => {
          if (response.success) {
            console.log('✅ Password changed successfully');
          }
        })
      );
  }

  /**
   * Logout user and clear stored data
   */
  logout(): void {
    this.clearStoredData();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/auth/login']);
  }

  /**
   * Get stored authentication token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get current user data
   */
  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUserValue();
    return user?.role === role;
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  /**
   * Check if user is agent
   */
  isAgent(): boolean {
    return this.hasRole('agent');
  }

  /**
   * Check if user is client
   */
  isClient(): boolean {
    return this.hasRole('client');
  }

  /**
   * Handle successful authentication
   */
  private handleAuthSuccess(authData: {
    user: User;
    token: string;
    expiresIn: string;
  }): void {
    // Store token and user data
    localStorage.setItem(this.TOKEN_KEY, authData.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(authData.user));

    // Update subjects
    this.currentUserSubject.next(authData.user);
    this.isAuthenticatedSubject.next(true);

    console.log('✅ Authentication successful:', {
      user: authData.user.email,
      role: authData.user.role,
      expiresIn: authData.expiresIn,
    });
  }

  /**
   * Get user data from localStorage
   */
  private getUserFromStorage(): User | null {
    try {
      const userData = localStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      return null;
    }
  }

  /**
   * Check if there's a valid token in storage
   */
  private hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Decode JWT token to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();

      if (isExpired) {
        this.clearStoredData();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking token validity:', error);
      this.clearStoredData();
      return false;
    }
  }

  /**
   * Check token validity and clean up if expired
   */
  private checkTokenValidity(): void {
    if (!this.hasValidToken()) {
      this.clearStoredData();
      this.currentUserSubject.next(null);
      this.isAuthenticatedSubject.next(false);
    }
  }

  /**
   * Clear all stored authentication data
   */
  private clearStoredData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Decode JWT token payload
   */
  private decodeToken(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
}
