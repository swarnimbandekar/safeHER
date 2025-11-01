import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface OnboardingContextType {
  isOnboardingComplete: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(() => {
    return localStorage.getItem('onboardingComplete') === 'true';
  });

  useEffect(() => {
    // Check if onboarding was previously completed
    const completed = localStorage.getItem('onboardingComplete') === 'true';
    setIsOnboardingComplete(completed);

    // Listen for storage changes (in case another tab/window updates it)
    const handleStorageChange = () => {
      const completed = localStorage.getItem('onboardingComplete') === 'true';
      setIsOnboardingComplete(completed);
    };

    // Check periodically for changes (since localStorage doesn't trigger events in the same window)
    const interval = setInterval(handleStorageChange, 100);

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const completeOnboarding = () => {
    setIsOnboardingComplete(true);
    localStorage.setItem('onboardingComplete', 'true');
  };

  const resetOnboarding = () => {
    setIsOnboardingComplete(false);
    localStorage.removeItem('onboardingComplete');
  };

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingComplete,
        completeOnboarding,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}