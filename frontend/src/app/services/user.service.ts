import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface PublicUserProfile {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: 'client' | 'agent' | 'admin';
  isEmailVerified: boolean;
  memberSince: Date;
  agentInfo?: {
    agency?: string;
    experience?: number;
    specializations?: string[];
  };
}

export interface PublicUserResponse {
  success: boolean;
  message: string;
  data: {
    user: PublicUserProfile;
  };
  timestamp: string;
}

// Simple user info for property cards
export interface BasicUserInfo {
  id: string;
  fullName: string;
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly API_URL = 'http://localhost:5001/api/users';
  private userCache = new Map<string, BasicUserInfo>(); // Cache to avoid repeated API calls

  constructor(private http: HttpClient) {}

  /**
   * Get public user profile by ID
   */
  getPublicProfile(userId: string): Observable<PublicUserResponse> {
    return this.http.get<PublicUserResponse>(`${this.API_URL}/${userId}`);
  }

  /**
   * Get basic user info for multiple users (optimized for property cards)
   * Uses caching to avoid repeated API calls
   */
  getBasicUserInfo(userId: string): Observable<BasicUserInfo | null> {
    // Check cache first
    if (this.userCache.has(userId)) {
      return of(this.userCache.get(userId)!);
    }

    // Fetch from API if not cached
    return this.getPublicProfile(userId).pipe(
      map((response) => {
        if (response.success) {
          const basicInfo: BasicUserInfo = {
            id: response.data.user.id,
            fullName: response.data.user.fullName,
            role: response.data.user.role,
          };

          // Cache the result
          this.userCache.set(userId, basicInfo);
          return basicInfo;
        }
        return null;
      }),
      catchError((error) => {
        console.warn(`⚠️ Failed to load user info for ${userId}:`, error);
        return of(null);
      })
    );
  }

  /**
   * Get basic info for multiple users at once
   */
  getMultipleBasicUserInfo(
    userIds: string[]
  ): Observable<Map<string, BasicUserInfo>> {
    const uniqueIds = [...new Set(userIds)]; // Remove duplicates
    const requests = uniqueIds.map((id) => this.getBasicUserInfo(id));

    return forkJoin(requests).pipe(
      map((results) => {
        const userMap = new Map<string, BasicUserInfo>();

        results.forEach((userInfo, index) => {
          if (userInfo) {
            userMap.set(uniqueIds[index], userInfo);
          }
        });

        return userMap;
      }),
      catchError((error) => {
        console.error('❌ Error loading multiple user info:', error);
        return of(new Map<string, BasicUserInfo>());
      })
    );
  }

  /**
   * Get user role display name
   */
  getRoleDisplayName(role: string): string {
    switch (role) {
      case 'client':
        return 'Property Seeker';
      case 'agent':
        return 'Property Agent';
      case 'admin':
        return 'Administrator';
      default:
        return 'User';
    }
  }

  /**
   * Format member since date
   */
  formatMemberSince(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  }

  /**
   * Clear user cache (useful when user data changes)
   */
  clearCache(): void {
    this.userCache.clear();
  }
}
