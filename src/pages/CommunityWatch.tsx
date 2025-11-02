import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { geolocationService } from '../services/geolocation';
import { MapPin, Users, AlertTriangle, Send, Map, MessageCircle, MapPinned } from 'lucide-react';
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

interface Message {
  id: number;
  user_id: string;
  user_name: string;
  message: string;
  location?: { latitude: number; longitude: number };
  created_at: string;
}

export function CommunityWatch() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'chat' | 'map'>('chat');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [sakhis, setSakhis] = useState<Array<{ id: number; name: string; distance: string; latitude: number; longitude: number }>>([]);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loadingMessages, setLoadingMessages] = useState(true);

  useEffect(() => {
    getUserLocation();
    loadMessages();
    
    // Subscribe to new messages
    const channel = supabase
      .channel('community_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages',
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('community_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100);

      if (fetchError) throw fetchError;
      setMessages(data || []);
    } catch (err: any) {
      console.error('Error loading messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const getUserLocation = async () => {
    try {
      // Try to get real location, fall back to mock if it fails
      let coords;
      try {
        coords = await geolocationService.getCurrentPosition();
      } catch (locationError) {
        coords = geolocationService.getMockLocation();
      }
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

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    if (!profile || !profile.id) {
      setError('Profile not loaded. Please refresh the page.');
      return;
    }

    setSending(true);
    setError('');
    try {
      console.log('Sending message:', { user_id: profile.id, user_name: profile.full_name });
      const { data, error: insertError } = await supabase
        .from('community_messages')
        .insert({
          user_id: profile.id,
          user_name: profile.full_name || 'Anonymous',
          message: newMessage.trim(),
        })
        .select();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }
      console.log('Message sent successfully:', data);
      setNewMessage('');
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message. Make sure the database table exists.');
    } finally {
      setSending(false);
    }
  };

  const handleShareLocation = async () => {
    if (sending) return;

    if (!profile || !profile.id) {
      setError('Profile not loaded. Please refresh the page.');
      return;
    }

    setSending(true);
    setError('');
    try {
      let coords;
      try {
        coords = await geolocationService.getCurrentPosition();
      } catch (locationError) {
        coords = geolocationService.getMockLocation();
      }

      const { error: insertError } = await supabase
        .from('community_messages')
        .insert({
          user_id: profile.id,
          user_name: profile.full_name || 'Anonymous',
          message: `📍 Shared location`,
          location: {
            latitude: coords.latitude,
            longitude: coords.longitude,
          },
        });

      if (insertError) {
        console.error('Location share error:', insertError);
        throw insertError;
      }
    } catch (err: any) {
      console.error('Error sharing location:', err);
      setError(err.message || 'Failed to share location. Make sure the database table exists.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const isOwnMessage = (message: Message) => message.user_id === profile?.id;

  return (
    <Layout title="Community Watch">
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-semibold transition-colors ${
              activeTab === 'chat'
                ? 'text-pink-600 dark:text-pink-400 border-b-2 border-pink-600 dark:border-pink-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            Community Chat
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-semibold transition-colors ${
              activeTab === 'map'
                ? 'text-pink-600 dark:text-pink-400 border-b-2 border-pink-600 dark:border-pink-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Map className="w-5 h-5" />
            Map View
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                <button
                  onClick={() => setError('')}
                  className="text-xs text-red-600 dark:text-red-400 underline mt-1"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat View */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 pb-28 space-y-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Users className="w-12 h-12 text-pink-500 mx-auto mb-2 animate-pulse" />
                    <p className="text-gray-600 dark:text-gray-400">Loading messages...</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400">No messages yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      Be the first to say hello!
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => {
                    const showDate =
                      index === 0 ||
                      formatDate(messages[index - 1].created_at) !== formatDate(message.created_at);

                    return (
                      <div key={message.id}>
                        {showDate && (
                          <div className="flex items-center justify-center my-4">
                            <span className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                              {formatDate(message.created_at)}
                            </span>
                          </div>
                        )}
                        <div
                          className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] ${
                              isOwnMessage(message)
                                ? 'bg-pink-500 text-white'
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                            } rounded-2xl px-4 py-2 shadow-sm`}
                          >
                            {!isOwnMessage(message) && (
                              <p className="text-xs font-semibold mb-1 text-pink-600 dark:text-pink-400">
                                {message.user_name}
                              </p>
                            )}
                            <p className="break-words">{message.message}</p>
                            {message.location && (
                              <div className="mt-2 pt-2 border-t border-pink-400/30">
                                <a
                                  href={`https://www.google.com/maps?q=${message.location.latitude},${message.location.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs hover:underline"
                                >
                                  <MapPinned className="w-3 h-3" />
                                  View on map
                                </a>
                              </div>
                            )}
                            <p
                              className={`text-xs mt-1 ${
                                isOwnMessage(message)
                                  ? 'text-pink-100'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input - sticky above bottom nav with safe-area padding */}
            <div
              className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 z-50"
              style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
            >
              <div className="flex items-end gap-2">
                <button
                  onClick={handleShareLocation}
                  disabled={sending}
                  className="p-3 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
                  title="Share location"
                >
                  <MapPin className="w-5 h-5" />
                </button>
                <div className="flex-1 relative">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    rows={1}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="p-3 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Map View */}
        {activeTab === 'map' && (
          <div className="flex-1 relative">
            {!userLocation ? (
              <div className="flex items-center justify-center h-full bg-white dark:bg-gray-800">
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
            ) : (
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
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
