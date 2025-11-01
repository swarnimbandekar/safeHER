import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { OnboardingProvider, useOnboarding } from './contexts/OnboardingContext';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { Onboarding } from './pages/Onboarding';
import { Home } from './pages/Home';
import { MapView } from './pages/MapView';
import { Contacts } from './pages/Contacts';
import { Profile } from './pages/Profile';
import { FakeCall } from './pages/FakeCall';
import { SafeRouting } from './pages/SafeRouting';
import { CommunityWatch } from './pages/CommunityWatch';
import { PinkRelief } from './pages/PinkRelief';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { isOnboardingComplete } = useOnboarding();

  console.log('ProtectedRoute:', { user: !!user, loading, isOnboardingComplete });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('No user, redirecting to signin');
    return <Navigate to="/signin" />;
  }

  // If user is logged in but onboarding isn't complete, redirect to onboarding
  if (user && !isOnboardingComplete) {
    console.log('User exists but onboarding not complete, redirecting to onboarding');
    return <Navigate to="/onboarding" />;
  }

  console.log('User authenticated and onboarding complete, rendering protected content');
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <OnboardingProvider>
          <AuthProvider>
            <Routes>
              <Route
                path="/onboarding"
                element={<Onboarding />}
              />
              <Route
                path="/signin"
                element={
                  <PublicRoute>
                    <SignIn />
                  </PublicRoute>
                }
              />
              <Route
                path="/signup"
                element={
                  <PublicRoute>
                    <SignUp />
                  </PublicRoute>
                }
              />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/map"
                element={
                  <ProtectedRoute>
                    <MapView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/community-watch"
                element={
                  <ProtectedRoute>
                    <CommunityWatch />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pink-relief"
                element={
                  <ProtectedRoute>
                    <PinkRelief />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contacts"
                element={
                  <ProtectedRoute>
                    <Contacts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fake-call"
                element={
                  <ProtectedRoute>
                    <FakeCall />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/safe-routing"
                element={
                  <ProtectedRoute>
                    <SafeRouting />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </OnboardingProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;