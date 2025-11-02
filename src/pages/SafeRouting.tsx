import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import { Layout } from '../components/Layout';
import { routingService, Route, UNSAFE_ZONES, RouteCoordinate } from '../services/routing';
import { geolocationService } from '../services/geolocation';
import { routeSimulationService, RouteDeviation } from '../services/routeSimulation';
import { supabase, SafeZone } from '../lib/supabase';
import {
  MapPin,
  Navigation,
  AlertTriangle,
  Shield,
  Clock,
  TrendingUp,
  Loader2,
  Search,
  X,
  Play,
  Pause,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  PartyPopper,
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationSuggestion {
  label: string;
  x: number;
  y: number;
}

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export function SafeRouting() {
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [fromCoords, setFromCoords] = useState<RouteCoordinate | null>(null);
  const [toCoords, setToCoords] = useState<RouteCoordinate | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7580, -73.9855]);
  const [mapZoom, setMapZoom] = useState(13);
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [routeMode, setRouteMode] = useState<'safest' | 'shortest'>('safest');
  const [fromSuggestions, setFromSuggestions] = useState<LocationSuggestion[]>([]);
  const [toSuggestions, setToSuggestions] = useState<LocationSuggestion[]>([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [deviationAlert, setDeviationAlert] = useState<RouteDeviation | null>(null);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number>();
  const [showRoutePanel, setShowRoutePanel] = useState(true);
  const [showArrivalModal, setShowArrivalModal] = useState(false);

  useEffect(() => {
    getUserLocation();
    fetchSafeZones();
    
    // Cleanup simulation and animation on unmount
    return () => {
      routeSimulationService.stopSimulation();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Animation effect (just for visual demo)
  useEffect(() => {
    if (isAnimating && selectedRoute) {
      const duration = 3000; // 3 seconds for full animation
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        setAnimationProgress(progress);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          // Don't show arrival modal here - only show when stopping simulation
        }
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [isAnimating, selectedRoute]);

  const getUserLocation = async () => {
    try {
      const coords = await geolocationService.getCurrentPosition();
      setMapCenter([coords.latitude, coords.longitude]);
      setUserPosition([coords.latitude, coords.longitude]);
    } catch (err) {
      console.error('Could not get user location:', err);
    }
  };

  const fetchSafeZones = async () => {
    const { data } = await supabase.from('safe_zones').select('*');
    if (data) setSafeZones(data);
  };

  const searchLocation = async (query: string, isFrom: boolean) => {
    if (query.length < 3) {
      if (isFrom) setFromSuggestions([]);
      else setToSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        {
          headers: {
            'User-Agent': 'safeHER App',
          },
        }
      );
      const results = await response.json();
      const suggestions = results.map((result: any) => ({
        label: result.display_name,
        x: parseFloat(result.lon),
        y: parseFloat(result.lat),
      }));

      if (isFrom) {
        setFromSuggestions(suggestions);
        setShowFromSuggestions(true);
      } else {
        setToSuggestions(suggestions);
        setShowToSuggestions(true);
      }
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const handleFromChange = (value: string) => {
    setFromLocation(value);
    searchLocation(value, true);
  };

  const handleToChange = (value: string) => {
    setToLocation(value);
    searchLocation(value, false);
  };

  const selectFromSuggestion = (suggestion: LocationSuggestion) => {
    setFromLocation(suggestion.label);
    setFromCoords({ lat: suggestion.y, lon: suggestion.x });
    setShowFromSuggestions(false);
  };

  const selectToSuggestion = (suggestion: LocationSuggestion) => {
    setToLocation(suggestion.label);
    setToCoords({ lat: suggestion.y, lon: suggestion.x });
    setShowToSuggestions(false);
  };

  const useCurrentLocation = async () => {
    try {
      const coords = await geolocationService.getCurrentPosition();
      setFromCoords({ lat: coords.latitude, lon: coords.longitude });
      setFromLocation('Current Location');
      setUserPosition([coords.latitude, coords.longitude]);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const findRoutes = async () => {
    if (!fromCoords || !toCoords) {
      setError('Please select both starting and destination locations');
      return;
    }

    setError('');
    setLoading(true);
    setRoutes([]);
    setSelectedRoute(null);

    try {
      const calculatedRoutes = await routingService.getRoutes(fromCoords, toCoords, 3);

      if (calculatedRoutes.length === 0) {
        setError('No routes found. Try different locations.');
        return;
      }

      setRoutes(calculatedRoutes);

      const bestRoute =
        routeMode === 'safest'
          ? calculatedRoutes.reduce((prev, current) =>
              (current.safetyScore || 0) > (prev.safetyScore || 0) ? current : prev
            )
          : calculatedRoutes.reduce((prev, current) =>
              current.distance < prev.distance ? current : prev
            );

      setSelectedRoute(bestRoute);

      const allCoords = calculatedRoutes.flatMap((r) => r.coordinates);
      const lats = allCoords.map((c) => c[0]);
      const lons = allCoords.map((c) => c[1]);
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLon = (Math.min(...lons) + Math.max(...lons)) / 2;

      setMapCenter([centerLat, centerLon]);
      setMapZoom(12);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate routes');
    } finally {
      setLoading(false);
    }
  };

  const getRouteColor = (route: Route): string => {
    if (!selectedRoute) return '#9CA3AF';

    if (route === selectedRoute) {
      return '#10B981';
    }

    const score = route.safetyScore || 0;
    if (score < 40) return '#EF4444';
    return '#9CA3AF';
  };

  const getSafeZoneIcon = (type: string) => {
    const color =
      type === 'police_station' ? 'blue' : type === 'hospital' ? 'red' : 'green';
    return new L.Icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
  };

  const startRouteSimulation = () => {
    if (!selectedRoute) {
      setError('Please select a route first');
      return;
    }

    setIsSimulating(true);
    setDeviationAlert(null);
    
    // Start the simulation
    routeSimulationService.startSimulation(
      selectedRoute.coordinates,
      (deviation) => {
        setDeviationAlert(deviation);
        
        // Update user position on map
        if (selectedRoute.coordinates.length > 0) {
          const [lat, lon] = selectedRoute.coordinates[0];
          setUserPosition([lat, lon]);
        }
      }
    );
  };

  const stopRouteSimulation = () => {
    routeSimulationService.stopSimulation();
    setIsSimulating(false);
    setDeviationAlert(null);
    
    // Show arrival modal when user stops the simulation
    setTimeout(() => {
      setShowArrivalModal(true);
    }, 300);
  };

  const loadDemoRoute = async () => {
    // Reset modal state
    setShowArrivalModal(false);
    
    // Mock locations: Times Square to Central Park
    const demoFrom = { lat: 40.7580, lon: -73.9855 };
    const demoTo = { lat: 40.7829, lon: -73.9654 };

    setFromLocation('Times Square, New York');
    setToLocation('Central Park, New York');
    setFromCoords(demoFrom);
    setToCoords(demoTo);

    setMapCenter([40.7704, -73.9754]);
    setMapZoom(14);

    // Create mock routes
    const mockRoutes: Route[] = [
      {
        id: 1,
        coordinates: [
          [40.7580, -73.9855],
          [40.7600, -73.9835],
          [40.7630, -73.9820],
          [40.7660, -73.9800],
          [40.7690, -73.9780],
          [40.7720, -73.9760],
          [40.7750, -73.9730],
          [40.7780, -73.9700],
          [40.7810, -73.9670],
          [40.7829, -73.9654],
        ],
        distance: 2800,
        duration: 840, // 14 minutes
        safetyScore: 92,
      },
      {
        id: 2,
        coordinates: [
          [40.7580, -73.9855],
          [40.7595, -73.9830],
          [40.7620, -73.9810],
          [40.7645, -73.9785],
          [40.7680, -73.9760],
          [40.7710, -73.9735],
          [40.7745, -73.9705],
          [40.7775, -73.9680],
          [40.7805, -73.9665],
          [40.7829, -73.9654],
        ],
        distance: 2500,
        duration: 720, // 12 minutes  
        safetyScore: 68,
      },
      {
        id: 3,
        coordinates: [
          [40.7580, -73.9855],
          [40.7610, -73.9840],
          [40.7640, -73.9825],
          [40.7670, -73.9805],
          [40.7700, -73.9785],
          [40.7730, -73.9755],
          [40.7760, -73.9720],
          [40.7790, -73.9690],
          [40.7815, -73.9665],
          [40.7829, -73.9654],
        ],
        distance: 2650,
        duration: 780, // 13 minutes
        safetyScore: 85,
      },
    ];

    setRoutes(mockRoutes);
    
    // Select safest route by default
    const bestRoute = mockRoutes.reduce((prev, current) =>
      (current.safetyScore || 0) > (prev.safetyScore || 0) ? current : prev
    );
    
    setSelectedRoute(bestRoute);
    
    // Start animation after a brief delay
    setTimeout(() => {
      setAnimationProgress(0);
      setIsAnimating(true);
    }, 500);
  };

  return (
    <Layout title="Safe Route Finder">
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="bg-white dark:bg-gray-800 border-b calm-pink-border p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {deviationAlert && deviationAlert.offRoute && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Route Deviation Detected</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  You are {Math.round(deviationAlert.distanceFromRoute)} meters off the planned route.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                From
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={fromLocation}
                  onChange={(e) => handleFromChange(e.target.value)}
                  onFocus={() => setShowFromSuggestions(true)}
                  placeholder="Enter starting location"
                  className="w-full pl-10 pr-4 py-3 border calm-pink-border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                {fromLocation && (
                  <button
                    onClick={() => {
                      setFromLocation('');
                      setFromCoords(null);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {showFromSuggestions && fromSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border calm-pink-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {fromSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => selectFromSuggestion(suggestion)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                      <p className="text-gray-900 dark:text-white">{suggestion.label}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={toLocation}
                  onChange={(e) => handleToChange(e.target.value)}
                  onFocus={() => setShowToSuggestions(true)}
                  placeholder="Enter destination"
                  className="w-full pl-10 pr-4 py-3 border calm-pink-border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                {toLocation && (
                  <button
                    onClick={() => {
                      setToLocation('');
                      setToCoords(null);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {showToSuggestions && toSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border calm-pink-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {toSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => selectToSuggestion(suggestion)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                      <p className="text-gray-900 dark:text-white">{suggestion.label}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadDemoRoute}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all transform hover:scale-105 shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              <Sparkles className="w-4 h-4" />
              Safest Route
            </button>
            
            <button
              onClick={useCurrentLocation}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
            >
              <MapPin className="w-4 h-4" />
              Use Current Location
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setRouteMode('safest')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  routeMode === 'safest'
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                } focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2`}
              >
                Safest Route
              </button>
              <button
                onClick={() => setRouteMode('shortest')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  routeMode === 'shortest'
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                } focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2`}
              >
                Shortest Route
              </button>
            </div>

            <button
              onClick={findRoutes}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 disabled:bg-pink-400 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Finding Routes...
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  Find Routes
                </>
              )}
            </button>
          </div>
        </div>

        {routes.length > 0 && (
          <div className="bg-white dark:bg-gray-800 border-b calm-pink-border">
            <div className="flex justify-between items-center p-4 cursor-pointer" onClick={() => setShowRoutePanel(!showRoutePanel)}>
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                Available Routes ({routes.length})
                {showRoutePanel ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </h3>
              <div className="flex items-center gap-2">
                {!isSimulating ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startRouteSimulation();
                    }}
                    className="flex items-center gap-1 text-sm bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    <Play className="w-4 h-4" />
                    Start SafeRide
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      stopRouteSimulation();
                    }}
                    className="flex items-center gap-1 text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    <Pause className="w-4 h-4" />
                    End SafeRide
                  </button>
                )}
              </div>
            </div>
            
            {showRoutePanel && (
              <div className="p-4 pt-0 space-y-3 max-h-64 overflow-y-auto">
                {routes.map((route) => (
                <button
                  key={route.id}
                  onClick={() => setSelectedRoute(route)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    selectedRoute === route
                      ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Route {route.id}
                    </h4>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {routingService.formatDuration(route.duration)}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {routingService.formatDistance(route.distance)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-500" />
                      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            (route.safetyScore || 0) >= 80
                              ? 'bg-green-600'
                              : (route.safetyScore || 0) >= 60
                              ? 'bg-blue-600'
                              : (route.safetyScore || 0) >= 40
                              ? 'bg-yellow-600'
                              : 'bg-red-600'
                          }`}
                          style={{ width: `${route.safetyScore || 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {route.safetyScore}/100
                      </span>
                    </div>
                  </div>
                </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 relative">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            className="h-full w-full"
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater center={mapCenter} zoom={mapZoom} />

            {fromCoords && (
              <Marker position={[fromCoords.lat, fromCoords.lon]} icon={startIcon}>
                <Popup>
                  <div>
                    <p className="font-semibold">Start</p>
                    <p className="text-sm">{fromLocation}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {toCoords && (
              <Marker position={[toCoords.lat, toCoords.lon]} icon={endIcon}>
                <Popup>
                  <div>
                    <p className="font-semibold">Destination</p>
                    <p className="text-sm">{toLocation}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {userPosition && (
              <Marker position={userPosition} icon={userIcon}>
                <Popup>
                  <div>
                    <p className="font-semibold">Your Location</p>
                    <p className="text-sm">Simulating movement</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {selectedRoute && (
              <>
                {/* Animated trail effect */}
                {isAnimating && animationProgress > 0 && (() => {
                  const totalPoints = selectedRoute.coordinates.length;
                  const visiblePoints = Math.ceil(totalPoints * animationProgress);
                  const visibleCoords = selectedRoute.coordinates.slice(0, visiblePoints);
                  
                  return (
                    <>
                      {/* Main animated path */}
                      <Polyline
                        positions={visibleCoords.map((c) => [c[0], c[1]])}
                        color="#10B981"
                        weight={8}
                        className="animate-pulse"
                      />
                      {/* Glowing effect */}
                      <Polyline
                        positions={visibleCoords.map((c) => [c[0], c[1]])}
                        color="#34D399"
                        weight={12}
                        opacity={0.3}
                      />
                    </>
                  );
                })()}
                
                {/* Full route (shown after animation or when not animating) */}
                {!isAnimating && (
                  <Polyline
                    positions={selectedRoute.coordinates.map((c) => [c[0], c[1]])}
                    color="#10B981"
                    weight={6}
                  />
                )}
              </>
            )}

            {routes.map((route) => (
              <Polyline
                key={route.id}
                positions={route.coordinates.map((c) => [c[0], c[1]])}
                color={getRouteColor(route)}
                weight={selectedRoute === route ? 6 : 4}
                dashArray={selectedRoute === route ? undefined : '5, 10'}
              />
            ))}

            {UNSAFE_ZONES.map((zone) => (
              <Circle
                key={zone.id}
                center={[zone.latitude, zone.longitude]}
                radius={zone.radius}
                pathOptions={{
                  color:
                    zone.severity === 'high'
                      ? '#EF4444'
                      : zone.severity === 'medium'
                      ? '#F59E0B'
                      : '#FCD34D',
                  fillColor:
                    zone.severity === 'high'
                      ? '#EF4444'
                      : zone.severity === 'medium'
                      ? '#F59E0B'
                      : '#FCD34D',
                  fillOpacity: 0.2,
                  weight: 2,
                }}
              >
                <Popup>
                  <div>
                    <p className="font-semibold text-red-600">Unsafe Zone</p>
                    <p className="text-sm capitalize">Severity: {zone.severity}</p>
                    <p className="text-xs text-gray-600 mt-1">{zone.description}</p>
                  </div>
                </Popup>
              </Circle>
            ))}

            {safeZones.map((zone) => (
              <Marker
                key={zone.id}
                position={[zone.latitude, zone.longitude]}
                icon={getSafeZoneIcon(zone.type)}
              >
                <Popup>
                  <div>
                    <h3 className="font-semibold">{zone.name}</h3>
                    <p className="text-sm capitalize">{zone.type.replace('_', ' ')}</p>
                    {zone.phone_number && (
                      <a
                        href={`tel:${zone.phone_number}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {zone.phone_number}
                      </a>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Arrival Success Modal */}
        {showArrivalModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[2000] animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl transform transition-all scale-100 animate-scaleIn">
              <div className="p-8 text-center">
                {/* Success Icon with Animation */}
                <div className="relative inline-flex items-center justify-center mb-6">
                  <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
                  <div className="relative bg-gradient-to-br from-green-400 to-green-600 rounded-full p-6">
                    <CheckCircle className="w-16 h-16 text-white" />
                  </div>
                </div>

                {/* Success Message */}
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-2">
                  Arrived Safely!
                  <PartyPopper className="w-8 h-8 text-yellow-500" />
                </h2>
                
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  You've reached your destination safely. Great job!
                </p>

                {/* Route Stats */}
                {selectedRoute && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mb-6 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Distance
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {routingService.formatDistance(selectedRoute.distance)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Duration
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {routingService.formatDuration(selectedRoute.duration)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Safety Score
                      </span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {selectedRoute.safetyScore}/100
                      </span>
                    </div>
                  </div>
                )}

                {/* Motivational Message */}
                <div className="bg-pink-50 dark:bg-pink-900/20 rounded-xl p-4 mb-6">
                  <p className="text-sm text-pink-700 dark:text-pink-300 font-medium">
                    💪 You chose the {routeMode === 'safest' ? 'safest' : 'shortest'} route and arrived safely!
                  </p>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => setShowArrivalModal(false)}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
