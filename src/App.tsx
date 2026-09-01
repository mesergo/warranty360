import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { TopBar } from './components/TopBar';
import { RoleGate } from './components/RoleGate';
import { useAuth } from './store/auth';
import Home from './pages/Home';
import ScanQr from './pages/ScanQr';
import ConsumerProductList from './pages/consumer/ProductList';
import ConsumerProductDetail from './pages/consumer/ProductDetail';
import InstitutionHome from './pages/institution/InstitutionHome';
import InstitutionDashboard from './pages/institution/Dashboard';
import InstitutionProductsList from './pages/institution/ProductsList';
import InstitutionProductDetail from './pages/institution/ProductDetail';
import Labels from './pages/institution/Labels';
import InstitutionServiceRequests from './pages/institution/ServiceRequests';
import NotFound from './pages/NotFound';

/** בודק כל 30 שניות אם הסשן (טוקן בתוקף שעה) פג — ומתנתק אוטומטית אם כן, כדי לחייב כניסה מחודשת לפי טלפון. */
function useSessionWatcher() {
  const logout = useAuth((s) => s.logout);
  useEffect(() => {
    const interval = setInterval(() => {
      if (useAuth.getState().isExpired()) logout();
    }, 30_000);
    return () => clearInterval(interval);
  }, [logout]);
}

export default function App() {
  useSessionWatcher();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <TopBar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/q/:code" element={<ScanQr />} />

          <Route
            path="/consumer"
            element={
              <RoleGate role="consumer">
                <ConsumerProductList />
              </RoleGate>
            }
          />
          <Route
            path="/consumer/products/:id"
            element={
              <RoleGate role="consumer">
                <ConsumerProductDetail />
              </RoleGate>
            }
          />

          <Route
            path="/institution"
            element={
              <RoleGate role="admin">
                <InstitutionHome />
              </RoleGate>
            }
          />
          <Route
            path="/institution/dashboard"
            element={
              <RoleGate role="admin">
                <InstitutionDashboard />
              </RoleGate>
            }
          />
          <Route
            path="/institution/products"
            element={
              <RoleGate role="admin">
                <InstitutionProductsList />
              </RoleGate>
            }
          />
          <Route
            path="/institution/products/:id"
            element={
              <RoleGate role="admin">
                <InstitutionProductDetail />
              </RoleGate>
            }
          />
          <Route
            path="/institution/labels"
            element={
              <RoleGate role="admin">
                <Labels />
              </RoleGate>
            }
          />
          <Route
            path="/institution/service-requests"
            element={
              <RoleGate role="admin">
                <InstitutionServiceRequests />
              </RoleGate>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}
