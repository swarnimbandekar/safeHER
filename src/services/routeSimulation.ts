export interface SimulatedLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface RouteDeviation {
  distanceFromRoute: number;
  offRoute: boolean;
}

export class RouteSimulationService {
  private static instance: RouteSimulationService;
  private simulationInterval: number | null = null;
  private currentRoute: [number, number][] | null = null;
  private currentPositionIndex: number = 0;
  private deviationCallback: ((deviation: RouteDeviation) => void) | null = null;
  private isSimulating: boolean = false;

  private constructor() {}

  public static getInstance(): RouteSimulationService {
    if (!RouteSimulationService.instance) {
      RouteSimulationService.instance = new RouteSimulationService();
    }
    return RouteSimulationService.instance;
  }

  // Start simulating movement along a route
  public startSimulation(
    route: [number, number][], 
    callback: (deviation: RouteDeviation) => void
  ): void {
    this.currentRoute = route;
    this.currentPositionIndex = 0;
    this.deviationCallback = callback;
    this.isSimulating = true;

    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }

    this.simulationInterval = window.setInterval(() => {
      this.simulateNextPosition();
    }, 1000); // Update position every second
  }

  // Stop the simulation
  public stopSimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.isSimulating = false;
    this.currentRoute = null;
    this.deviationCallback = null;
  }

  // Simulate the next position along the route
  private simulateNextPosition(): void {
    if (!this.currentRoute || !this.deviationCallback) return;

    // Move to next position (or loop back to start)
    this.currentPositionIndex++;
    if (this.currentPositionIndex >= this.currentRoute.length) {
      this.currentPositionIndex = 0;
    }

    // Simulate a small deviation for demonstration
    const shouldDeviate = Math.random() < 0.3; // 30% chance of deviation
    let deviationDistance = 0;
    
    if (shouldDeviate) {
      // Simulate being off route by 50-200 meters
      deviationDistance = 50 + Math.random() * 150;
    }

    // Call the deviation callback
    this.deviationCallback({
      distanceFromRoute: deviationDistance,
      offRoute: deviationDistance > 100 // Consider off-route if > 100m away
    });
  }

  // Calculate distance from a point to the nearest point on the route
  public calculateDistanceToRoute(
    lat: number, 
    lon: number, 
    route: [number, number][]
  ): number {
    if (route.length === 0) return Infinity;

    let minDistance = Infinity;
    
    // Find the closest point on the route
    for (const [routeLat, routeLon] of route) {
      const distance = this.calculateDistance(lat, lon, routeLat, routeLon);
      if (distance < minDistance) {
        minDistance = distance;
      }
    }
    
    return minDistance;
  }

  // Calculate distance between two points (in meters)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  // Check if simulation is currently running
  public isRunning(): boolean {
    return this.isSimulating;
  }
}

export const routeSimulationService = RouteSimulationService.getInstance();