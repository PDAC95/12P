// frontend/src/app/services/google-auth.service.ts
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

@Injectable({
  providedIn: 'root',
})
export class GoogleAuthService {
  private isGoogleLoaded = false;
  private auth2: any;

  constructor() {
    this.loadGoogleScript();
  }

  /**
   * Load Google Identity Services script
   */
  private loadGoogleScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isGoogleLoaded) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        this.isGoogleLoaded = true;
        this.initializeGoogleAuth();
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load Google Identity Services'));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Initialize Google Auth
   */
  private initializeGoogleAuth(): void {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: this.handleCredentialResponse.bind(this),
      });
      console.log('✅ Google Auth initialized successfully');
    }
  }

  /**
   * Handle the credential response from Google
   */
  private handleCredentialResponse(response: any): void {
    console.log('🔐 Google credential response received:', response);
    // This will be handled by the component
  }

  /**
   * Sign in with Google popup
   */
  signInWithPopup(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        // Wait for Google to be ready first
        console.log('🔄 Waiting for Google Auth to be ready...');
        await this.waitForGoogleReady();

        if (!this.isGoogleLoaded || !window.google) {
          reject(new Error('Google Auth failed to load'));
          return;
        }

        console.log('✅ Google Auth is ready, showing sign-in...');

        // Configure and render the sign-in button
        window.google.accounts.id.prompt((notification: any) => {
          console.log('🔔 Google prompt notification:', notification);

          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback to popup if prompt doesn't work
            this.openGooglePopup().then(resolve).catch(reject);
          }
        });

        // Set up credential callback for this specific request
        window.google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: (response: any) => {
            if (response.credential) {
              resolve(response.credential);
            } else {
              reject(new Error('No credential received'));
            }
          },
        });
      } catch (error) {
        console.error('❌ Error in signInWithPopup:', error);
        reject(error);
      }
    });
  }

  /**
   * Wait for Google to be ready with timeout
   */
  private waitForGoogleReady(timeout: number = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const checkReady = () => {
        if (this.isReady()) {
          console.log(
            '✅ Google Auth ready after',
            Date.now() - startTime,
            'ms'
          );
          resolve();
          return;
        }

        if (Date.now() - startTime > timeout) {
          reject(new Error('Google Auth failed to load within timeout'));
          return;
        }

        // Check again in 100ms
        setTimeout(checkReady, 100);
      };

      checkReady();
    });
  }

  /**
   * Open Google popup as fallback
   */
  private openGooglePopup(): Promise<string> {
    return new Promise((resolve, reject) => {
      // Create a temporary div for the button
      const buttonDiv = document.createElement('div');
      buttonDiv.style.display = 'none';
      document.body.appendChild(buttonDiv);

      window.google.accounts.id.renderButton(buttonDiv, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        shape: 'rectangular',
        text: 'signin_with',
        logo_alignment: 'left',
      });

      // Simulate click on the button
      setTimeout(() => {
        const button = buttonDiv.querySelector(
          'div[role="button"]'
        ) as HTMLElement;
        if (button) {
          button.click();
        } else {
          reject(new Error('Google button not found'));
        }

        // Clean up
        document.body.removeChild(buttonDiv);
      }, 100);

      // Set up one-time callback
      const cleanup = () => {
        window.google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: this.handleCredentialResponse.bind(this),
        });
      };

      window.google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: (response: any) => {
          cleanup();
          if (response.credential) {
            resolve(response.credential);
          } else {
            reject(new Error('No credential received from popup'));
          }
        },
      });
    });
  }

  /**
   * Check if Google Auth is ready
   */
  isReady(): boolean {
    return this.isGoogleLoaded && !!window.google;
  }

  /**
   * Get Google Auth status
   */
  getStatus(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isReady()) {
        resolve(true);
      } else {
        this.loadGoogleScript()
          .then(() => resolve(true))
          .catch(() => resolve(false));
      }
    });
  }
}
