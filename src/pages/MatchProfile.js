import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMatchDetails, getPlayerData } from '../services/opendota.api';
import { getCountryName } from '../utils/countries';
import './MatchProfile.css';
import PlayerPerformanceChart from '../components/PlayerPerformanceChart';
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

   // Add the PlayerPerformanceChart component here
  const PlayerPerformanceChart = ({ players, width = 800, height = 500 }) => {
    const svgRef = React.useRef();

    React.useEffect(() => {
      if (!players || players.length === 0) return;

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      // Set up margins and dimensions
      const margin = { top: 50, right: 30, bottom: 100, left: 80 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      // Prepare data - calculate KDA ratio for each player
      const playerData = players.map(player => ({
        name: player.personaname || `Player ${player.account_id}`,
        hero_id: player.hero_id,
        kills: player.kills || 0,
        deaths: player.deaths || 0,
        assists: player.assists || 0,
        kda: player.deaths === 0 ? (player.kills + player.assists) : ((player.kills + player.assists) / player.deaths).toFixed(2),
        isRadiant: player.isRadiant,
        win: player.win === 1,
        net_worth: player.net_worth || 0,
        hero_damage: player.hero_damage || 0,
        gold_per_min: player.gold_per_min || 0
      }));

      // Sort players by KDA (descending)
      playerData.sort((a, b) => b.kda - a.kda);

      // Create scales
      const xScale = d3.scaleBand()
        .domain(playerData.map(d => d.name))
        .range([0, innerWidth])
        .padding(0.3);

      const maxKDA = d3.max(playerData, d => parseFloat(d.kda));
      const yScale = d3.scaleLinear()
        .domain([0, maxKDA * 1.1])
        .range([innerHeight, 0])
        .nice();

      // Create SVG group
      const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Add x-axis
      const xAxis = g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale));

      // Rotate x-axis labels for better readability
      xAxis.selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)")
        .style("font-size", "10px")
        .style("fill", "#666");

      // Add y-axis
      g.append("g")
        .call(d3.axisLeft(yScale).ticks(6))
        .style("font-size", "10px")
        .style("color", "#666");

      // Add y-axis label
      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -innerHeight / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "#2c3e50")
        .style("font-weight", "600")
        .text("KDA Ratio");

      // Add chart title
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", 25)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .style("fill", "#2c3e50")
        .text("Player Performance - KDA Ratio");

      // Add grid lines
      g.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(yScale)
          .ticks(6)
          .tickSize(-innerWidth)
          .tickFormat("")
        )
        .style("color", "#e1e8ed")
        .style("opacity", 0.7);

      // Add bars with different colors for Radiant and Dire
      const bars = g.selectAll(".bar")
        .data(playerData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.name))
        .attr("y", d => yScale(d.kda))
        .attr("width", xScale.bandwidth())
        .attr("height", d => innerHeight - yScale(d.kda))
        .attr("fill", d => d.isRadiant ? "#4CAF50" : "#F44336") // Green for Radiant, Red for Dire
        .attr("rx", 4)
        .attr("ry", 4)
        .style("cursor", "pointer")
        .style("transition", "fill 0.2s ease");

      // Add value labels on top of bars
      g.selectAll(".bar-label")
        .data(playerData)
        .enter().append("text")
        .attr("class", "bar-label")
        .attr("x", d => xScale(d.name) + xScale.bandwidth() / 2)
        .attr("y", d => yScale(d.kda) - 8)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("font-weight", "600")
        .style("fill", "#2c3e50")
        .style("pointer-events", "none")
        .text(d => d.kda);

      // Add team indicators
      g.append("text")
        .attr("x", innerWidth / 4)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "600")
        .style("fill", "#4CAF50")
        .text("Radiant (Winners)");

      g.append("text")
        .attr("x", (3 * innerWidth) / 4)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "600")
        .style("fill", "#F44336")
        .text("Dire (Losers)");

      // Add hover effects with detailed tooltip
      const tooltip = d3.select("body")
        .append("div")
        .attr("class", "d3-tooltip")
        .style("position", "absolute")
        .style("background", "white")
        .style("padding", "10px 14px")
        .style("border", "1px solid #ddd")
        .style("border-radius", "6px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("box-shadow", "0 4px 12px rgba(0,0,0,0.15)")
        .style("z-index", "1000")
        .style("min-width", "180px");

      bars.on("mouseover", function(event, d) {
          // Highlight bar
          d3.select(this)
            .attr("stroke", "#2c3e50")
            .attr("stroke-width", 2);

          // Calculate tooltip content
          const tooltipContent = `
            <div style="margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 6px;">
              <strong style="color: #2c3e50; font-size: 13px;">${d.name}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 15px; margin: 4px 0;">
              <span style="color: #7f8c8d;">Team:</span>
              <span style="font-weight: 600; color: ${d.isRadiant ? '#4CAF50' : '#F44336'};">${d.isRadiant ? 'Radiant' : 'Dire'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 15px; margin: 4px 0;">
              <span style="color: #7f8c8d;">Result:</span>
              <span style="font-weight: 600; color: ${d.win ? '#27ae60' : '#e74c3c'};">${d.win ? 'Victory' : 'Defeat'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 15px; margin: 4px 0;">
              <span style="color: #7f8c8d;">K/D/A:</span>
              <span style="font-weight: 600; color: #667eea;">${d.kills}/${d.deaths}/${d.assists}</span>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 15px; margin: 4px 0;">
              <span style="color: #7f8c8d;">Net Worth:</span>
              <span style="font-weight: 600; color: #27ae60;">${d.net_worth.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 15px; margin: 4px 0;">
              <span style="color: #7f8c8d;">GPM:</span>
              <span style="font-weight: 600; color: #f39c12;">${d.gold_per_min}</span>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 15px; margin: 4px 0;">
              <span style="color: #7f8c8d;">Hero Damage:</span>
              <span style="font-weight: 600; color: #e74c3c;">${d.hero_damage.toLocaleString()}</span>
            </div>
          `;

          // Show tooltip
          tooltip
            .html(tooltipContent)
            .style("opacity", 1)
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mousemove", function(event) {
          tooltip
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
          // Reset bar style
          d3.select(this)
            .attr("stroke", "none")
            .attr("stroke-width", 0);

          // Hide tooltip
          tooltip.style("opacity", 0);
        });

    }, [players, width, height]);

    return (
      <div className="player-performance-chart">
        <svg 
          ref={svgRef} 
          width={width} 
          height={height}
          style={{ display: 'block', margin: '0 auto' }}
        ></svg>
      </div>
    );
  };

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

            {/* Add the Player Performance Chart here */}
            <div className="analysis-card">
              <h4>Player Performance - KDA Comparison</h4>
              <PlayerPerformanceChart players={match.players || []} />
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