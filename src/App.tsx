import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StoreProvider, useStore } from './store';
import { Auth } from './components/Auth';
import { LoadingScreen } from './components/LoadingScreen';
import { Feed } from './components/Feed';
import { Navigation } from './components/Navigation';
import { CreateRecommendation } from './components/CreateRecommendation';
import { Profile } from './components/Profile';
import { ItemDetail } from './components/ItemDetail';
import { RecommendationDetail } from './components/RecommendationDetail';
import { Notifications } from './components/Notifications';
import { Explore } from './components/Explore';
import { ReactNode } from 'react';

function Layout() {
  return (
    <>
      <Outlet />
      <Navigation />
    </>
  );
}

function AppRoutes() {
  const { dataLoading } = useStore();
  if (dataLoading) return <LoadingScreen />;
  return (
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
