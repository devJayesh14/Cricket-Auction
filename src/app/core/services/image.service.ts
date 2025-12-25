import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private baseUrl = environment.apiUrl?.replace('/api', '') || 'http://localhost:3000';

  /**
   * Get full URL for team logo or player photo
   * Handles both Cloudinary URLs and local file paths
   */
  getImageUrl(imagePath: string | null | undefined, defaultImage: string = '/assets/default-team-logo.png'): string {
    // Handle null, undefined, or empty strings
    if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
      return defaultImage;
    }

    // Trim whitespace from the path
    const trimmedPath = imagePath.trim();

    // Check if it's already a full URL (Cloudinary or external)
    // Cloudinary URLs start with https://res.cloudinary.com/
    if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://')) {
      // Return the URL as-is for Cloudinary or external URLs
      return trimmedPath;
    }

    // Handle local file paths
    // Ensure path starts with /
    const path = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
    return `${this.baseUrl}${path}`;
  }

  /**
   * Get logo URL for team
   */
  getLogoUrl(logoPath: string | null | undefined): string {
    return this.getImageUrl(logoPath, '/assets/default-team-logo.png');
  }

  /**
   * Get photo URL for player
   */
  getPhotoUrl(photoPath: string | null | undefined): string {
    return this.getImageUrl(photoPath, '/assets/default-player-photo.png');
  }

  /**
   * Check if the URL is a Cloudinary URL
   */
  isCloudinaryUrl(url: string | null | undefined): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }
    return url.includes('res.cloudinary.com') || url.startsWith('https://res.cloudinary.com');
  }
}

