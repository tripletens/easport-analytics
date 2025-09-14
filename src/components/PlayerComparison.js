import React, { useState } from 'react';
import './PlayerComparison.css';

const PlayerComparison = ({ players }) => {
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [sortBy, setSortBy] = useState('kda'); // 'kda', 'kills', 'deaths', 'assists'

  // Calculate KDA ratio
  const calculateKDA = (player) => {
    const kills = player.kills || 0;
    const deaths = player.deaths || 0;
    const assists = player.assists || 0;
    
    if (deaths === 0) return kills + assists;
    return ((kills + assists) / deaths).toFixed(2);
  };

  // Toggle player selection
  const togglePlayerSelection = (player) => {
    if (selectedPlayers.some(p => p.player_slot === player.player_slot)) {
      setSelectedPlayers(selectedPlayers.filter(p => p.player_slot !== player.player_slot));
    } else {
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  // Select all players
  const selectAllPlayers = () => {
    setSelectedPlayers([...players]);
  };

  // Clear all selections
  const clearAllPlayers = () => {
    setSelectedPlayers([]);
  };

  // Sort players based on selected criteria
  const sortedPlayers = [...players].sort((a, b) => {
    switch(sortBy) {
      case 'kills':
        return (b.kills || 0) - (a.kills || 0);
      case 'deaths':
        return (a.deaths || 0) - (b.deaths || 0);
      case 'assists':
        return (b.assists || 0) - (a.assists || 0);
      case 'kda':
      default:
        return calculateKDA(b) - calculateKDA(a);
    }
  });

  // Get player team
  const getPlayerTeam = (player) => {
    return player.player_slot < 128 ? 'radiant' : 'dire';
  };

  return (
    <div className="kd-comparison">
      <div className="comparison-header">
        <h2>K/D/A Comparison</h2>
        <p>Select players to compare their Kill/Death/Assist ratios</p>
      </div>
      
      <div className="controls">
        <div className="sort-controls">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="kda">KDA Ratio</option>
            <option value="kills">Kills</option>
            <option value="deaths">Deaths (Lowest First)</option>
            <option value="assists">Assists</option>
          </select>
        </div>
        
        <div className="selection-actions">
          <button onClick={selectAllPlayers} className="action-btn">Select All</button>
          <button onClick={clearAllPlayers} className="action-btn">Clear All</button>
        </div>
      </div>
      
      <div className="comparison-content">
        <div className="players-list">
          <h3>Players</h3>
          <div className="players-container">
            {sortedPlayers.map(player => (
              <div 
                key={player.player_slot} 
                className={`player-item ${getPlayerTeam(player)} ${selectedPlayers.some(p => p.player_slot === player.player_slot) ? 'selected' : ''}`}
                onClick={() => togglePlayerSelection(player)}
              >
                <div className="player-header">
                  <span className="player-name">
                    Player {getPlayerTeam(player) === 'radiant' ? 'R' : 'D'}{player.player_slot % 128 + 1}
                  </span>
                  <span className="kda-ratio">{calculateKDA(player)}</span>
                </div>
                <div className="kda-stats">
                  <div className="stat">
                    <span className="stat-label">Kills</span>
                    <span className="stat-value">{player.kills || 0}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Deaths</span>
                    <span className="stat-value">{player.deaths || 0}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Assists</span>
                    <span className="stat-value">{player.assists || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="visualization">
          <h3>Comparison</h3>
          {selectedPlayers.length === 0 ? (
            <div className="no-selection">
              <p>Select players to compare their K/D/A stats</p>
            </div>
          ) : (
            <div className="bars-container">
              {selectedPlayers.map(player => (
                <div key={player.player_slot} className="player-bars">
                  <div className="player-label">
                    <span className="player-color-indicator" data-team={getPlayerTeam(player)}></span>
                    Player {getPlayerTeam(player) === 'radiant' ? 'R' : 'D'}{player.player_slot % 128 + 1}
                    <span className="kda-score">{calculateKDA(player)} KDA</span>
                  </div>
                  <div className="stat-bars">
                    <div className="stat-bar">
                      <div className="bar-label">Kills</div>
                      <div className="bar-container">
                        <div 
                          className="bar kills-bar" 
                          style={{ width: `${((player.kills || 0) / Math.max(1, Math.max(...selectedPlayers.map(p => p.kills || 0)))) * 100}%` }}
                        >
                          <span className="bar-value">{player.kills || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="stat-bar">
                      <div className="bar-label">Deaths</div>
                      <div className="bar-container">
                        <div 
                          className="bar deaths-bar" 
                          style={{ width: `${((player.deaths || 0) / Math.max(1, Math.max(...selectedPlayers.map(p => p.deaths || 0)))) * 100}%` }}
                        >
                          <span className="bar-value">{player.deaths || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="stat-bar">
                      <div className="bar-label">Assists</div>
                      <div className="bar-container">
                        <div 
                          className="bar assists-bar" 
                          style={{ width: `${((player.assists || 0) / Math.max(1, Math.max(...selectedPlayers.map(p => p.assists || 0)))) * 100}%` }}
                        >
                          <span className="bar-value">{player.assists || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerComparison;