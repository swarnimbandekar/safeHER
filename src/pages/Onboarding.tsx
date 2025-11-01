import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { User, Phone, MapPin, Shield, Heart, Check } from 'lucide-react';

export function Onboarding() {
  const navigate = useNavigate();
  const { signUp, user } = useAuth();
  const { completeOnboarding } = useOnboarding();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: 'Jane Doe',
    phoneNumber: '+1 234 567 8900',
    email: 'jane.doe@example.com',
    password: 'password123',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If user is already signed in, redirect to home
  useEffect(() => {
    if (user) {
      completeOnboarding();
      navigate('/', { replace: true });
    }
  }, [user]);

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      completeOnboarding();
      navigate('/', { replace: true });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError('');
    
    try {
      await signUp(
        formData.email,
        formData.password,
        formData.fullName,
        formData.phoneNumber
      );
      // Wait a bit for profile to be created
      await new Promise(resolve => setTimeout(resolve, 500));
      completeOnboarding();
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { title: 'Welcome', icon: User },
    { title: 'Your Info', icon: Phone },
    { title: 'Safety Features', icon: Shield },
    { title: 'Complete', icon: Check },
  ];

  // If user is already signed in, don't show onboarding
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Progress indicator */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((stepItem, index) => {
              const Icon = stepItem.icon;
              const isActive = index + 1 === step;
              const isCompleted = index + 1 < step;
              
              return (
                <div key={index} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    isActive 
                      ? 'bg-pink-500 text-white' 
                      : isCompleted 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs text-center ${
                    isActive 
                      ? 'text-pink-600 dark:text-pink-400 font-medium' 
                      : isCompleted 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {stepItem.title}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Step content */}
          <div className="mb-8">
            {step === 1 && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 dark:bg-pink-900 rounded-full mb-4">
                  <span className="text-3xl font-bold text-pink-600 dark:text-pink-400">SH</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Welcome to safeHER</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Your personal safety companion. Let's get you set up with a demo account.
                </p>
                <div className="bg-pink-50 dark:bg-pink-900/20 rounded-xl p-4 mb-6">
                  <p className="text-pink-700 dark:text-pink-300 text-sm">
                    This is a demo with prefilled sample data. You can change any information later.
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-3 border calm-pink-border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Jane Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full px-4 py-3 border calm-pink-border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="+1 234 567 8900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border calm-pink-border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="jane.doe@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 border calm-pink-border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Safety Features</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
                    <div className="flex-shrink-0 w-10 h-10 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center">
                      <Shield className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">SOS Emergency</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Tap the big red SOS button or shake your device to send an emergency alert to your contacts.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
                    <div className="flex-shrink-0 w-10 h-10 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Safe Routing</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Find the safest walking routes with danger zone alerts and real-time navigation.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
                    <div className="flex-shrink-0 w-10 h-10 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center">
                      <Heart className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Community Watch</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Connect with nearby volunteers and report incidents to help keep your community safe.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
                  <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Ready to Go!</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Your demo account is ready. We'll create your account with the information you provided.
                </p>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-left">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Name</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formData.fullName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Phone</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formData.phoneNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Email</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formData.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-3">
            {step > 1 && (
              <button
                onClick={handleBack}
                disabled={loading}
                className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Back
              </button>
            )}
            
            {step < 4 ? (
              <button
                onClick={handleNext}
                className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSignUp}
                disabled={loading}
                className="flex-1 bg-pink-500 hover:bg-pink-600 disabled:bg-pink-400 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {loading ? 'Creating Account...' : 'Get Started'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}