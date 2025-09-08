import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPlayerData, getPlayerMatches, getPlayerWinLoss } from '../services/opendota.api';
import { getCountryName } from '../utils/countries';
import './PlayerProfile.css';

const PlayerProfile = () => {
  const { accountId } = useParams();
  const [player, setPlayer] = useState(null);
  const [matches, setMatches] = useState([]);
  const [winLoss, setWinLoss] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        setLoading(true);
        const [playerData, matchesData, winLossData] = await Promise.all([
          getPlayerData(accountId),
          getPlayerMatches(accountId, 20),
          getPlayerWinLoss(accountId)
        ]);
        
        console.log('Player Data:', playerData); // Debug log
        console.log('Win/Loss Data:', winLossData); // Debug log
        
        setPlayer(playerData);
        setMatches(matchesData);
        setWinLoss(winLossData);
      } catch (err) {
        setError('Failed to fetch player data. Please try again.');
        console.error('Error fetching player data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (accountId) {
      fetchPlayerData();
    }
  }, [accountId]);

  // Extract player information safely
  const getPlayerName = () => {
    if (!player) return 'Unknown Player';
    return player?.profile?.name || player?.profile?.personaname || 'Unknown Player';
  };

  const getSteamId = () => {
    if (!player) return '';
    return player.steamid || player?.profile?.steamid || '';
  };

  const getAvatar = () => {
    if (!player) return '/images/person_icon.png';
    return player.avatarfull || player?.profile?.avatar || '/images/person_icon.png';
  };

  const getTeamName = () => {
    if (!player) return '';
    return player.team_name || '';
  };

  const getCountryCode = () => {
    if (!player) return '';
    return player.country_code || player?.profile?.steamidloccountrycode || '';
  };

  const getProfileUrl = () => {
    if (!player) return '';
    return player.profileurl || player?.profile?.profileurl || '';
  };

  if (loading) return <div className="loading">Loading player data...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!player) return <div className="not-found">Player not found</div>;

  // Calculate derived stats - use winLoss data directly
  const totalMatches = (winLoss?.win || 0) + (winLoss?.lose || 0);
  const winRate = totalMatches > 0 ? ((winLoss.win / totalMatches) * 100).toFixed(1) : 0;
  
  const roles = {
    1: 'Carry (1)',
    2: 'Midlane (2)',
    3: 'Offlane (3)',
    4: 'Support (4)',
    5: 'Hard Support (5)'
  };

  const getMatchResult = (match) => {
    const isRadiant = match.player_slot < 128;
    const radiantWin = match.radiant_win;
    return (isRadiant && radiantWin) || (!isRadiant && !radiantWin) ? 'win' : 'loss';
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="player-profile">
      <Link to="/players" className="back-button">← Back to Players</Link>
      
      {/* Player Header */}
      <div className="profile-header card">
        <div className="profile-avatar">
          <img 
            src={getAvatar()} 
            alt={getPlayerName()} 
            onError={(e) => {
              e.target.src = '/images/person_icon.png';
            }}
          />
          {player.is_pro && <div className="pro-badge">PRO</div>}
        </div>
        
        <div className="profile-info">
          <h1>{getPlayerName()}</h1>
          {getSteamId() && <p className="steam-id">Steam ID: {getSteamId()}</p>}
          
          <div className="profile-meta">
            {getTeamName() && (
              <div className="meta-item">
                <span className="meta-label">Team:</span>
                <span className="meta-value">{getTeamName()}</span>
              </div>
            )}
            
            {getCountryCode() && (
              <div className="meta-item">
                <span className="meta-label">Country:</span>
                <span className="meta-value">{getCountryName(getCountryCode())}</span>
              </div>
            )}
            
            {player.fantasy_role && (
              <div className="meta-item">
                <span className="meta-label">Role:</span>
                <span className="meta-value">{roles[player.fantasy_role] || `Role ${player.fantasy_role}`}</span>
              </div>
            )}
            
            {player.last_match_time && (
              <div className="meta-item">
                <span className="meta-label">Last Match:</span>
                <span className="meta-value">
                  {new Date(player.last_match_time).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <h3>Win Rate</h3>
            <div className="stat-value">{winRate}%</div>
            <div className="stat-detail">
              {winLoss?.win || 0}W - {winLoss?.lose || 0}L
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total Matches</h3>
            <div className="stat-value">{totalMatches}</div>
            <div className="stat-detail">Recorded matches</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>Status</h3>
            <div className="stat-value">{player.is_pro ? 'Professional' : 'Amateur'}</div>
            <div className="stat-detail">
              {getTeamName() && `Playing for ${getTeamName()}`}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="profile-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'matches' ? 'active' : ''}`}
          onClick={() => setActiveTab('matches')}
        >
          Recent Matches ({matches.length})
        </button>
        {/* <button 
          className={`tab-button ${activeTab === 'heroes' ? 'active' : ''}`}
          onClick={() => setActiveTab('heroes')}
        >
          Heroes
        </button> */}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="win-loss-chart">
              <h3>Win/Loss Distribution</h3>
              <div className="chart-container">
                <div 
                  className="win-bar" 
                  style={{ width: `${winRate}%` }}
                >
                  <span>{winLoss?.win || 0} Wins</span>
                </div>
                <div 
                  className="loss-bar" 
                  style={{ width: `${100 - winRate}%` }}
                >
                  <span>{winLoss?.lose || 0} Losses</span>
                </div>
              </div>
            </div>

            <div className="additional-info">
              <h3>Additional Information</h3>
              <div className="info-grid">
                {getProfileUrl() && (
                  <div className="info-item">
                    <span className="info-label">Steam Profile:</span>
                    <a 
                      href={getProfileUrl()} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="info-value link"
                    >
                      View on Steam
                    </a>
                  </div>
                )}
                <div className="info-item">
                  <span className="info-label">Account ID:</span>
                  <span className="info-value">{player?.profile.account_id}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Pro Status:</span>
                  <span className="info-value">{player.is_pro ? 'Yes' : 'No'}</span>
                </div>
                {player.team_tag && (
                  <div className="info-item">
                    <span className="info-label">Team Tag:</span>
                    <span className="info-value">{player.team_tag}</span>
                  </div>
                )}
                {player.cheese !== undefined && (
                  <div className="info-item">
                    <span className="info-label">Cheese:</span>
                    <span className="info-value">{player.cheese}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="matches-tab">
            <h3>Recent Matches</h3>
            {matches.length > 0 ? (
              <div className="matches-list">
                {matches.map(match => (
                  <div key={match.match_id} className={`match-item ${getMatchResult(match)}`}>
                    <div className="match-result">
                      <span className={`result-badge ${getMatchResult(match)}`}>
                        {getMatchResult(match).toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="match-details">
                      <div className="match-hero">
                        <span className="hero-name">Hero: {match.hero_id}</span>
                      </div>
                      
                      <div className="match-stats">
                        <span>K/D/A: {match.kills}/{match.deaths}/{match.assists}</span>
                        <span>Duration: {formatDuration(match.duration)}</span>
                      </div>
                    </div>
                    
                    <div className="match-meta">
                      <span className="match-id">#{match.match_id}</span>
                      <span className="match-time">
                        {new Date(match.start_time * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-matches">
                <p>No recent matches found for this player.</p>
              </div>
            )}
          </div>
        )}

        {/* {activeTab === 'heroes' && (
          <div className="heroes-tab">
            <h3>Hero Statistics</h3>
            <div className="coming-soon">
              <p>Hero statistics will be available soon!</p>
              <span className="emoji">🛠️</span>
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default PlayerProfile;