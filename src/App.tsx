import { BrowserRouter as Router, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { useEffect, ReactNode, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StoreProvider, useStore } from './store';
import { Auth } from './components/Auth';
import { LoadingScreen } from './components/LoadingScreen';
import { Navigation } from './components/Navigation';
import { DesktopSidebar } from './components/DesktopSidebar';
import { DesktopAside } from './components/DesktopAside';
import { OnboardingModal } from './components/OnboardingModal';

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
    <div className="min-h-screen lg:px-8 lg:py-8 xl:px-10">
      <div className="mx-auto lg:grid lg:max-w-[1520px] lg:grid-cols-[220px_minmax(0,920px)_280px] lg:items-start lg:justify-center lg:gap-10">
        <DesktopSidebar />
        <main className="min-w-0 lg:px-2">
          <Outlet />
        </main>
        <DesktopAside />
      </div>
      <Navigation />
      <OnboardingModal />
    </div>
  );
}

function AppRoutes() {
  const { dataLoading } = useStore();
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
  const { session, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!session) return <Auth />;
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
