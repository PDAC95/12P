// frontend/src/app/services/token.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly ACCESS_TOKEN_KEY = 'accessToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private readonly TOKEN_EXPIRES_KEY = 'tokenExpiresAt';

  private tokenSubject = new BehaviorSubject<string | null>(
    this.getAccessToken()
  );
  public token$ = this.tokenSubject.asObservable();

  constructor() {}

  /**
   * Store tokens in localStorage
   */
  setTokens(
    accessToken: string,
    refreshToken: string,
    expiresIn: string = '15m'
  ): void {
    const expiresAt = this.calculateExpirationTime(expiresIn);

    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(this.TOKEN_EXPIRES_KEY, expiresAt.toString());

    this.tokenSubject.next(accessToken);
  }

  /**
   * Get access token from localStorage
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * Get refresh token from localStorage
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Check if access token is expired or will expire soon (within 5 minutes)
   */
  isTokenExpired(): boolean {
    const expiresAt = localStorage.getItem(this.TOKEN_EXPIRES_KEY);
    if (!expiresAt) return true;

    const expirationTime = parseInt(expiresAt, 10);
    const currentTime = Date.now();
    const fiveMinutesFromNow = currentTime + 5 * 60 * 1000; // 5 minutes buffer

    return expirationTime <= fiveMinutesFromNow;
  }

  /**
   * Clear all tokens
   */
  clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRES_KEY);
    this.tokenSubject.next(null);
  }

  /**
   * Update access token after refresh
   */
  updateAccessToken(newAccessToken: string, expiresIn: string = '15m'): void {
    const expiresAt = this.calculateExpirationTime(expiresIn);

    localStorage.setItem(this.ACCESS_TOKEN_KEY, newAccessToken);
    localStorage.setItem(this.TOKEN_EXPIRES_KEY, expiresAt.toString());

    this.tokenSubject.next(newAccessToken);
  }

  /**
   * Calculate expiration time based on expiresIn string
   */
  private calculateExpirationTime(expiresIn: string): number {
    const now = Date.now();

    if (expiresIn.endsWith('m')) {
      const minutes = parseInt(expiresIn.slice(0, -1), 10);
      return now + minutes * 60 * 1000;
    } else if (expiresIn.endsWith('h')) {
      const hours = parseInt(expiresIn.slice(0, -1), 10);
      return now + hours * 60 * 60 * 1000;
    } else if (expiresIn.endsWith('d')) {
      const days = parseInt(expiresIn.slice(0, -1), 10);
      return now + days * 24 * 60 * 60 * 1000;
    } else {
      // Default to 15 minutes if format is unknown
      return now + 15 * 60 * 1000;
    }
  }

  /**
   * Check if we have both tokens
   */
  hasValidTokens(): boolean {
    return !!(this.getAccessToken() && this.getRefreshToken());
  }
}
