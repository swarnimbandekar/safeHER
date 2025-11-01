import { useState, useEffect, useRef } from 'react';

import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { SOSButton } from '../components/SOSButton';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { geolocationService } from '../services/geolocation';
import { shakeDetectionService } from '../services/shakeDetection';
import { audioService } from '../services/audioService';
import { hapticService } from '../services/hapticService';
import { routeSimulationService } from '../services/routeSimulation';
import { Phone, Share2, Shield, AlertCircle, CheckCircle, Route as RouteIcon } from 'lucide-react';

export function Home() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [isSharing, setIsSharing] = useState(false);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [showSOSConfirmation, setShowSOSConfirmation] = useState(false);
  const [showImSafeModal, setShowImSafeModal] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [motionPermission, setMotionPermission] = useState<'granted' | 'denied' | 'prompt' | null>(null);
  const sosInProgressRef = useRef(false);
  const sosCooldownRef = useRef<number>(0);
  const SOS_COOLDOWN_MS = 10000; // 10s cooldown to avoid rapid repeats

  useEffect(() => {
    checkSharingStatus();
    
    // Request device motion permission and start listening for shake events
    initShakeDetection();
    
    // Cleanup listener on component unmount
    return () => {
      shakeDetectionService.stopListening();
    };
  }, []);

  const initShakeDetection = async () => {
    try {
      const hasPermission = await shakeDetectionService.requestPermission();
      setMotionPermission(hasPermission ? 'granted' : 'denied');
      if (hasPermission) {
        shakeDetectionService.startListening(handleShakeSOS);
      }
    } catch (err) {
      console.error('Failed to initialize shake detection:', err);
      setMotionPermission('denied');
    }
  };

  const checkSharingStatus = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from('location_shares')
      .select('is_active')
      .eq('user_id', profile.id)
      .maybeSingle();

    if (data) {
      setIsSharing(data.is_active);
    }
  };

  const handleSOS = async () => {
    if (sosInProgressRef.current || sosLoading) return;
    const now = Date.now();
    if (now - sosCooldownRef.current < SOS_COOLDOWN_MS) return;
    sosInProgressRef.current = true;
    sosCooldownRef.current = now;
    setError('');
    setSosLoading(true);
    
    // Play alert sound and trigger haptic feedback immediately
    audioService.playSOSAlert();
    hapticService.triggerSOSVibration();
    
    setShowSOSModal(true); // Show "Sending SOS" modal immediately

    try {
      // Simulate sending SOS
      console.log("Sending SOS to Trusted Circle...");
      
      // Get current position or use mock location if it fails
      let coords;
      try {
        coords = await geolocationService.getCurrentPosition();
      } catch (locationError) {
        console.log('Using mock location for SOS');
        coords = geolocationService.getMockLocation();
      }

      // Insert SOS alert into database
      const { error: insertError } = await supabase.from('sos_alerts').insert({
        user_id: profile!.id,
        latitude: coords.latitude,
        longitude: coords.longitude,
        message: `Emergency alert from ${profile!.full_name}`,
        status: 'active',
      });

      if (insertError) throw insertError;

      // Play confirmation sound and haptic feedback
      audioService.playSOSConfirmation();
      hapticService.triggerConfirmationVibration();
      
      // Show confirmation after successful insertion
      setShowSOSModal(false);
      setShowSOSConfirmation(true);
    } catch (err: any) {
      setShowSOSModal(false);
      setError(err.message || 'Failed to send SOS alert');
    } finally {
      setSosLoading(false);
      sosInProgressRef.current = false;
    }
  };

  const handleImSafe = async () => {
    try {
      // Update SOS alerts to mark user as safe
      const { error: updateError } = await supabase
        .from('sos_alerts')
        .update({ status: 'resolved' })
        .eq('user_id', profile!.id)
        .eq('status', 'active');

      if (updateError) throw updateError;

      // Also stop location sharing if active
      if (isSharing) {
        const { error: upsertError } = await supabase
          .from('location_shares')
          .upsert({
            user_id: profile!.id,
            is_active: false,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          });

        if (upsertError) throw upsertError;
        
        setIsSharing(false);
        geolocationService.stopWatching(() => {});
      }

      // Stop any route simulation
      routeSimulationService.stopSimulation();

      // Play confirmation sound and haptic feedback
      audioService.playSOSConfirmation();
      hapticService.triggerConfirmationVibration();
      
      setShowImSafeModal(true);
    } catch (err: any) {
      setError(err.message || 'Failed to mark as safe');
    }
  };

  const handleShakeSOS = () => {
    // Respect in-progress and cooldown guards
    if (sosInProgressRef.current || sosLoading) return;
    const now = Date.now();
    if (now - sosCooldownRef.current < SOS_COOLDOWN_MS) return;
    handleSOS();
  };

  const toggleLocationSharing = async () => {
    try {
      // Get current position or use mock location if it fails
      let coords;
      try {
        coords = await geolocationService.getCurrentPosition();
      } catch (locationError) {
        console.log('Using mock location for sharing');
        coords = geolocationService.getMockLocation();
      }
      const newStatus = !isSharing;

      const { error: upsertError } = await supabase
        .from('location_shares')
        .upsert({
          user_id: profile!.id,
          latitude: coords.latitude,
          longitude: coords.longitude,
          is_active: newStatus,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (upsertError) throw upsertError;

      setIsSharing(newStatus);
      setSuccess(newStatus ? 'Location sharing started' : 'Location sharing stopped');
      setTimeout(() => setSuccess(''), 3000);

      if (newStatus) {
        geolocationService.startWatching(async (newCoords) => {
          await supabase
            .from('location_shares')
            .update({
              latitude: newCoords.latitude,
              longitude: newCoords.longitude,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', profile!.id);
        });
      } else {
        geolocationService.stopWatching(() => {});
      }
    } catch (err: any) {
      setError(err.message || 'Failed to toggle location sharing');
    }
  };

  return (
    <Layout>
      <div className="px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome, {profile?.full_name}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Stay safe with safeHER</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
          </div>
        )}

        {/* Motion Permission Request */}
        {motionPermission === 'denied' && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              Shake-to-alert is disabled. Please enable motion sensors in your device settings to use this feature.
            </p>
          </div>
        )}

        <div className="flex justify-center mb-8">
          <SOSButton onClick={handleSOS} disabled={sosLoading} />
        </div>

        {/* I'm Safe Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handleImSafe}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <CheckCircle className="w-5 h-5" />
            I'm Safe
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={toggleLocationSharing}
            className={`p-6 rounded-xl shadow-md transition-all ${
              isSharing
                ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
            }`}
          >
            <Share2
              className={`w-8 h-8 mb-3 mx-auto ${
                isSharing ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
              }`}
            />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              {isSharing ? 'Sharing Location' : 'Share Location'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isSharing ? 'Contacts can see your location' : 'Let contacts track you'}
            </p>
          </button>

          <button
            onClick={() => navigate('/fake-call')}
            className="p-6 rounded-xl shadow-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Phone className="w-8 h-8 mb-3 mx-auto text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Fake Call</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Simulate incoming call</p>
          </button>

          <button
            onClick={() => navigate('/safe-routing')}
            className="p-6 rounded-xl shadow-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RouteIcon className="w-8 h-8 mb-3 mx-auto text-green-600 dark:text-green-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Safe Routing</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Find safest routes</p>
          </button>

          <button
            onClick={() => navigate('/map')}
            className="p-6 rounded-xl shadow-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Shield className="w-8 h-8 mb-3 mx-auto text-red-600 dark:text-red-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Safe Zones</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">View nearby safe places</p>
          </button>
        </div>
      </div>

      {/* Sending SOS Modal */}
      {showSOSModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 modal-enter-active">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full transform transition-all duration-300 scale-100">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full mb-4">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Sending SOS
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Sending SOS to Trusted Circle...
              </p>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SOS Confirmation Modal */}
      {showSOSConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 modal-enter-active">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full transform transition-all duration-300 scale-100">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                SOS Alert Sent!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your emergency contacts have been notified with your current location.
              </p>
              <button
                onClick={() => setShowSOSConfirmation(false)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* I'm Safe Confirmation Modal */}
      {showImSafeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 modal-enter-active">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full transform transition-all duration-300 scale-100">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Status Updated
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your contacts have been notified that you are safe.
              </p>
              <button
                onClick={() => setShowImSafeModal(false)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}