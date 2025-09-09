import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProMatches, getPublicMatches, getMatchDetails } from '../services/opendota.api';
import { getCountryName } from '../utils/countries';
import './Matches.css';

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    matchType: 'pro',
    league: '',
    region: '',
    skill: '',
    sortBy: 'start_time',
    sortOrder: 'desc'
  });
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matchDetails, setMatchDetails] = useState({});
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const matchesPerPage = 20;

  useEffect(() => {
    fetchMatches();
  }, [filters.matchType]);

  useEffect(() => {
    filterAndSortMatches();
  }, [matches, filters]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      let matchesData;
      
      if (filters.matchType === 'pro') {
        matchesData = await getProMatches(100); 
      } else {
        matchesData = await getPublicMatches(100);
      }
      
      setMatches(matchesData);
      setFilteredMatches(matchesData);
    } catch (err) {
      setError('Failed to fetch matches. Please try again later.');
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchDetails = async (matchId) => {
    if (matchDetails[matchId]) {
      setSelectedMatch(matchId);
      return;
    }

    try {
      setDetailsLoading(true);
      const details = await getMatchDetails(matchId);
      setMatchDetails(prev => ({ ...prev, [matchId]: details }));
      setSelectedMatch(matchId);
    } catch (err) {
      console.error('Error fetching match details:', err);
      setSelectedMatch(matchId); 
    } finally {
      setDetailsLoading(false);
    }
  };

  const filterAndSortMatches = () => {
    let result = [...matches];

    if (filters.league) {
      result = result.filter(match => 
        match.league_name?.toLowerCase().includes(filters.league.toLowerCase()) ||
        match.leagueid?.toString() === filters.league
      );
    }

    if (filters.region && filters.matchType === 'public') {
      result = result.filter(match => match.region?.toString() === filters.region);
    }

    if (filters.skill && filters.matchType === 'public') {
      result = result.filter(match => match.skill?.toString() === filters.skill);
    }

    result.sort((a, b) => {
      let aValue, bValue;

      switch (filters.sortBy) {
        case 'start_time':
          aValue = a.start_time || 0;
          bValue = b.start_time || 0;
          break;
        case 'duration':
          aValue = a.duration || 0;
          bValue = b.duration || 0;
          break;
        case 'league':
          aValue = a.league_name || '';
          bValue = b.league_name || '';
          break;
        case 'match_id':
          aValue = a.match_id || 0;
          bValue = b.match_id || 0;
          break;
        default:
          aValue = a.start_time || 0;
          bValue = b.start_time || 0;
      }

      if (filters.sortOrder === 'desc') {
        return bValue - aValue; 
      } else {
        return aValue - bValue; 
      }
    });

    setFilteredMatches(result);
    setCurrentPage(1);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleSortChange = (sortBy) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc'
    }));
  };

  const uniqueLeagues = [...new Set(
    matches
      .map(match => match.league_name)
      .filter(name => name && name.trim() !== '')
  )].sort();

  const regions = [
    { value: '1', label: 'US West' },
    { value: '2', label: 'US East' },
    { value: '3', label: 'Europe West' },
    { value: '5', label: 'Singapore' },
    { value: '6', label: 'Dubai' },
    { value: '7', label: 'Australia' },
    { value: '8', label: 'Stockholm' },
    { value: '9', label: 'Austria' },
    { value: '10', label: 'Brazil' },
    { value: '11', label: 'South Africa' },
    { value: '12', label: 'Perfect World Telecom' },
    { value: '13', label: 'Perfect World Unicom' },
    { value: '14', label: 'Chile' },
    { value: '15', label: 'Peru' },
    { value: '16', label: 'India' },
    { value: '17', label: 'Japan' },
  ];

  const skills = [
    { value: '1', label: 'Normal' },
    { value: '2', label: 'High' },
    { value: '3', label: 'Very High' },
  ];

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

  const indexOfLastMatch = currentPage * matchesPerPage;
  const indexOfFirstMatch = indexOfLastMatch - matchesPerPage;
  const currentMatches = filteredMatches.slice(indexOfFirstMatch, indexOfLastMatch);
  const totalPages = Math.ceil(filteredMatches.length / matchesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <div className="loading">Loading matches...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="matches-page">
      <div className="page-header">
        <h1>Dota 2 Matches</h1>
        <p>Browse and analyze recent professional and public matches</p>
      </div>

      <div className="filters-section card">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Match Type</label>
            <select
              value={filters.matchType}
              onChange={(e) => handleFilterChange('matchType', e.target.value)}
            >
              <option value="pro">Professional Matches</option>
              <option value="public">Public Matches</option>
            </select>
          </div>

          {filters.matchType === 'pro' && (
            <div className="filter-group">
              <label>League</label>
              <select
                value={filters.league}
                onChange={(e) => handleFilterChange('league', e.target.value)}
              >
                <option value="">All Leagues</option>
                {uniqueLeagues.map(league => (
                  <option key={league} value={league}>{league}</option>
                ))}
              </select>
            </div>
          )}

          {filters.matchType === 'public' && (
            <>
              {/* <div className="filter-group">
                <label>Region</label>
                <select
                  value={filters.region}
                  onChange={(e) => handleFilterChange('region', e.target.value)}
                >
                  <option value="">All Regions</option>
                  {regions.map(region => (
                    <option key={region.value} value={region.value}>{region.label}</option>
                  ))}
                </select>
              </div> */}

              {/* <div className="filter-group">
                <label>Skill Level</label>
                <select
                  value={filters.skill}
                  onChange={(e) => handleFilterChange('skill', e.target.value)}
                >
                  <option value="">All Skills</option>
                  {skills.map(skill => (
                    <option key={skill.value} value={skill.value}>{skill.label}</option>
                  ))}
                </select>
              </div> */}
            </>
          )}
        </div>
      </div>

      <div className="results-summary">
        <span>
          Showing {currentMatches.length} of {filteredMatches.length} matches
          {filters.matchType === 'pro' ? ' (Professional)' : ' (Public)'}
        </span>
        
        <div className="sort-options">
          <span>Sort by: </span>
          <button
            className={`sort-btn ${filters.sortBy === 'start_time' ? 'active' : ''}`}
            onClick={() => handleSortChange('start_time')}
          >
            Date {filters.sortBy === 'start_time' && (filters.sortOrder === 'desc' ? '↓' : '↑')}
          </button>
          <button
            className={`sort-btn ${filters.sortBy === 'duration' ? 'active' : ''}`}
            onClick={() => handleSortChange('duration')}
          >
            Duration {filters.sortBy === 'duration' && (filters.sortOrder === 'desc' ? '↓' : '↑')}
          </button>
          {filters.matchType === 'pro' && (
            <button
              className={`sort-btn ${filters.sortBy === 'league' ? 'active' : ''}`}
              onClick={() => handleSortChange('league')}
            >
              League {filters.sortBy === 'league' && (filters.sortOrder === 'desc' ? '↓' : '↑')}
            </button>
          )}
        </div>
      </div>

      {/* Matches List */}
      <div className="matches-list">
        {currentMatches.length > 0 ? (
          currentMatches.map(match => (
            <div key={match.match_id} className="match-card">
              <div className="match-header">
                <div className="match-info">
                  <h3 className="match-id">Match #{match.match_id}</h3>
                  {match.league_name && (
                    <p className="league-name">{match.league_name}</p>
                  )}
                  <p className="match-time">
                    {formatDate(match.start_time)} at {formatTime(match.start_time)}
                  </p>
                </div>
                
                <div className="match-result">
                  <span className="duration">{formatDuration(match.duration)}</span>
                  {match.radiant_win !== undefined && (
                    <span className={`result ${match.radiant_win ? 'radiant-win' : 'dire-win'}`}>
                      {match.radiant_win ? 'Radiant Victory' : 'Dire Victory'}
                    </span>
                  )}
                </div>
              </div>

              <div className="match-teams">
                <div className="team radiant">
                  <h4>Radiant</h4>
                  {match.radiant_name && <p className="team-name">{match.radiant_name}</p>}
                  {match.radiant_team_id && <p className="team-id">ID: {match.radiant_team_id}</p>}
                </div>
                
                <div className="vs">VS</div>
                
                <div className="team dire">
                  <h4>Dire</h4>
                  {match.dire_name && <p className="team-name">{match.dire_name}</p>}
                  {match.dire_team_id && <p className="team-id">ID: {match.dire_team_id}</p>}
                </div>
              </div>

              <div className="match-actions">
                <button
                  onClick={() => fetchMatchDetails(match.match_id)}
                  className="view-details-btn"
                  disabled={detailsLoading}
                >
                  {detailsLoading && selectedMatch === match.match_id ? 'Loading...' : 'View Details'}
                </button>
                
                {selectedMatch === match.match_id && matchDetails[match.match_id] && (
                  <div className="match-details-preview">
                    <h4>Match Details</h4>
                    <div className="details-grid">
                      <div className="detail-item">
                        <span className="label">Game Mode:</span>
                        <span className="value">{matchDetails[match.match_id].game_mode || 'Unknown'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Lobby Type:</span>
                        <span className="value">{matchDetails[match.match_id].lobby_type || 'Unknown'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">First Blood:</span>
                        <span className="value">{matchDetails[match.match_id].first_blood_time || 'N/A'}s</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Players:</span>
                        <span className="value">{matchDetails[match.match_id].players?.length || 0}/10</span>
                      </div>
                    </div>
                    
                    <Link to={`/match/${match.match_id}`} className="full-details-link">
                      View Full Match Analysis →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-matches">
            <p>No matches found matching your criteria.</p>
            <button onClick={() => {
              setFilters({
                matchType: 'pro',
                league: '',
                region: '',
                skill: '',
                sortBy: 'start_time',
                sortOrder: 'desc'
              });
            }}>
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
            return page <= totalPages ? (
              <button
                key={page}
                onClick={() => paginate(page)}
                className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
              >
                {page}
              </button>
            ) : null;
          })}
          
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Matches;