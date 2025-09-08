import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProPlayers, getProMatches, getHeroStats } from '../services/opendota.api';
import { getCountryName } from '../utils/countries';
import './Analytics.css';

const Analytics = () => {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30'); // days
  const [selectedMetric, setSelectedMetric] = useState('win_rate');

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        const [playersData, matchesData, heroesData] = await Promise.all([
          getProPlayers(),
          getProMatches(100),
          getHeroStats()
        ]);
        
        console.log('Analytics Data:', { players: playersData, matches: matchesData, heroes: heroesData });
        
        setPlayers(playersData);
        setMatches(matchesData);
        setHeroes(heroesData);
      } catch (err) {
        setError('Failed to fetch analytics data. Please try again later.');
        console.error('Error fetching analytics data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  // Calculate analytics metrics
  const calculateWinRates = () => {
    const teamWinRates = {};
    matches.forEach(match => {
      if (match.radiant_name && match.dire_name) {
        const winner = match.radiant_win ? match.radiant_name : match.dire_name;
        const loser = match.radiant_win ? match.dire_name : match.radiant_name;
        
        teamWinRates[winner] = teamWinRates[winner] || { wins: 0, losses: 0 };
        teamWinRates[loser] = teamWinRates[loser] || { wins: 0, losses: 0 };
        
        teamWinRates[winner].wins += 1;
        teamWinRates[loser].losses += 1;
      }
    });

    return Object.entries(teamWinRates)
      .map(([team, stats]) => ({
        team,
        winRate: ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1),
        totalMatches: stats.wins + stats.losses
      }))
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 10);
  };

  const calculatePlayerStats = () => {
    return players
      .filter(player => player.is_current_team_member)
      .sort((a, b) => {
        // Sort by different metrics based on selection
        switch (selectedMetric) {
          case 'win_rate':
            const aWinRate = ((a.wins || 0) / ((a.wins || 0) + (a.losses || 0))) * 100 || 0;
            const bWinRate = ((b.wins || 0) / ((b.wins || 0) + (b.losses || 0))) * 100 || 0;
            return bWinRate - aWinRate;
          case 'rating':
            return (b.rating || 0) - (a.rating || 0);
          case 'matches':
            return ((b.wins || 0) + (b.losses || 0)) - ((a.wins || 0) + (a.losses || 0));
          default:
            return 0;
        }
      })
      .slice(0, 15);
  };

  const calculateHeroStats = () => {
    return heroes
      .filter(hero => hero.pro_pick || hero.pro_win)
      .map(hero => ({
        id: hero.id,
        name: hero.localized_name || `Hero ${hero.id}`,
        pickRate: ((hero.pro_pick / hero.pro_pick) * 100).toFixed(1),
        winRate: ((hero.pro_win / hero.pro_pick) * 100).toFixed(1),
        totalPicks: hero.pro_pick
      }))
      .sort((a, b) => b.totalPicks - a.totalPicks)
      .slice(0, 10);
  };

  const calculateRegionStats = () => {
    const regionStats = {};
    players.forEach(player => {
      if (player.country_code) {
        const country = getCountryName(player.country_code);
        regionStats[country] = regionStats[country] || { players: 0, teams: new Set() };
        regionStats[country].players += 1;
        if (player.team_name) {
          regionStats[country].teams.add(player.team_name);
        }
      }
    });

    return Object.entries(regionStats)
      .map(([country, stats]) => ({
        country,
        playerCount: stats.players,
        teamCount: stats.teams.size
      }))
      .sort((a, b) => b.playerCount - a.playerCount)
      .slice(0, 10);
  };

  const getMatchTrends = () => {
    // Group matches by date
    const matchesByDate = {};
    matches.forEach(match => {
      if (match.start_time) {
        const date = new Date(match.start_time * 1000).toLocaleDateString();
        matchesByDate[date] = (matchesByDate[date] || 0) + 1;
      }
    });

    return Object.entries(matchesByDate)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .slice(-7); // Last 7 days
  };

  if (loading) return <div className="loading">Loading analytics...</div>;
  if (error) return <div className="error">{error}</div>;

  const topTeams = calculateWinRates();
  const topPlayers = calculatePlayerStats();
  const popularHeroes = calculateHeroStats();
  const regionStats = calculateRegionStats();
  const matchTrends = getMatchTrends();

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h1>eSports Analytics</h1>
        <p>Advanced insights and data visualizations for Dota 2 professional scene</p>
      </div>

      {/* Time Range Filter */}
      <div className="filters-section card">
        <div className="filters-row">
          <div className="filter-group">
            <label>Time Range</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Player Metric</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
            >
              <option value="win_rate">Win Rate</option>
              <option value="rating">Rating</option>
              <option value="matches">Total Matches</option>
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="analytics-tabs">
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
          Players
        </button>
        <button 
          className={`tab-button ${activeTab === 'teams' ? 'active' : ''}`}
          onClick={() => setActiveTab('teams')}
        >
          Teams
        </button>
        <button 
          className={`tab-button ${activeTab === 'heroes' ? 'active' : ''}`}
          onClick={() => setActiveTab('heroes')}
        >
          Heroes
        </button>
        <button 
          className={`tab-button ${activeTab === 'regions' ? 'active' : ''}`}
          onClick={() => setActiveTab('regions')}
        >
          Regions
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="overview-grid">
              {/* Summary Cards */}
              <div className="summary-card">
                <h3>Total Players</h3>
                <div className="summary-value">{players.length}</div>
                <div className="summary-label">Professional players tracked</div>
              </div>

              <div className="summary-card">
                <h3>Total Matches</h3>
                <div className="summary-value">{matches.length}</div>
                <div className="summary-label">Matches analyzed</div>
              </div>

              <div className="summary-card">
                <h3>Total Heroes</h3>
                <div className="summary-value">{heroes.length}</div>
                <div className="summary-label">Heroes in meta</div>
              </div>

              <div className="summary-card">
                <h3>Active Teams</h3>
                <div className="summary-value">
                  {new Set(players.map(p => p.team_name).filter(Boolean)).size}
                </div>
                <div className="summary-label">Professional teams</div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="charts-section">
              <div className="chart-card">
                <h3>Top Teams by Win Rate</h3>
                <div className="chart-content">
                  {topTeams.map((team, index) => (
                    <div key={team.team} className="chart-item">
                      <span className="rank">#{index + 1}</span>
                      <span className="label">{team.team}</span>
                      <div className="bar-container">
                        <div 
                          className="bar" 
                          style={{ width: `${team.winRate}%` }}
                        ></div>
                      </div>
                      <span className="value">{team.winRate}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-card">
                <h3>Match Trends (Last 7 Days)</h3>
                <div className="chart-content">
                  {matchTrends.map(([date, count]) => (
                    <div key={date} className="chart-item">
                      <span className="label">{date}</span>
                      <div className="bar-container">
                        <div 
                          className="bar" 
                          style={{ width: `${(count / Math.max(...matchTrends.map(([, c]) => c))) * 100}%` }}
                        ></div>
                      </div>
                      <span className="value">{count} matches</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="quick-stats">
              <div className="stats-card">
                <h3>Most Picked Heroes</h3>
                <div className="stats-list">
                  {popularHeroes.slice(0, 5).map(hero => (
                    <div key={hero.id} className="stat-item">
                      <span className="name">{hero.name}</span>
                      <span className="count">{hero.totalPicks} picks</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="stats-card">
                <h3>Top Regions</h3>
                <div className="stats-list">
                  {regionStats.slice(0, 5).map(region => (
                    <div key={region.country} className="stat-item">
                      <span className="name">{region.country}</span>
                      <span className="count">{region.playerCount} players</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'players' && (
          <div className="players-tab">
            <h2>Player Analytics</h2>
            <div className="players-table">
              <div className="table-header">
                <span>Rank</span>
                <span>Player</span>
                <span>Team</span>
                <span>Win Rate</span>
                <span>Rating</span>
                <span>Matches</span>
              </div>
              {topPlayers.map((player, index) => (
                <div key={player.account_id} className="table-row">
                  <span className="rank">#{index + 1}</span>
                  <span className="player-name">
                    <Link to={`/player/${player.account_id}`}>
                      {player.name || player.personaname}
                    </Link>
                  </span>
                  <span className="team">{player.team_name || 'Free Agent'}</span>
                  <span className="win-rate">
                    {((player.wins || 0) / ((player.wins || 0) + (player.losses || 0)) * 100 || 0).toFixed(1)}%
                  </span>
                  <span className="rating">{player.rating || 'N/A'}</span>
                  <span className="matches">{(player.wins || 0) + (player.losses || 0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="teams-tab">
            <h2>Team Performance</h2>
            <div className="teams-grid">
              {topTeams.map((team, index) => (
                <div key={team.team} className="team-card">
                  <div className="team-header">
                    <h3>#{index + 1} {team.team}</h3>
                    <span className="win-rate">{team.winRate}% Win Rate</span>
                  </div>
                  <div className="team-stats">
                    <div className="stat">
                      <span className="label">Total Matches:</span>
                      <span className="value">{team.totalMatches}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Win Rate:</span>
                      <span className="value">{team.winRate}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'heroes' && (
          <div className="heroes-tab">
            <h2>Hero Meta Analysis</h2>
            <div className="heroes-table">
              <div className="table-header">
                <span>Hero</span>
                <span>Pick Rate</span>
                <span>Win Rate</span>
                <span>Total Picks</span>
              </div>
              {popularHeroes.map(hero => (
                <div key={hero.id} className="table-row">
                  <span className="hero-name">{hero.name}</span>
                  <span className="pick-rate">{hero.pickRate}%</span>
                  <span className="win-rate">{hero.winRate}%</span>
                  <span className="total-picks">{hero.totalPicks}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'regions' && (
          <div className="regions-tab">
            <h2>Regional Analysis</h2>
            <div className="regions-grid">
              {regionStats.map((region, index) => (
                <div key={region.country} className="region-card">
                  <div className="region-header">
                    <h3>#{index + 1} {region.country}</h3>
                  </div>
                  <div className="region-stats">
                    <div className="stat">
                      <span className="label">Players:</span>
                      <span className="value">{region.playerCount}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Teams:</span>
                      <span className="value">{region.teamCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;