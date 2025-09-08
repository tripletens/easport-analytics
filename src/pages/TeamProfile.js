import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTeamData, getTeamPlayers, getTeamMatches, getTeamHeroes, getPlayerData } from '../services/opendota.api';
import { getCountryName } from '../utils/countries';
import './TeamProfile.css';

const TeamProfile = () => {
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [playerDetails, setPlayerDetails] = useState({});
  const [matches, setMatches] = useState([]);
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [playersLoading, setPlayersLoading] = useState(false);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        const [teamData, playersData, matchesData, heroesData] = await Promise.all([
          getTeamData(teamId),
          getTeamPlayers(teamId),
          getTeamMatches(teamId, 10),
          getTeamHeroes(teamId)
        ]);
        
        console.log('Team Data:', teamData);
        console.log('Players Data:', playersData);
        console.log('Matches Data:', matchesData);
        console.log('Heroes Data:', heroesData);
        
        setTeam(teamData);
        setPlayers(playersData);
        setMatches(matchesData);
        setHeroes(heroesData);
        
        // Fetch detailed player information
        await fetchPlayerDetails(playersData);
      } catch (err) {
        setError('Failed to fetch team data. Please try again.');
        console.error('Error fetching team data:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchPlayerDetails = async (playersList) => {
      try {
        setPlayersLoading(true);
        const playerDetailsPromises = playersList.map(async (player) => {
          if (player.account_id) {
            try {
              const details = await getPlayerData(player.account_id);
              return { accountId: player.account_id, details };
            } catch (err) {
              console.error(`Error fetching details for player ${player.account_id}:`, err);
              return { accountId: player.account_id, details: null };
            }
          }
          return null;
        });

        const detailsResults = await Promise.all(playerDetailsPromises);
        const detailsMap = {};
        
        detailsResults.forEach(result => {
          if (result && result.accountId) {
            detailsMap[result.accountId] = result.details;
          }
        });
        
        setPlayerDetails(detailsMap);
      } catch (err) {
        console.error('Error fetching player details:', err);
      } finally {
        setPlayersLoading(false);
      }
    };

    if (teamId) {
      fetchTeamData();
    }
  }, [teamId]);

  // Calculate team statistics
  const calculateWinRate = (wins, losses) => {
    const total = wins + losses;
    return total > 0 ? ((wins / total) * 100).toFixed(1) : 0;
  };

  const getMatchResult = (match, teamId) => {
    const radiantWin = match.radiant_win;
    const isRadiant = match.radiant_team_id === teamId;
    return (isRadiant && radiantWin) || (!isRadiant && !radiantWin) ? 'win' : 'loss';
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // Get player information from details
  const getPlayerName = (player) => {
    const details = playerDetails[player.account_id];
    return details?.profile?.name || details?.name || player.name || player.personaname || 'Unknown Player';
  };

  const getPlayerAvatar = (player) => {
    const details = playerDetails[player.account_id];
    return details?.profile?.avatarfull || details?.avatarfull || player.avatarfull || '/images/person_icon.png';
  };

  const getPlayerCountryCode = (player) => {
    const details = playerDetails[player.account_id];
    return details?.profile?.loccountrycode || details?.country_code || player.country_code || '';
  };

  const getPlayerRole = (player) => {
    const details = playerDetails[player.account_id];
    return details?.fantasy_role || player.fantasy_role || '';
  };

  const roles = {
    1: 'Carry (1)',
    2: 'Midlane (2)',
    3: 'Offlane (3)',
    4: 'Support (4)',
    5: 'Hard Support (5)'
  };

  if (loading) return <div className="loading">Loading team data...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!team) return <div className="not-found">Team not found</div>;

  const winRate = calculateWinRate(team.wins || 0, team.losses || 0);

  return (
    <div className="team-profile">
      <Link to="/teams" className="back-button">← Back to Teams</Link>
      
      {/* Team Header */}
      <div className="team-header card">
        <div className="team-logo-large">
          {team.logo_url ? (
            <img 
              src={team.logo_url} 
              alt={team.name}
              onError={(e) => {
                e.target.src = '/images/team_icon.png';
              }}
            />
          ) : (
            <div className="team-icon-large">🏆</div>
          )}
        </div>
        
        <div className="team-info">
          <h1>{team.name || 'Unknown Team'}</h1>
          <p className="team-tag">{team.tag || 'No tag'}</p>
          
          <div className="team-meta">
            {team.country_code && (
              <div className="meta-item">
                <span className="meta-label">Country:</span>
                <span className="meta-value">{getCountryName(team.country_code)}</span>
              </div>
            )}
            
            {team.rating && (
              <div className="meta-item">
                <span className="meta-label">Rating:</span>
                <span className="meta-value rating">{team.rating}</span>
              </div>
            )}
            
            {team.wins !== undefined && team.losses !== undefined && (
              <div className="meta-item">
                <span className="meta-label">Record:</span>
                <span className="meta-value record">
                  {team.wins}W - {team.losses}L ({winRate}%)
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
              {team.wins || 0}W - {team.losses || 0}L
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Players</h3>
            <div className="stat-value">{players.length}</div>
            <div className="stat-detail">Active roster</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎮</div>
          <div className="stat-content">
            <h3>Matches</h3>
            <div className="stat-value">{matches.length}</div>
            <div className="stat-detail">Recent games</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚔️</div>
          <div className="stat-content">
            <h3>Heroes</h3>
            <div className="stat-value">{heroes.length}</div>
            <div className="stat-detail">Frequently played</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="team-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'players' ? 'active' : ''}`}
          onClick={() => setActiveTab('players')}
        >
          Players ({players.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'matches' ? 'active' : ''}`}
          onClick={() => setActiveTab('matches')}
        >
          Matches ({matches.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'heroes' ? 'active' : ''}`}
          onClick={() => setActiveTab('heroes')}
        >
          Heroes ({heroes.length})
        </button>
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
                  <span>{team.wins || 0} Wins</span>
                </div>
                <div 
                  className="loss-bar" 
                  style={{ width: `${100 - winRate}%` }}
                >
                  <span>{team.losses || 0} Losses</span>
                </div>
              </div>
            </div>

            <div className="additional-info">
              <h3>Team Information</h3>
              <div className="info-grid">
                {team.name && (
                  <div className="info-item">
                    <span className="info-label">Team Name:</span>
                    <span className="info-value">{team.name}</span>
                  </div>
                )}
                {team.tag && (
                  <div className="info-item">
                    <span className="info-label">Tag:</span>
                    <span className="info-value">{team.tag}</span>
                  </div>
                )}
                {team.country_code && (
                  <div className="info-item">
                    <span className="info-label">Country:</span>
                    <span className="info-value">{getCountryName(team.country_code)}</span>
                  </div>
                )}
                {team.rating && (
                  <div className="info-item">
                    <span className="info-label">Rating:</span>
                    <span className="info-value">{team.rating}</span>
                  </div>
                )}
                {team.wins !== undefined && (
                  <div className="info-item">
                    <span className="info-label">Total Wins:</span>
                    <span className="info-value">{team.wins}</span>
                  </div>
                )}
                {team.losses !== undefined && (
                  <div className="info-item">
                    <span className="info-label">Total Losses:</span>
                    <span className="info-value">{team.losses}</span>
                  </div>
                )}
                {team.last_match_time && (
                  <div className="info-item">
                    <span className="info-label">Last Match:</span>
                    <span className="info-value">{formatDate(team.last_match_time)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'players' && (
          <div className="players-tab">
            <h3>Team Roster</h3>
            {playersLoading && <div className="loading-players">Loading player details...</div>}
            {players.length > 0 ? (
              <div className="players-grid">
                {players.map(player => (
                  <Link
                    key={player.account_id}
                    to={`/player/${player.account_id}`}
                    className="player-card"
                  >
                    <div className="player-image">
                      <img
                        src={getPlayerAvatar(player)}
                        alt={getPlayerName(player)}
                        onError={(e) => {
                          e.target.src = '/images/person_icon.png';
                        }}
                      />
                    </div>
                    
                    <div className="player-info">
                      <h4>{getPlayerName(player)}</h4>
                      
                      {player.is_current_team_member && (
                        <span className="current-member">Current Member</span>
                      )}
                      
                      {getPlayerCountryCode(player) && (
                        <p className="player-country">
                          {getCountryName(getPlayerCountryCode(player))}
                        </p>
                      )}
                      
                      {getPlayerRole(player) && (
                        <p className="player-role">
                          Role: {roles[getPlayerRole(player)] || `Role ${getPlayerRole(player)}`}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="no-players">
                <p>No players found for this team.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="matches-tab">
            <h3>Recent Matches</h3>
            {matches.length > 0 ? (
              <div className="matches-list">
                {matches.map(match => (
                  <div key={match.match_id} className={`match-item ${getMatchResult(match, team.team_id)}`}>
                    <div className="match-result">
                      <span className={`result-badge ${getMatchResult(match, team.team_id)}`}>
                        {getMatchResult(match, team.team_id).toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="match-details">
                      <div className="match-teams">
                        <span className="team-name">{match.radiant_name || 'Radiant'}</span>
                        <span className="vs">vs</span>
                        <span className="team-name">{match.dire_name || 'Dire'}</span>
                      </div>
                      
                      <div className="match-stats">
                        <span>Duration: {formatDuration(match.duration)}</span>
                        <span>League: {match.league_name || 'Unknown'}</span>
                      </div>
                    </div>
                    
                    <div className="match-meta">
                      <span className="match-id">#{match.match_id}</span>
                      <span className="match-time">{formatDate(match.start_time)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-matches">
                <p>No recent matches found for this team.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'heroes' && (
          <div className="heroes-tab">
            <h3>Frequently Played Heroes</h3>
            {heroes.length > 0 ? (
              <div className="heroes-list">
                {heroes.slice(0, 10).map(hero => (
                  <div key={hero.hero_id} className="hero-card">
                    <div className="hero-info">
                      <h4>Hero {hero.hero_id}</h4>
                      <div className="hero-stats">
                        <span>Games: {hero.games_played}</span>
                        <span>Wins: {hero.wins}</span>
                        <span>Win Rate: {calculateWinRate(hero.wins, hero.games_played - hero.wins)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-heroes">
                <p>No hero statistics available for this team.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamProfile;