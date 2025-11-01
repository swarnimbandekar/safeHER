import { useState, useEffect } from 'react';
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

  useEffect(() => {
    getUserLocation();
    fetchSafeZones();
    
    // Cleanup simulation on unmount
    return () => {
      routeSimulationService.stopSimulation();
    };
  }, []);

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
          <div className="bg-white dark:bg-gray-800 border-b calm-pink-border p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Available Routes</h3>
              {!isSimulating ? (
                <button
                  onClick={startRouteSimulation}
                  className="flex items-center gap-1 text-sm bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  <Play className="w-4 h-4" />
                  Start SafeRide
                </button>
              ) : (
                <button
                  onClick={stopRouteSimulation}
                  className="flex items-center gap-1 text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  <Pause className="w-4 h-4" />
                  Stop Simulation
                </button>
              )}
            </div>
            <div className="space-y-3">
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
                        {route.distance.toFixed(1)} km
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
              <Polyline
                positions={selectedRoute.coordinates.map((c) => [c[0], c[1]])}
                color="#10B981"
                weight={6}
              />
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
      </div>
    </Layout>
  );
}