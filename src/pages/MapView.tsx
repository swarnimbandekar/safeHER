import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Layout } from '../components/Layout';
import { supabase, SafeZone, CommunityReport } from '../lib/supabase';
import { geolocationService, LocationCoords } from '../services/geolocation';
import { routingService } from '../services/routing';
import { AlertCircle } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const safeZoneIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const reportIcons: Record<string, L.Icon> = {
  low: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  medium: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  high: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
};

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export function MapView() {
  const [userLocation, setUserLocation] = useState<LocationCoords | null>(null);
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7580, -73.9855]);
  const [mapZoom, setMapZoom] = useState(13);

  useEffect(() => {
    getUserLocation();
    fetchSafeZones();
    fetchReports();
  }, []);

  const getUserLocation = async () => {
    try {
      const coords = await geolocationService.getCurrentPosition();
      setUserLocation(coords);
      setMapCenter([coords.latitude, coords.longitude]);
      setMapZoom(15);
    } catch (err) {
      console.error('Could not get user location:', err);
    }
  };

  const fetchSafeZones = async () => {
    try {
      const { data, error } = await supabase.from('safe_zones').select('*');
      if (error) throw error;
      setSafeZones(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('community_reports')
        .select('*')
        .limit(50);
      if (error) throw error;
      setReports(data || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getDirections = async (lat: number, lon: number) => {
    if (!userLocation) {
      setError('Please enable location services to get directions');
      return;
    }

    try {
      const routes = await routingService.getRoutes(
        { lat: userLocation.latitude, lon: userLocation.longitude },
        { lat, lon }
      );

      if (routes.length > 0) {
        // In a real app, you would navigate to the routing page with the selected route
        alert(`Found ${routes.length} routes. In a full implementation, this would show the route on a map.`);
      } else {
        setError('No routes found to this location');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to calculate route');
    }
  };

  if (loading) {
    return (
      <Layout title="Safe Zones Map">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Safe Zones Map">
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg m-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
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

            {userLocation && (
              <Marker
                position={[userLocation.latitude, userLocation.longitude]}
                icon={new L.Icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41],
                })}
              >
                <Popup>
                  <div>
                    <p className="font-semibold">Your Location</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {safeZones.map((zone) => (
              <Marker
                key={zone.id}
                position={[zone.latitude, zone.longitude]}
                icon={safeZoneIcon}
              >
                <Popup>
                  <div className="min-w-48">
                    <h3 className="font-semibold mb-1">{zone.name}</h3>
                    <p className="text-sm capitalize mb-2">{zone.type.replace('_', ' ')}</p>
                    {zone.phone_number && (
                      <p className="text-sm mb-2">
                        <a href={`tel:${zone.phone_number}`} className="text-blue-600 hover:underline">
                          {zone.phone_number}
                        </a>
                      </p>
                    )}
                    <button
                      onClick={() => getDirections(zone.latitude, zone.longitude)}
                      className="w-full bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold py-2 px-3 rounded transition-colors"
                    >
                      Get Directions
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}

            {reports.map((report) => {
              const reportIcon = reportIcons[report.severity] || reportIcons.high;

              return (
                <Marker
                  key={report.id}
                  position={[report.latitude, report.longitude]}
                  icon={reportIcon}
                >
                  <Popup>
                    <div className="min-w-48">
                      <h3 className="font-semibold mb-1">Safety Report</h3>
                      <p className="text-sm mb-2">{report.description}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
                        <span className="text-xs font-medium capitalize">{report.severity} severity</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Reported {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </Layout>
  );
}