import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import Login from './pages/Login';
import Home from './pages/Home';
import './App.css';

import PlayerProfile from './pages/PlayerProfile';
import Players from './pages/Players';
import Teams from './pages/Teams';
import TeamProfile from './pages/TeamProfile';
import Matches from './pages/Matches';
import MatchProfile from './pages/MatchProfile';
import Analytics from './pages/Analytics';
import Favorites from './pages/Favorites';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Home />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/players"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Players />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/teams"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Teams />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/team/:teamId"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <TeamProfile />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/player/:accountId"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <PlayerProfile />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/matches"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Matches />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/match/:matchId"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <MatchProfile />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Analytics />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/favorites"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Favorites />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;