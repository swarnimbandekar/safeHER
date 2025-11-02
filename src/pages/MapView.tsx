import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { supabase, SafeZone, CommunityReport } from '../lib/supabase';
import { geolocationService, LocationCoords } from '../services/geolocation';
import { routingService } from '../services/routing';
import { AlertCircle, Plus, X, AlertTriangle, Users, Eye, MessageSquare, Volume2, MapPin } from 'lucide-react';
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

interface AlertType {
  id: string;
  label: string;
  icon: any;
  severity: 'low' | 'medium' | 'high';
  color: string;
}

const alertTypes: AlertType[] = [
  { id: 'harassment', label: 'Harassment', icon: AlertTriangle, severity: 'high', color: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300' },
  { id: 'gang_activity', label: 'Gang Activity', icon: Users, severity: 'high', color: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300' },
  { id: 'suspicious_person', label: 'Suspicious Person', icon: Eye, severity: 'medium', color: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300' },
  { id: 'catcalling', label: 'Catcalling', icon: MessageSquare, severity: 'medium', color: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300' },
  { id: 'poor_lighting', label: 'Poor Lighting', icon: AlertCircle, severity: 'low', color: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300' },
  { id: 'loud_noise', label: 'Loud Noise/Commotion', icon: Volume2, severity: 'low', color: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300' },
];

export function MapView() {
  const { profile } = useAuth();
  const [userLocation, setUserLocation] = useState<LocationCoords | null>(null);
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7580, -73.9855]);
  const [mapZoom, setMapZoom] = useState(13);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedAlertType, setSelectedAlertType] = useState<string>('');
  const [alertDescription, setAlertDescription] = useState('');
  const [submittingAlert, setSubmittingAlert] = useState(false);

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

  const handleSubmitAlert = async () => {
    if (!selectedAlertType) {
      setError('Please select an alert type');
      return;
    }

    if (!profile) {
      setError('Please sign in to report alerts');
      return;
    }

    setSubmittingAlert(true);
    setError('');

    try {
      // Get current location or use mock location
      let coords;
      try {
        coords = await geolocationService.getCurrentPosition();
      } catch (locationError) {
        coords = geolocationService.getMockLocation();
      }

      const alertTypeInfo = alertTypes.find(t => t.id === selectedAlertType);
      const description = alertDescription || `${alertTypeInfo?.label} reported in this area`;

      // Insert the alert into community_reports table
      const { error: insertError } = await supabase
        .from('community_reports')
        .insert({
          latitude: coords.latitude,
          longitude: coords.longitude,
          type: selectedAlertType,
          description: description,
          severity: alertTypeInfo?.severity || 'medium',
          user_id: profile.id,
        });

      if (insertError) throw insertError;

      setSuccess('Alert submitted successfully! It will appear on everyone\'s map.');
      setShowAlertModal(false);
      setSelectedAlertType('');
      setAlertDescription('');
      
      // Refresh reports to show the new one
      await fetchReports();
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error('Error submitting alert:', err);
      setError(err.message || 'Failed to submit alert. Please try again.');
    } finally {
      setSubmittingAlert(false);
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

        {success && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg m-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
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

          {/* Floating Action Button */}
          <button
            onClick={() => setShowAlertModal(true)}
            className="absolute bottom-6 right-6 bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 z-[1000] flex items-center gap-2 group"
          >
            <Plus className="w-6 h-6" />
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap font-semibold">
              Report Alert
            </span>
          </button>
        </div>

        {/* Alert Modal */}
        {showAlertModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[2000]">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all">
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-pink-500" />
                    Report Alert
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Help keep the community safe by reporting incidents
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAlertModal(false);
                    setSelectedAlertType('');
                    setAlertDescription('');
                    setError('');
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                {/* Alert Types Grid */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    What type of alert? *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {alertTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.id}
                          onClick={() => setSelectedAlertType(type.id)}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                            selectedAlertType === type.id
                              ? `${type.color} border-current shadow-md scale-105`
                              : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        >
                          <Icon className={`w-6 h-6 mx-auto mb-2 ${
                            selectedAlertType === type.id ? '' : 'text-gray-600 dark:text-gray-400'
                          }`} />
                          <p className={`text-sm font-medium text-center ${
                            selectedAlertType === type.id ? '' : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {type.label}
                          </p>
                          <p className={`text-xs mt-1 text-center capitalize ${
                            selectedAlertType === type.id ? 'opacity-80' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {type.severity}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Additional Details (Optional)
                  </label>
                  <textarea
                    value={alertDescription}
                    onChange={(e) => setAlertDescription(e.target.value)}
                    placeholder="Provide more details about what you observed..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                  />
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Your current location will be used
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        This alert will be visible to all safeHER users on the map to help keep everyone informed and safe.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowAlertModal(false);
                    setSelectedAlertType('');
                    setAlertDescription('');
                    setError('');
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitAlert}
                  disabled={!selectedAlertType || submittingAlert}
                  className="flex-1 px-6 py-3 bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 dark:disabled:bg-pink-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {submittingAlert ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5" />
                      Submit Alert
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
