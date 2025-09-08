import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { searchPlayers, getProMatches } from '../services/opendota.api';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/SearchBar';
import './Home.css';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchRecentMatches = async () => {
      try {
        setMatchesLoading(true);
        const matches = await getProMatches(5); // Get 5 recent pro matches
        setRecentMatches(matches);
      } catch (err) {
        console.error('Failed to fetch recent matches:', err);
      } finally {
        setMatchesLoading(false);
      }
    };

    fetchRecentMatches();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const results = await searchPlayers(searchQuery);
      setSearchResults(results.slice(0, 6)); // Show only 6 results
    } catch (err) {
      setError('Failed to search players. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.name}!</h1>
        <p>Analyze eSports performance data and gain actionable insights</p>
      </div>

      <div className="dashboard-grid">
        {/* Quick Stats Cards */}
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>Players Analyzed</h3>
              <span className="stat-value">1,247</span>
              <span className="stat-change">+12% this week</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🎮</div>
            <div className="stat-info">
              <h3>Matches Processed</h3>
              <span className="stat-value">8,956</span>
              <span className="stat-change">+8% this week</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <h3>Data Points</h3>
              <span className="stat-value">2.3M</span>
              <span className="stat-change">+15% this week</span>
            </div>
          </div>
        </div>

        {/* Main Search Section */}
        <div className="search-section card">
          <h2>Player Search</h2>
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleSearch={handleSearch}
            loading={loading}
            onClear={clearSearch}
          />

          {error && <div className="error-message">{error}</div>}

          {searchResults.length > 0 && (
            <div className="search-results">
              <div className="results-header">
                <h3>Search Results</h3>
                <button onClick={clearSearch} className="clear-btn">
                  Clear
                </button>
              </div>
              <div className="results-grid">
                {searchResults.map((player) => (
                  <Link 
                    key={player.account_id} 
                    to={`/player/${player.account_id}`}
                    className="player-result-card"
                  >
                    <img src={player.avatarfull} alt={player.personaname} />
                    <div className="player-info">
                      <h4>{player.personaname}</h4>
                      <p>Last match: {player.last_match_time ? 
                        new Date(player.last_match_time).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Pro Matches */}
        <div className="recent-matches card">
          <h2>Recent Pro Matches</h2>
          {matchesLoading ? (
            <div className="loading">Loading recent matches...</div>
          ) : (
            <div className="matches-list">
              {recentMatches.slice(0, 5).map((match) => (
                <div key={match.match_id} className="match-item">
                  <div className="match-teams">
                    <span className="team-name">Team {match.radiant_team_id || 'Radiant'}</span>
                    <span className="vs">vs</span>
                    <span className="team-name">Team {match.dire_team_id || 'Dire'}</span>
                  </div>
                  <div className="match-details">
                    <span className={`match-result ${match.radiant_win ? 'radiant-win' : 'dire-win'}`}>
                      {match.radiant_win ? 'Radiant Victory' : 'Dire Victory'}
                    </span>
                    <span className="match-duration">
                      {Math.floor(match.duration / 60)}m {match.duration % 60}s
                    </span>
                    <span className="match-time">
                      {new Date(match.start_time * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link to="/matches" className="view-all-link">
            View All Matches →
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions card">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <Link to="/players" className="action-btn">
              <span className="action-icon">👥</span>
              <span>Browse Players</span>
            </Link>
            <Link to="/teams" className="action-btn">
              <span className="action-icon">👥</span>
              <span>View Teams</span>
            </Link>
            <Link to="/analytics" className="action-btn">
              <span className="action-icon">📈</span>
              <span>Analytics</span>
            </Link>
            <Link to="/favorites" className="action-btn">
              <span className="action-icon">⭐</span>
              <span>Favorites</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;