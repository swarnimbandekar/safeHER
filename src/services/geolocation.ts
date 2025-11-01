export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export class GeolocationService {
  private watchId: number | null = null;
  private callbacks: Array<(coords: LocationCoords) => void> = [];

  async getCurrentPosition(): Promise<LocationCoords> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(new Error(this.getErrorMessage(error)));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  // Mock location for testing when geolocation fails
  getMockLocation(): LocationCoords {
    // Mock location: New York City area
    return {
      latitude: 40.7128,
      longitude: -74.0060,
    };
  }

  startWatching(callback: (coords: LocationCoords) => void): void {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported');
    }

    this.callbacks.push(callback);

    if (this.watchId === null) {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          this.callbacks.forEach((cb) => cb(coords));
        },
        (error) => {
          console.error('Location watch error:', this.getErrorMessage(error));
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 30000,
        }
      );
    }
  }

  stopWatching(callback: (coords: LocationCoords) => void): void {
    this.callbacks = this.callbacks.filter((cb) => cb !== callback);

    if (this.callbacks.length === 0 && this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  async requestPermission(): Promise<PermissionState> {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state;
    } catch {
      return 'prompt';
    }
  }

  private getErrorMessage(error: GeolocationPositionError): string {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Location permission denied. Please enable location access in your browser settings.';
      case error.POSITION_UNAVAILABLE:
        return 'Location information unavailable. Please check your device settings.';
      case error.TIMEOUT:
        return 'Location request timed out. Please try again.';
      default:
        return 'An unknown error occurred while getting your location.';
    }
  }
}

export const geolocationService = new GeolocationService();
