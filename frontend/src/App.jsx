import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import Home from './pages/Home';
import Features from './pages/Features';
import Forecast from './pages/Forecast';
import Analytics from './pages/Analytics';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { ChangePassword } from './pages/ChangePassword';
import { Dashboard } from './pages/Dashboard';
import WeatherAlert from './components/WeatherAlert';
import HistoricalAnalytics from './pages/HistoricalAnalytics';
import DetailedForecast from './pages/DetailedForecast';
import News from './pages/News';
import Admin from './pages/Admin';
import Map from './pages/Map';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <WeatherAlert />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/features" element={<Features />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/change-password" element={<ChangePassword />} />

            {/* Protected Route for Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Weather Related Routes */}
            <Route path="/forecast" element={<Forecast />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/historical" element={<HistoricalAnalytics />} />
            <Route path="/detailed-forecast" element={<DetailedForecast />} />
            <Route path="/news" element={<News />} />
            <Route path="/map" element={<Map />} />
            <Route path="/admin" element={<Admin />} />

            {/* Catch-all: redirect unknown paths to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
