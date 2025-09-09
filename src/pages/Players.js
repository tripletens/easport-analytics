import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProPlayers, searchPlayers } from '../services/opendota.api';
import { getCountryName, getCountryOptions } from '../utils/countries';
import './Players.css';
import ErrorBoundary from '../components/ErrorBoundary';

const Players = () => {
    const [players, setPlayers] = useState([]);
    const [filteredPlayers, setFilteredPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        team: '',
        country: '', 
        role: '',
        sortBy: 'name',
        sortOrder: 'asc'
    });

    const [currentPage, setCurrentPage] = useState(1);
    const playersPerPage = 20;

    useEffect(() => {
        fetchProPlayers();
    }, []);

    useEffect(() => {
        filterAndSortPlayers();
    }, [players, filters, searchTerm]);

    const fetchProPlayers = async () => {
        try {
            setLoading(true);
            const proPlayers = await getProPlayers();
            setPlayers(proPlayers);
            setFilteredPlayers(proPlayers);
        } catch (err) {
            setError('Failed to fetch players. Please try again later.');
            console.error('Error fetching pro players:', err);
        } finally {
            setLoading(false);
        }
    };

    const filterAndSortPlayers = () => {
        let result = [...players];

        if (searchTerm) {
            const searchTermLower = searchTerm.toLowerCase();
            result = result.filter(player => {
                const name = player?.name || player?.personaname || '';
                return name.toLowerCase().includes(searchTermLower);
            });
        }

        if (filters.team) {
            const teamFilterLower = filters.team.toLowerCase();
            result = result.filter(player => {
                const teamName = player?.team_name || '';
                return teamName.toLowerCase().includes(teamFilterLower);
            });
        }

        if (filters.country) {
            const countryFilterLower = filters.country.toLowerCase();
            result = result.filter(player => {
                const countryCode = player?.country_code || '';
                const playerCountryName = getCountryName(countryCode) || '';
                return playerCountryName.toLowerCase() === countryFilterLower;
            });
        }

        if (filters.role) {
            result = result.filter(player => {
                const role = player?.fantasy_role?.toString() || '';
                return role === filters.role;
            });
        }

        result.sort((a, b) => {
            let aValue, bValue;

            switch (filters.sortBy) {
                case 'name':
                    aValue = a?.name || a?.personaname || '';
                    bValue = b?.name || b?.personaname || '';
                    break;
                case 'team':
                    aValue = a?.team_name || '';
                    bValue = b?.team_name || '';
                    break;
                case 'country':
                    // Sort by full country name instead of code
                    aValue = getCountryName(a?.country_code) || '';
                    bValue = getCountryName(b?.country_code) || '';
                    break;
                case 'role':
                    aValue = a?.fantasy_role || 0;
                    bValue = b?.fantasy_role || 0;
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

        setFilteredPlayers(result);
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

    const uniqueTeams = [...new Set(
        players
            .map(p => p?.team_name)
            .filter(team => team && team.trim() !== '')
    )].sort();

    const countriesInData = [...new Set(
        players
            .map(p => p?.country_code)
            .filter(code => code && code.trim() !== '')
            .map(code => getCountryName(code))
            .filter(name => name && name.trim() !== '')
    )].sort();

    const countryOptions = getCountryOptions().filter(({ code, name }) =>
        name && name.trim() !== ''
    );

    const roles = [
        { value: '1', label: 'Core (1)' },
        { value: '2', label: 'Core (2)' },
        { value: '3', label: 'Offlane (3)' },
        { value: '4', label: 'Support (4)' }
    ];

    const indexOfLastPlayer = currentPage * playersPerPage;
    const indexOfFirstPlayer = indexOfLastPlayer - playersPerPage;
    const currentPlayers = filteredPlayers.slice(indexOfFirstPlayer, indexOfLastPlayer);
    const totalPages = Math.ceil(filteredPlayers.length / playersPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    if (loading) return <div className="loading">Loading players...</div>;
    if (error) return <div className="error">{error}</div>;

    if (players.length === 0 && !loading) {
        return (
            <div className="players-page">
                <div className="page-header">
                    <h1>Professional Players</h1>
                    <p>No player data available at the moment.</p>
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div className="players-page">
                <div className="page-header">
                    <h1>Professional Players</h1>
                    <p>Browse and discover Dota 2 professional players from around the world</p>
                </div>

                <div className="filters-section card">
                    <div className="filters-grid">
                        <div className="search-filter">
                            <label>Search Players</label>
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="search-input"
                            />
                        </div>

                        <div className="filter-group">
                            <label>Team</label>
                            <select
                                value={filters.team}
                                onChange={(e) => handleFilterChange('team', e.target.value)}
                            >
                                <option value="">All Teams</option>
                                {uniqueTeams.map(team => (
                                    <option key={team} value={team}>{team}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Country</label>
                            <select
                                value={filters.country}
                                onChange={(e) => handleFilterChange('country', e.target.value)}
                            >
                                <option value="">All Countries</option>
                                {countryOptions.map(({ code, name }) => (
                                    <option key={code} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Role</label>
                            <select
                                value={filters.role}
                                onChange={(e) => handleFilterChange('role', e.target.value)}
                            >
                                <option value="">All Roles</option>
                                {roles.map(role => (
                                    <option key={role.value} value={role.value}>{role.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results Summary */}
                <div className="results-summary">
                    <span>
                        Showing {currentPlayers.length} of {filteredPlayers.length} players
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
                            className={`sort-btn ${filters.sortBy === 'team' ? 'active' : ''}`}
                            onClick={() => handleSortChange('team')}
                        >
                            Team {filters.sortBy === 'team' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                        </button>
                        <button
                            className={`sort-btn ${filters.sortBy === 'country' ? 'active' : ''}`}
                            onClick={() => handleSortChange('country')}
                        >
                            Country {filters.sortBy === 'country' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                        </button>
                    </div>
                </div>

                <div className="players-grid">
                    {currentPlayers.length > 0 ? (
                        currentPlayers.map(player => {
                            const playerName = player?.name || player?.profile.personaname || 'Unknown Player';
                            const teamName = player?.team_name || '';
                            const countryCode = player?.country_code || '';
                            const role = player?.fantasy_role || '';
                            const steamId = player?.profile?.steamid || '';
                            const avatar = player?.avatarfull || '/images/person_icon.png';
                            const isPro = player?.is_locked || false;

                            return (
                                <Link
                                    key={player.account_id}
                                    to={`/player/${player.account_id}`}
                                    className="player-card"
                                >
                                    <div className="player-image">
                                        <img
                                            src={avatar}
                                            alt={playerName}
                                            onError={(e) => {
                                                e.target.src = '/images/person_icon.png';
                                            }}
                                        />
                                        {isPro && <div className="pro-badge">PRO</div>}
                                    </div>

                                    <div className="player-info">
                                        <h3 className="player-name">{playerName}</h3>

                                        {teamName && (
                                            <p className="player-team">
                                                <span className="label">Team:</span>
                                                {teamName}
                                            </p>
                                        )}

                                        {countryCode && (
                                            <p className="player-country">
                                                <span className="label">Country:</span>
                                                {getCountryName(countryCode)}
                                            </p>
                                        )}

                                        {role && (
                                            <p className="player-role">
                                                <span className="label">Role:</span>
                                                {roles.find(r => r.value === role.toString())?.label || `Role ${role}`}
                                            </p>
                                        )}

                                        {steamId && (
                                            <p className="player-id">
                                                <span className="label">Steam ID:</span>
                                                {steamId}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            );
                        })
                    ) : (
                        <div className="no-results">
                            <p>No players found matching your criteria.</p>
                            <button onClick={() => {
                                setSearchTerm('');
                                setFilters({
                                    team: '',
                                    country: '',
                                    role: '',
                                    sortBy: 'name',
                                    sortOrder: 'asc'
                                });
                            }}>
                                Clear Filters
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
        </ErrorBoundary>
    );
};

export default Players;