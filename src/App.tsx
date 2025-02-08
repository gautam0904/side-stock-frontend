import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/auth.contexts.tsx';
import ErrorBoundary from './components/error/errorBoundary.component.tsx';
import AppRoutes from './routes/app.routes.tsx';
import { ProtectedRoute } from './routes/protected.routes.tsx';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/navbar/navbar.components.tsx';
import { GstProvider } from './contexts/gst.contexts';
import { SidebarProvider } from './contexts/sidebar.context';
import './App.css';

const NotFound = React.lazy(() => import('./components/notFound/notFound.component.tsx'));
const Dashboard = React.lazy(() => import('./pages/dashboard/dashboard.page.tsx'));

const ConditionalNavbar = () => {
  const location = useLocation();
  
  const excludeNavbarPaths = ['/login', '/signup'];
  
  if (excludeNavbarPaths.includes(location.pathname)) {
    return null;
  }
  return <Navbar />;
};

const App = () => {
  return (
    <GstProvider>
      <AuthProvider>
        <SidebarProvider>
          <ErrorBoundary>
            <Router>
              <Suspense fallback={''}>
                <Toaster position="top-right" />
                
                {/* Conditionally render Navbar */}
                <ConditionalNavbar />
                
                <main className="main-content">
                  <Routes>
                    {AppRoutes}
                    <Route
                      path="/"
                      element={<ProtectedRoute children={<Dashboard />} />}
                    />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </Suspense>
            </Router>
          </ErrorBoundary>
        </SidebarProvider>
      </AuthProvider>
    </GstProvider>
  );
};

export default App;
