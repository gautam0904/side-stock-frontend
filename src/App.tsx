import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/auth.contexts.tsx';
import ErrorBoundary from './components/error/errorBoundary.component.tsx';
import AppRoutes from './routes/app.routes.tsx';
import { ProtectedRoute } from './routes/protected.routes.tsx';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/navbar/navbar.components.tsx';

// Lazy-loaded components
const NotFound = React.lazy(() => import('./components/notFound/notFound.component.tsx'));
const Dashboard = React.lazy(() => import('./pages/customerGST/customerGST.page.tsx'));

const App = () => {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <Router>
          <Suspense fallback={''}>
            <Toaster position="top-right" />
            <Navbar />
            <main>
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
    </AuthProvider>
  );
};

export default App;
