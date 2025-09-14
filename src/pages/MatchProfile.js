import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMatchDetails, getPlayerData } from '../services/opendota.api';
import { getCountryName } from '../utils/countries';
import './MatchProfile.css';
import PlayerPerformanceChart from '../components/PlayerPerformanceChart';
import PlayerPerformanceChartTwo from '../components/PlayerPerformanceChartTwo';
import PlayerComparison from '../components/PlayerComparison';
import * as d3 from 'd3';

const MatchProfile = () => {
  const { matchId } = useParams();
  const [match, setMatch] = useState(null);
  const [playerDetails, setPlayerDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [playersLoading, setPlayersLoading] = useState(false);

  useEffect(() => {
    const fetchMatchData = async () => {
      try {
        setLoading(true);
        const matchData = await getMatchDetails(matchId);

        console.log('Match Data:', matchData);
        setMatch(matchData);

        await fetchPlayerDetails(matchData.players || []);
      } catch (err) {
        setError('Failed to fetch match data. Please try again.');
        console.error('Error fetching match data:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchPlayerDetails = async (players) => {
      try {
        setPlayersLoading(true);
        const playerDetailsPromises = players.map(async (player) => {
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

    if (matchId) {
      fetchMatchData();
    }
  }, [matchId]);

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString();
  };

  const getPlayerName = (accountId) => {
    const details = playerDetails[accountId];
    return details?.profile?.name || details?.name || `Player ${accountId}`;
  };

  const getPlayerAvatar = (accountId) => {
    const details = playerDetails[accountId];
    return details?.profile?.avatarfull || details?.avatarfull || '/images/person_icon.png';
  };

  const getKDA = (player) => {
    return `${player.kills || 0}/${player.deaths || 0}/${player.assists || 0}`;
  };

  const getKDARatio = (player) => {
    const kills = player.kills || 0;
    const deaths = player.deaths || 0;
    const assists = player.assists || 0;
    return deaths > 0 ? ((kills + assists) / deaths).toFixed(2) : (kills + assists).toFixed(2);
  };

  const getNetWorth = (player) => {
    return player.net_worth ? Math.round(player.net_worth).toLocaleString() : '0';
  };

  const getGPM = (player) => {
    return player.gold_per_min || 0;
  };

  const getXPM = (player) => {
    return player.xp_per_min || 0;
  };

  const getHeroDamage = (player) => {
    return player.hero_damage ? Math.round(player.hero_damage).toLocaleString() : '0';
  };

  const getTowerDamage = (player) => {
    return player.tower_damage ? Math.round(player.tower_damage).toLocaleString() : '0';
  };

  const getHeroHealing = (player) => {
    return player.hero_healing ? Math.round(player.hero_healing).toLocaleString() : '0';
  };

  const getLastHits = (player) => {
    return player.last_hits || 0;
  };

  const getDenies = (player) => {
    return player.denies || 0;
  };

  if (loading) return <div className="loading">Loading match data...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!match) return <div className="not-found">Match not found</div>;

  const radiantPlayers = match.players?.filter(player => player.player_slot < 128) || [];
  const direPlayers = match.players?.filter(player => player.player_slot >= 128) || [];

  const radiantGoldAdvantage = match.radiant_gold_adv || [];
  const radiantXpAdvantage = match.radiant_xp_adv || [];

  return (
    <div className="match-profile">
      <Link to="/matches" className="back-button">← Back to Matches</Link>

      <div className="match-header card">
        <div className="match-basic-info">
          <h1>Match #{match.match_id}</h1>
          <div className="match-result">
            <span className={`result-badge ${match.radiant_win ? 'radiant-win' : 'dire-win'}`}>
              {match.radiant_win ? 'RADIANT VICTORY' : 'DIRE VICTORY'}
            </span>
            <span className="duration">{formatDuration(match.duration)}</span>
          </div>
        </div>

        <div className="match-meta">
          <div className="meta-item">
            <span className="meta-label">Date:</span>
            <span className="meta-value">{formatDate(match.start_time)}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Time:</span>
            <span className="meta-value">{formatTime(match.start_time)}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Game Mode:</span>
            <span className="meta-value">{match.game_mode || 'Unknown'}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Lobby Type:</span>
            <span className="meta-value">{match.lobby_type || 'Unknown'}</span>
          </div>
          {match.league && (
            <div className="meta-item">
              <span className="meta-label">League:</span>
              <span className="meta-value">{match.league.name || 'Unknown'}</span>
            </div>
          )}
          {match.series_id && (
            <div className="meta-item">
              <span className="meta-label">Series ID:</span>
              <span className="meta-value">{match.series_id}</span>
            </div>
          )}
        </div>
      </div>

      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <h3>Duration</h3>
            <div className="stat-value">{formatDuration(match.duration)}</div>
            <div className="stat-detail">Total match time</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚔️</div>
          <div className="stat-content">
            <h3>First Blood</h3>
            <div className="stat-value">{match.first_blood_time ? `${match.first_blood_time}s` : 'N/A'}</div>
            <div className="stat-detail">Time of first blood</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏰</div>
          <div className="stat-content">
            <h3>Barracks</h3>
            <div className="stat-value">
              {match.barracks_status_radiant ? 'Radiant: ' + match.barracks_status_radiant : ''}
              {match.barracks_status_dire ? ' Dire: ' + match.barracks_status_dire : ''}
            </div>
            <div className="stat-detail">Barracks status</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏛️</div>
          <div className="stat-content">
            <h3>Towers</h3>
            <div className="stat-value">
              {match.tower_status_radiant ? 'Radiant: ' + match.tower_status_radiant : ''}
              {match.tower_status_dire ? ' Dire: ' + match.tower_status_dire : ''}
            </div>
            <div className="stat-detail">Tower status</div>
          </div>
        </div>
      </div>

      <div className="match-tabs">
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
          Players ({match.players?.length || 0})
        </button>
        <button
          className={`tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          Analysis
        </button>
        <button
          className={`tab-button ${activeTab === 'buildings' ? 'active' : ''}`}
          onClick={() => setActiveTab('buildings')}
        >
          Buildings
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="teams-comparison">
              <div className="team-side radiant-side">
                <h3>Radiant</h3>
                <div className="team-stats">
                  <div className="team-stat">
                    <span className="stat-label">Gold:</span>
                    <span className="stat-value">{match.radiant_gold_adv?.[match.radiant_gold_adv.length - 1]?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="team-stat">
                    <span className="stat-label">XP:</span>
                    <span className="stat-value">{match.radiant_xp_adv?.[match.radiant_xp_adv.length - 1]?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="team-stat">
                    <span className="stat-label">Kills:</span>
                    <span className="stat-value">{radiantPlayers.reduce((sum, p) => sum + (p.kills || 0), 0)}</span>
                  </div>
                </div>
              </div>

              <div className="vs">VS</div>

              <div className="team-side dire-side">
                <h3>Dire</h3>
                <div className="team-stats">
                  <div className="team-stat">
                    <span className="stat-label">Gold:</span>
                    <span className="stat-value">{match.dire_gold_adv?.[match.dire_gold_adv.length - 1]?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="team-stat">
                    <span className="stat-label">XP:</span>
                    <span className="stat-value">{match.dire_xp_adv?.[match.dire_xp_adv.length - 1]?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="team-stat">
                    <span className="stat-label">Kills:</span>
                    <span className="stat-value">{direPlayers.reduce((sum, p) => sum + (p.kills || 0), 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="additional-info">
              <h3>Match Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Match ID:</span>
                  <span className="info-value">{match.match_id}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Cluster:</span>
                  <span className="info-value">{match.cluster || 'Unknown'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Engine:</span>
                  <span className="info-value">{match.engine || 'Unknown'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Radiant Score:</span>
                  <span className="info-value">{match.radiant_score || 0}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Dire Score:</span>
                  <span className="info-value">{match.dire_score || 0}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Pre-game Duration:</span>
                  <span className="info-value">{match.pre_game_duration || 0}s</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="analysis-tab">
            <h3>Match Analysis</h3>

            <div className="analysis-card">
              <h4>Player Performance - KDA Comparison - Barchart </h4>
              <PlayerPerformanceChart players={match.players || []} />
            </div>

            <div className="analysis-card">
              <h4>Player Performance - KDA Comparison - RadarChart </h4>
              <PlayerPerformanceChartTwo players={match.players || []} />
            </div>


            <div className="analysis-card">
              <h4>Player Performance - KDA Comparison - RadarChart </h4>
              <PlayerComparison players={match.players || []} />
            </div>
            


            <div className="analysis-content">
              <div className="analysis-card">
                <h4>Gold Advantage</h4>
                <div className="advantage-chart">
                  {radiantGoldAdvantage.map((gold, index) => (
                    <div key={index} className="advantage-item">
                      <span className="time">{index * 5}m</span>
                      <span className={`gold-value ${gold >= 0 ? 'radiant' : 'dire'}`}>
                        {gold >= 0 ? '+' : ''}{gold.toLocaleString()}
                      </span>
                    </div>
                  )).slice(0, 10)}
                </div>
              </div>

              <div className="analysis-card">
                <h4>XP Advantage</h4>
                <div className="advantage-chart">
                  {radiantXpAdvantage.map((xp, index) => (
                    <div key={index} className="advantage-item">
                      <span className="time">{index * 5}m</span>
                      <span className={`xp-value ${xp >= 0 ? 'radiant' : 'dire'}`}>
                        {xp >= 0 ? '+' : ''}{xp.toLocaleString()}
                      </span>
                    </div>
                  )).slice(0, 10)}
                </div>
              </div>

              <div className="analysis-card">
                <h4>Match Insights</h4>
                <div className="insights">
                  <p><strong>Duration:</strong> {formatDuration(match.duration)}</p>
                  <p><strong>First Blood:</strong> {match.first_blood_time}s</p>
                  <p><strong>Radiant Victory:</strong> {match.radiant_win ? 'Yes' : 'No'}</p>
                  <p><strong>Total Kills:</strong> {match.players?.reduce((sum, p) => sum + (p.kills || 0), 0)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'players' && (
          <div className="players-tab">
            <h3>Player Statistics</h3>
            {playersLoading && <div className="loading-players">Loading player details...</div>}

            <div className="teams-players">
              <div className="team-players">
                <h4 className="team-title radiant-title">Radiant</h4>
                <div className="players-table">
                  <div className="table-header">
                    <span>Player</span>
                    <span>Hero</span>
                    <span>K/D/A</span>
                    <span>Net Worth</span>
                    <span>GPM</span>
                    <span>XPM</span>
                  </div>
                  {radiantPlayers.map(player => (
                    <div key={player.player_slot} className="table-row">
                      <span className="player-info">
                        <img
                          src={getPlayerAvatar(player.account_id)}
                          alt={getPlayerName(player.account_id)}
                          className="player-avatar"
                        />
                        {getPlayerName(player.account_id)}
                      </span>
                      <span className="hero-id">Hero {player.hero_id}</span>
                      <span className="kda">{getKDA(player)} ({getKDARatio(player)})</span>
                      <span className="net-worth">{getNetWorth(player)}</span>
                      <span className="gpm">{getGPM(player)}</span>
                      <span className="xpm">{getXPM(player)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="team-players">
                <h4 className="team-title dire-title">Dire</h4>
                <div className="players-table">
                  <div className="table-header">
                    <span>Player</span>
                    <span>Hero</span>
                    <span>K/D/A</span>
                    <span>Net Worth</span>
                    <span>GPM</span>
                    <span>XPM</span>
                  </div>
                  {direPlayers.map(player => (
                    <div key={player.player_slot} className="table-row">
                      <span className="player-info">
                        <img
                          src={getPlayerAvatar(player.account_id)}
                          alt={getPlayerName(player.account_id)}
                          className="player-avatar"
                        />
                        {getPlayerName(player.account_id)}
                      </span>
                      <span className="hero-id">Hero {player.hero_id}</span>
                      <span className="kda">{getKDA(player)} ({getKDARatio(player)})</span>
                      <span className="net-worth">{getNetWorth(player)}</span>
                      <span className="gpm">{getGPM(player)}</span>
                      <span className="xpm">{getXPM(player)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="detailed-stats">
              <h4>Detailed Statistics</h4>
              <div className="stats-grid">
                {match.players?.map(player => (
                  <div key={player.player_slot} className="player-detailed-stats">
                    <h5>{getPlayerName(player.account_id)} (Hero {player.hero_id})</h5>
                    <div className="stats-row">
                      <span>Hero Damage: {getHeroDamage(player)}</span>
                      <span>Tower Damage: {getTowerDamage(player)}</span>
                      <span>Hero Healing: {getHeroHealing(player)}</span>
                    </div>
                    <div className="stats-row">
                      <span>Last Hits: {getLastHits(player)}</span>
                      <span>Denies: {getDenies(player)}</span>
                      <span>Level: {player.level || 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="analysis-tab">
            <h3>Match Analysis</h3>
            <div className="analysis-content">
              <div className="analysis-card">
                <h4>Gold Advantage</h4>
                <div className="advantage-chart">
                  {radiantGoldAdvantage.map((gold, index) => (
                    <div key={index} className="advantage-item">
                      <span className="time">{index * 5}m</span>
                      <span className={`gold-value ${gold >= 0 ? 'radiant' : 'dire'}`}>
                        {gold >= 0 ? '+' : ''}{gold.toLocaleString()}
                      </span>
                    </div>
                  )).slice(0, 10)}
                </div>
              </div>

              <div className="analysis-card">
                <h4>XP Advantage</h4>
                <div className="advantage-chart">
                  {radiantXpAdvantage.map((xp, index) => (
                    <div key={index} className="advantage-item">
                      <span className="time">{index * 5}m</span>
                      <span className={`xp-value ${xp >= 0 ? 'radiant' : 'dire'}`}>
                        {xp >= 0 ? '+' : ''}{xp.toLocaleString()}
                      </span>
                    </div>
                  )).slice(0, 10)}
                </div>
              </div>

              <div className="analysis-card">
                <h4>Match Insights</h4>
                <div className="insights">
                  <p><strong>Duration:</strong> {formatDuration(match.duration)}</p>
                  <p><strong>First Blood:</strong> {match.first_blood_time}s</p>
                  <p><strong>Radiant Victory:</strong> {match.radiant_win ? 'Yes' : 'No'}</p>
                  <p><strong>Total Kills:</strong> {match.players?.reduce((sum, p) => sum + (p.kills || 0), 0)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'buildings' && (
          <div className="buildings-tab">
            <h3>Building Status</h3>
            <div className="buildings-content">
              <div className="building-status">
                <h4>Radiant Buildings</h4>
                <p>Tower Status: {match.tower_status_radiant || 'Unknown'}</p>
                <p>Barracks Status: {match.barracks_status_radiant || 'Unknown'}</p>
              </div>

              <div className="building-status">
                <h4>Dire Buildings</h4>
                <p>Tower Status: {match.tower_status_dire || 'Unknown'}</p>
                <p>Barracks Status: {match.barracks_status_dire || 'Unknown'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchProfile;