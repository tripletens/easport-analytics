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
              path="/player/:accountId" 
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <PlayerProfile />
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