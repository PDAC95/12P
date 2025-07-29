import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly API_URL = 'http://localhost:5001/api/users';

  constructor(private http: HttpClient) {}

  /**
   * Get public user profile by ID
   */
  getPublicProfile(userId: string): Observable<PublicUserResponse> {
    return this.http.get<PublicUserResponse>(`${this.API_URL}/${userId}`);
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
}
