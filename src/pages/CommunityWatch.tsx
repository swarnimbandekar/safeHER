import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Layout } from '../components/Layout';
import { geolocationService } from '../services/geolocation';
import { MapPin, Users, AlertTriangle } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom icons for Sakhis markers
const sakhisIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
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

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

export function CommunityWatch() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [sakhis, setSakhis] = useState<Array<{ id: number; name: string; distance: string; latitude: number; longitude: number }>>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      const coords = await geolocationService.getCurrentPosition();
      setUserLocation([coords.latitude, coords.longitude]);
      
      // Mock Sakhis data - in a real app this would come from an API
      const mockSakhis = [
        {
          id: 1,
          name: "Priya Sharma",
          distance: "0.5 km",
          latitude: coords.latitude + 0.002,
          longitude: coords.longitude - 0.001
        },
        {
          id: 2,
          name: "Anjali Patel",
          distance: "1.2 km",
          latitude: coords.latitude - 0.003,
          longitude: coords.longitude + 0.002
        },
        {
          id: 3,
          name: "Ritu Gupta",
          distance: "0.8 km",
          latitude: coords.latitude + 0.001,
          longitude: coords.longitude + 0.003
        }
      ];
      
      setSakhis(mockSakhis);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!userLocation) {
    return (
      <Layout title="Community Watch">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            {error ? (
              <div className="p-4">
                <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <p className="text-gray-900 dark:text-white">{error}</p>
              </div>
            ) : (
              <div>
                <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-pulse" />
                <p className="text-gray-900 dark:text-white">Getting your location...</p>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Community Watch">
      <div className="relative h-[calc(100vh-8rem)]">
        <MapContainer
          center={userLocation}
          zoom={13}
          className="h-full w-full"
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater center={userLocation} />

          {/* User location marker */}
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold">Your Location</p>
              </div>
            </Popup>
          </Marker>

          {/* Sakhis markers */}
          {sakhis.map((sakhi) => (
            <Marker
              key={sakhi.id}
              position={[sakhi.latitude, sakhi.longitude]}
              icon={sakhisIcon}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-violet-600" />
                    <h3 className="font-semibold">{sakhi.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Sakhi Volunteer</p>
                  <p className="text-sm text-gray-600">Distance: {sakhi.distance}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </Layout>
  );
}