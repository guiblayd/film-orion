import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { StoreProvider } from './store';
import { Feed } from './components/Feed';
import { Navigation } from './components/Navigation';
import { CreateRecommendation } from './components/CreateRecommendation';
import { Profile } from './components/Profile';
import { ItemDetail } from './components/ItemDetail';
import { RecommendationDetail } from './components/RecommendationDetail';
import { Notifications } from './components/Notifications';
import { Explore } from './components/Explore';

function Layout() {
  return (
    <>
      <Outlet />
      <Navigation />
    </>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Router>
        <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100 selection:bg-zinc-100 selection:text-zinc-950">
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
        </div>
      </Router>
    </StoreProvider>
  );
}
