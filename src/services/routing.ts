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
    try {
      const response = await this.client.calculate({
        coordinates: [
          [start.lon, start.lat],
          [end.lon, end.lat],
        ],
        profile: 'foot-walking',
        extra_info: ['waytype', 'steepness'],
        format: 'json',
        alternative_routes: {
          target_count: alternatives,
          weight_factor: 1.4,
          share_factor: 0.6,
        },
      });

      const routes: Route[] = response.routes.map((route: any, index: number) => ({
        id: index + 1,
        coordinates: route.geometry.coordinates.map((coord: number[]) => [
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
      console.error('Error fetching routes:', error);
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