import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <header className="app-header">
      <div className="header-content">
        <button 
          className="mobile-menu-btn"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
        >
          ☰
        </button>
        
        <h1>eSports Analytics Dashboard</h1>
        
        {user && (
          <div className="user-menu">
            <span className="welcome-text">Welcome, {user.name}</span>
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="user-avatar"
            />
            <button onClick={logout} className="logout-button">
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;