import { BrowserRouter as Router, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { useEffect, ReactNode, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StoreProvider, useStore } from './store';
import { Auth } from './components/Auth';
import { LoadingScreen } from './components/LoadingScreen';
import { Navigation } from './components/Navigation';
import { DesktopFrame } from './components/DesktopFrame';
import { subscribeToPush } from './lib/push';

const Feed = lazy(() => import('./components/Feed').then(module => ({ default: module.Feed })));
const Explore = lazy(() => import('./components/Explore').then(module => ({ default: module.Explore })));
const Notifications = lazy(() => import('./components/Notifications').then(module => ({ default: module.Notifications })));
const Profile = lazy(() => import('./components/Profile').then(module => ({ default: module.Profile })));
const CreateRecommendation = lazy(() => import('./components/CreateRecommendation').then(module => ({ default: module.CreateRecommendation })));
const ItemDetail = lazy(() => import('./components/ItemDetail').then(module => ({ default: module.ItemDetail })));
const RecommendationDetail = lazy(() => import('./components/RecommendationDetail').then(module => ({ default: module.RecommendationDetail })));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Layout() {
  return (
    <>
      <DesktopFrame>
        <Outlet />
      </DesktopFrame>
      <Navigation />
    </>
  );
}

function AppRoutes() {
  const { dataLoading, currentUser, isGuest } = useStore();

  useEffect(() => {
    if (!dataLoading && !isGuest && currentUser.id) {
      void subscribeToPush(currentUser.id);
    }
  }, [dataLoading, isGuest, currentUser.id]);

  if (dataLoading) return <LoadingScreen />;
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Feed />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile/:id" element={<Profile />} />
        </Route>
        <Route path="/create" element={<CreateRecommendation />} />
        <Route path="/item/:id" element={<ItemDetail />} />
        <Route path="/recommendation/:id" element={<RecommendationDetail />} />
      </Routes>
    </Suspense>
  );
}

function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading, isGuest } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!session && !isGuest) return <Auth />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100 selection:bg-zinc-100 selection:text-zinc-950">
          <AuthGate>
            <StoreProvider>
              <AppRoutes />
            </StoreProvider>
          </AuthGate>
        </div>
      </Router>
    </AuthProvider>
  );
}
