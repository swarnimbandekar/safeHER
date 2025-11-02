import Openrouteservice from 'openrouteservice-js';

const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;

export interface RouteCoordinate {
  lat: number;
  lon: number;
}

export interface RouteSegment {
  distance: number;
  duration: number;
  steps: any[];
}

export interface Route {
  id: number;
  coordinates: [number, number][];
  distance: number;
  duration: number;
  segments: RouteSegment[];
  safetyScore?: number;
}

export interface UnsafeZone {
  id: string;
  latitude: number;
  longitude: number;
  radius: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export const UNSAFE_ZONES: UnsafeZone[] = [
  {
    id: 'uz1',
    latitude: 40.7580,
    longitude: -73.9855,
    radius: 200,
    severity: 'high',
    description: 'High crime area - frequent incidents reported',
  },
  {
    id: 'uz2',
    latitude: 40.7520,
    longitude: -73.9780,
    radius: 150,
    severity: 'medium',
    description: 'Poorly lit area at night',
  },
  {
    id: 'uz3',
    latitude: 40.7650,
    longitude: -73.9700,
    radius: 100,
    severity: 'low',
    description: 'Isolated area with limited foot traffic',
  },
  {
    id: 'uz4',
    latitude: 40.7480,
    longitude: -73.9920,
    radius: 180,
    severity: 'high',
    description: 'Multiple harassment incidents reported',
  },
  {
    id: 'uz5',
    latitude: 40.7700,
    longitude: -73.9600,
    radius: 120,
    severity: 'medium',
    description: 'Construction area with limited visibility',
  },
  {
    id: 'uz6',
    latitude: 40.7550,
    longitude: -73.9650,
    radius: 90,
    severity: 'low',
    description: 'Narrow streets with minimal lighting',
  },
];

class RoutingService {
  private client: any;

  constructor() {
    if (!ORS_API_KEY) {
      console.warn('ORS API key not found. Routing features will be limited.');
    }
    this.client = new Openrouteservice.Directions({ api_key: ORS_API_KEY });
  }

  async getRoutes(
    start: RouteCoordinate,
    end: RouteCoordinate,
    alternatives: number = 3
  ): Promise<Route[]> {
    // Validate coordinates before calling ORS
    const isValid = (c: RouteCoordinate) =>
      Number.isFinite(c.lat) && Number.isFinite(c.lon) && Math.abs(c.lat) <= 90 && Math.abs(c.lon) <= 180;
    if (!isValid(start) || !isValid(end)) {
      console.error('Invalid coordinates for routing:', { start, end });
      throw new Error('Invalid coordinates. Please pick valid points on the map.');
    }
    if (start.lat === end.lat && start.lon === end.lon) {
      throw new Error('Start and destination are the same location.');
    }
    const buildOptions = (withAlternatives: boolean) => ({
      coordinates: [
        [start.lon, start.lat],
        [end.lon, end.lat],
      ],
      profile: 'foot-walking',
      extra_info: ['waytype', 'steepness'],
      format: 'json',
      geometry_format: 'geojson',
      instructions: false,
      ...(withAlternatives
        ? {
            alternative_routes: {
              target_count: alternatives,
              weight_factor: 1.4,
              share_factor: 0.6,
            },
          }
        : {}),
    });

    try {
      // First attempt: with alternative routes
      let response = await this.client.calculate(buildOptions(true));

      // If empty response, retry without alternatives
      if (!response || !Array.isArray(response.routes) || response.routes.length === 0) {
        response = await this.client.calculate(buildOptions(false));
      }

      if (!response || !Array.isArray(response.routes) || response.routes.length === 0) {
        throw new Error('No routes returned from routing service');
      }

      const routes: Route[] = response.routes.map((route: any, index: number) => ({
        id: index + 1,
        coordinates: (route.geometry?.coordinates || []).map((coord: number[]) => [
          coord[1],
          coord[0],
        ] as [number, number]),
        distance: route.summary.distance,
        duration: route.summary.duration,
        segments: route.segments || [],
      }));

      return routes.map((route) => ({
        ...route,
        safetyScore: this.calculateSafetyScore(route),
      }));
    } catch (error: any) {
      // If ORS returns 400, try a minimal request as a fallback
      const status = error?.response?.status;
      if (status === 400) {
        try {
          const minimalOptions = {
            coordinates: [
              [start.lon, start.lat],
              [end.lon, end.lat],
            ],
            profile: 'foot-walking',
            format: 'json',
            geometry_format: 'geojson',
            instructions: false,
          } as const;
          console.warn('ORS 400: retrying with minimal options', minimalOptions);
          const response = await this.client.calculate(minimalOptions);
          if (!response || !Array.isArray(response.routes) || response.routes.length === 0) {
            throw new Error('No routes returned from routing service');
          }
          const routes: Route[] = response.routes.map((route: any, index: number) => ({
            id: index + 1,
            coordinates: (route.geometry?.coordinates || []).map((coord: number[]) => [
              coord[1],
              coord[0],
            ] as [number, number]),
            distance: route.summary.distance,
            duration: route.summary.duration,
            segments: route.segments || [],
          }));
          return routes.map((route) => ({
            ...route,
            safetyScore: this.calculateSafetyScore(route),
          }));
        } catch (fallbackErr: any) {
          const details = fallbackErr?.response?.data || fallbackErr?.message || fallbackErr;
          console.warn('Foot-walking minimal attempt failed. Trying driving-car.', { start, end, details });
          // Final fallback: try driving-car minimal profile
          try {
            const drivingOptions = {
              coordinates: [
                [start.lon, start.lat],
                [end.lon, end.lat],
              ],
              profile: 'driving-car',
              format: 'json',
              geometry_format: 'geojson',
              instructions: false,
            } as const;
            console.warn('ORS fallback: driving-car minimal options', drivingOptions);
            const response2 = await this.client.calculate(drivingOptions);
            if (!response2 || !Array.isArray(response2.routes) || response2.routes.length === 0) {
              throw new Error('No routes returned from routing service');
            }
            const routes2: Route[] = response2.routes.map((route: any, index: number) => ({
              id: index + 1,
              coordinates: (route.geometry?.coordinates || []).map((coord: number[]) => [
                coord[1],
                coord[0],
              ] as [number, number]),
              distance: route.summary.distance,
              duration: route.summary.duration,
              segments: route.segments || [],
            }));
            return routes2.map((route) => ({
              ...route,
              safetyScore: this.calculateSafetyScore(route),
            }));
          } catch (drivingErr: any) {
            const dDetails = drivingErr?.response?.data || drivingErr?.message || drivingErr;
            console.error('Driving-car fallback failed:', dDetails);
            throw new Error('Failed to fetch routes. Please try again.');
          }
        }
      }

      const details = error?.response?.data || error?.message || error;
      console.error('Error fetching routes:', details, { start, end });
      throw new Error('Failed to fetch routes. Please try again.');
    }
  }

  calculateSafetyScore(route: Route): number {
    let totalDanger = 0;
    const coordinates = route.coordinates;

    for (let i = 0; i < coordinates.length; i++) {
      const [lat, lon] = coordinates[i];

      for (const zone of UNSAFE_ZONES) {
        const distance = this.calculateDistance(
          lat,
          lon,
          zone.latitude,
          zone.longitude
        );

        if (distance <= zone.radius) {
          const severityWeight =
            zone.severity === 'high' ? 3 : zone.severity === 'medium' ? 2 : 1;
          const proximityFactor = 1 - distance / zone.radius;
          totalDanger += severityWeight * proximityFactor * 10;
        }
      }
    }

    const dangerPerKm = totalDanger / (route.distance / 1000);
    const safetyScore = Math.max(0, Math.min(100, 100 - dangerPerKm * 5));

    return Math.round(safetyScore);
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
  }

  formatDuration(seconds: number): string {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  getSafetyRating(score: number): { text: string; color: string } {
    if (score >= 80) {
      return { text: 'Very Safe', color: 'text-green-600 dark:text-green-400' };
    } else if (score >= 60) {
      return { text: 'Safe', color: 'text-blue-600 dark:text-blue-400' };
    } else if (score >= 40) {
      return { text: 'Moderate', color: 'text-yellow-600 dark:text-yellow-400' };
    } else if (score >= 20) {
      return { text: 'Caution', color: 'text-orange-600 dark:text-orange-400' };
    } else {
      return { text: 'Unsafe', color: 'text-red-600 dark:text-red-400' };
    }
  }
}

export const routingService = new RoutingService();