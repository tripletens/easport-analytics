import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const navigationItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: '📊',
      description: 'Player search and overview'
    },
    {
      path: '/players',
      label: 'Players',
      icon: '👤',
      description: 'Browse all players'
    },
    {
      path: '/teams',
      label: 'Teams',
      icon: '👥',
      description: 'Team statistics'
    },
    {
      path: '/matches',
      label: 'Matches',
      icon: '🎮',
      description: 'Recent matches'
    },
    {
      path: '/analytics',
      label: 'Analytics',
      icon: '📈',
      description: 'Advanced analytics'
    },
    {
      path: '/favorites',
      label: 'Favorites',
      icon: '⭐',
      description: 'Saved players & teams'
    },
    {
      path: '/recommendations',
      label: 'Recommendations',
      icon: '💡',
      description: 'Strategic insights and advice'
    }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <button 
          className="toggle-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
        {!isCollapsed && (
          <div className="app-info">
            <h3>eSports Analytics</h3>
            <span className="user-role">{user?.role}</span>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {navigationItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            title={isCollapsed ? item.label : ''}
          >
            <span className="nav-icon">{item.icon}</span>
            {!isCollapsed && (
              <div className="nav-content">
                <span className="nav-label">{item.label}</span>
                <span className="nav-description">{item.description}</span>
              </div>
            )}
          </Link>
        ))}
      </nav>

      {!isCollapsed && (
        <div className="sidebar-footer">
          <div className="user-info">
            <img 
              src={user?.avatar} 
              alt={user?.name} 
              className="user-avatar"
            />
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <span className="user-email">{user?.email}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;