import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Phone, PhoneOff, Volume2, VolumeX } from 'lucide-react';

export function FakeCall() {
  const [isRinging, setIsRinging] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [callTimer, setCallTimer] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isRinging) {
        setCallTimer(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isRinging]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = () => {
    setIsRinging(false);
  };

  const handleEndCall = () => {
    // In a real app, this would end the call
    window.history.back();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <Layout title="Fake Call">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-4">
        {isRinging ? (
          <>
            <div className="text-center mb-8">
              <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mb-6 mx-auto animate-pulse">
                <Phone className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Incoming Call</h2>
              <p className="text-gray-600 dark:text-gray-400">Mom</p>
              <p className="text-gray-600 dark:text-gray-400">+1 234 567 8900</p>
            </div>

            <div className="flex gap-8">
              <button
                onClick={handleEndCall}
                className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <PhoneOff className="w-8 h-8 text-white" />
              </button>
              <button
                onClick={handleAnswer}
                className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
              >
                <Phone className="w-8 h-8 text-white" />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Phone className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Mom</h2>
              <p className="text-gray-600 dark:text-gray-400">{formatTime(callTimer)}</p>
            </div>

            <div className="flex gap-8">
              <button
                onClick={toggleMute}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                  isMuted 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {isMuted ? (
                  <VolumeX className="w-8 h-8 text-white" />
                ) : (
                  <Volume2 className="w-8 h-8 text-gray-900 dark:text-white" />
                )}
              </button>
              <button
                onClick={handleEndCall}
                className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <PhoneOff className="w-8 h-8 text-white" />
              </button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}