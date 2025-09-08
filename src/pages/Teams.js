import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProTeams } from '../services/opendota.api';
import { getCountryName } from '../utils/countries';
import './Teams.css';

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    country: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const teamsPerPage = 20;

  useEffect(() => {
    fetchProTeams();
  }, []);

  useEffect(() => {
    filterAndSortTeams();
  }, [teams, filters, searchTerm]);

  const fetchProTeams = async () => {
    try {
      setLoading(true);
      const proTeams = await getProTeams();
      setTeams(proTeams);
      setFilteredTeams(proTeams);
    } catch (err) {
      setError('Failed to fetch teams. Please try again later.');
      console.error('Error fetching pro teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortTeams = () => {
    let result = [...teams];

    // Apply search filter
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      result = result.filter(team => {
        const name = team?.name || '';
        const tag = team?.tag || '';
        return (
          name.toLowerCase().includes(searchTermLower) ||
          tag.toLowerCase().includes(searchTermLower)
        );
      });
    }

    // Apply country filter
    if (filters.country) {
      const countryFilterLower = filters.country.toLowerCase();
      result = result.filter(team => {
        const countryCode = team?.country_code || '';
        const teamCountryName = getCountryName(countryCode) || '';
        return teamCountryName.toLowerCase() === countryFilterLower;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue, bValue;

      switch (filters.sortBy) {
        case 'name':
          aValue = a?.name || '';
          bValue = b?.name || '';
          break;
        case 'tag':
          aValue = a?.tag || '';
          bValue = b?.tag || '';
          break;
        case 'country':
          aValue = getCountryName(a?.country_code) || '';
          bValue = getCountryName(b?.country_code) || '';
          break;
        case 'rating':
          aValue = a?.rating || 0;
          bValue = b?.rating || 0;
          break;
        case 'wins':
          aValue = a?.wins || 0;
          bValue = b?.wins || 0;
          break;
        case 'losses':
          aValue = a?.losses || 0;
          bValue = b?.losses || 0;
          break;
        default:
          aValue = a?.name || '';
          bValue = b?.name || '';
      }

      // Handle string comparison safely
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    setFilteredTeams(result);
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
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
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Get unique values for filters
  const countryOptions = [...new Set(
    teams
      .map(team => team?.country_code)
      .filter(code => code && code.trim() !== '')
  )].sort();

  // Calculate win rates
  const calculateWinRate = (team) => {
    const wins = team.wins || 0;
    const losses = team.losses || 0;
    const total = wins + losses;
    return total > 0 ? ((wins / total) * 100).toFixed(1) : 0;
  };

  // Pagination logic
  const indexOfLastTeam = currentPage * teamsPerPage;
  const indexOfFirstTeam = indexOfLastTeam - teamsPerPage;
  const currentTeams = filteredTeams.slice(indexOfFirstTeam, indexOfLastTeam);
  const totalPages = Math.ceil(filteredTeams.length / teamsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <div className="loading">Loading teams...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="teams-page">
      <div className="page-header">
        <h1>Professional Teams</h1>
        <p>Browse and discover professional Dota 2 teams from around the world</p>
      </div>

      {/* Filters and Search */}
      <div className="filters-section card">
        <div className="filters-grid">
          <div className="search-filter">
            <label>Search Teams</label>
            <input
              type="text"
              placeholder="Search by name or tag..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <label>Country</label>
            <select
              value={filters.country}
              onChange={(e) => handleFilterChange('country', e.target.value)}
            >
              <option value="">All Countries</option>
              {countryOptions.map(countryCode => (
                <option key={countryCode} value={getCountryName(countryCode)}>
                  {getCountryName(countryCode)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        <span>
          Showing {currentTeams.length} of {filteredTeams.length} teams
          {searchTerm && ` for "${searchTerm}"`}
        </span>
        
        <div className="sort-options">
          <span>Sort by: </span>
          <button
            className={`sort-btn ${filters.sortBy === 'name' ? 'active' : ''}`}
            onClick={() => handleSortChange('name')}
          >
            Name {filters.sortBy === 'name' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            className={`sort-btn ${filters.sortBy === 'tag' ? 'active' : ''}`}
            onClick={() => handleSortChange('tag')}
          >
            Tag {filters.sortBy === 'tag' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            className={`sort-btn ${filters.sortBy === 'rating' ? 'active' : ''}`}
            onClick={() => handleSortChange('rating')}
          >
            Rating {filters.sortBy === 'rating' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="teams-grid">
        {currentTeams.length > 0 ? (
          currentTeams.map(team => (
            <div key={team.team_id} className="team-card">
              <div className="team-header">
                <div className="team-logo">
                  {team.logo_url ? (
                    <img 
                      src={team.logo_url} 
                      alt={team.name}
                      onError={(e) => {
                        e.target.src = '/images/team_icon.png';
                      }}
                    />
                  ) : (
                    <div className="team-icon">🏆</div>
                  )}
                </div>
                
                <div className="team-info">
                  <h3 className="team-name">{team.name || 'Unknown Team'}</h3>
                  <p className="team-tag">{team.tag || 'No tag'}</p>
                  
                  {team.country_code && (
                    <p className="team-country">
                      <span className="flag">🏳️</span>
                      {getCountryName(team.country_code)}
                    </p>
                  )}
                </div>
              </div>

              <div className="team-stats">
                <div className="stat-row">
                  <span className="stat-label">Rating:</span>
                  <span className="stat-value">{team.rating || 'N/A'}</span>
                </div>
                
                <div className="stat-row">
                  <span className="stat-label">Wins:</span>
                  <span className="stat-value wins">{team.wins || 0}</span>
                </div>
                
                <div className="stat-row">
                  <span className="stat-label">Losses:</span>
                  <span className="stat-value losses">{team.losses || 0}</span>
                </div>
                
                <div className="stat-row">
                  <span className="stat-label">Win Rate:</span>
                  <span className="stat-value win-rate">
                    {calculateWinRate(team)}%
                  </span>
                </div>
              </div>

              <div className="team-actions">
                <Link to={`/team/${team.team_id}`} className="view-team-btn">
                  View Team Details
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <p>No teams found matching your criteria.</p>
            <button onClick={() => {
              setSearchTerm('');
              setFilters({
                country: '',
                sortBy: 'name',
                sortOrder: 'asc'
              });
            }}>
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Pagination */}
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

export default Teams;