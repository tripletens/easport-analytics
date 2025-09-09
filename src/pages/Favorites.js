import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProPlayers, getProMatches, getHeroStats } from '../services/opendota.api';
import { getCountryName } from '../utils/countries';
import { BarChart, LineChart, PieChart } from '../components/charts';
import './Favorites.css';

const Favorites = () => {
    const [favorites, setFavorites] = useState({
        players: [],
        teams: [],
        heroes: [],
        matches: []
    });
    const [allPlayers, setAllPlayers] = useState([]);
    const [allMatches, setAllMatches] = useState([]);
    const [allHeroes, setAllHeroes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('players');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [playersData, matchesData, heroesData] = await Promise.all([
                    getProPlayers(),
                    getProMatches(50),
                    getHeroStats()
                ]);

                setAllPlayers(playersData);
                setAllMatches(matchesData);
                setAllHeroes(heroesData);

                // Load favorites from localStorage
                const savedFavorites = JSON.parse(localStorage.getItem('dotaFavorites')) || {
                    players: [],
                    teams: [],
                    heroes: [],
                    matches: []
                };
                setFavorites(savedFavorites);
            } catch (err) {
                console.error('Error fetching favorites data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const removeFromFavorites = (type, id) => {
        const updatedFavorites = {
            ...favorites,
            [type]: favorites[type].filter(item => item.id !== id)
        };
        setFavorites(updatedFavorites);
        localStorage.setItem('dotaFavorites', JSON.stringify(updatedFavorites));
    };

    const getFavoritePlayersData = () => {
        return favorites.players.map(fav => {
            const player = allPlayers.find(p => p.account_id === fav.id);
            if (!player) return null;

            const winRate = ((player.wins || 0) / ((player.wins || 0) + (player.losses || 0)) * 100) || 0;
            
            return {
                ...player,
                winRate: winRate.toFixed(1),
                totalMatches: (player.wins || 0) + (player.losses || 0)
            };
        }).filter(Boolean);
    };

    const getFavoriteTeamsData = () => {
        const teamStats = {};
        
        allMatches.forEach(match => {
            if (match.radiant_name && match.dire_name) {
                const radiantTeam = match.radiant_name;
                const direTeam = match.dire_name;
                
                teamStats[radiantTeam] = teamStats[radiantTeam] || { wins: 0, losses: 0 };
                teamStats[direTeam] = teamStats[direTeam] || { wins: 0, losses: 0 };
                
                if (match.radiant_win) {
                    teamStats[radiantTeam].wins += 1;
                    teamStats[direTeam].losses += 1;
                } else {
                    teamStats[direTeam].wins += 1;
                    teamStats[radiantTeam].losses += 1;
                }
            }
        });

        return favorites.teams.map(fav => {
            const stats = teamStats[fav.name];
            if (!stats) return null;

            const totalGames = stats.wins + stats.losses;
            const winRate = ((stats.wins / totalGames) * 100) || 0;

            return {
                ...fav,
                wins: stats.wins,
                losses: stats.losses,
                totalGames,
                winRate: winRate.toFixed(1)
            };
        }).filter(Boolean);
    };

    const getFavoriteHeroesData = () => {
        return favorites.heroes.map(fav => {
            const hero = allHeroes.find(h => h.id === fav.id);
            if (!hero) return null;

            return {
                ...hero,
                pickRate: ((hero.pro_pick / hero.pro_ban) * 100) || 0
            };
        }).filter(Boolean);
    };

    const getFavoriteMatchesData = () => {
        return favorites.matches.map(fav => {
            const match = allMatches.find(m => m.match_id === fav.id);
            if (!match) return null;

            return {
                ...match,
                winner: match.radiant_win ? match.radiant_name : match.dire_name,
                loser: match.radiant_win ? match.dire_name : match.radiant_name,
                duration: Math.floor(match.duration / 60) + ':' + (match.duration % 60).toString().padStart(2, '0')
            };
        }).filter(Boolean);
    };

    if (loading) return <div className="loading">Loading favorites...</div>;

    const favoritePlayers = getFavoritePlayersData();
    const favoriteTeams = getFavoriteTeamsData();
    const favoriteHeroes = getFavoriteHeroesData();
    const favoriteMatches = getFavoriteMatchesData();

    return (
        <div className="favorites-page">
            <div className="page-header">
                <h1>My Favorites</h1>
                <p>Manage your favorite Dota 2 teams</p>
            </div>

            {/* Navigation Tabs */}
            <div className="favorites-tabs">
                {/* <button className={`tab-button ${activeTab === 'players' ? 'active' : ''}`} onClick={() => setActiveTab('players')}>
                    Players ({favoritePlayers.length})
                </button> */}
                <button className={`tab-button ${activeTab === 'teams' ? 'active' : ''}`} onClick={() => setActiveTab('teams')}>
                    Teams ({favoriteTeams.length})
                </button>
                {/* <button className={`tab-button ${activeTab === 'heroes' ? 'active' : ''}`} onClick={() => setActiveTab('heroes')}>
                    Heroes ({favoriteHeroes.length})
                </button>
                <button className={`tab-button ${activeTab === 'matches' ? 'active' : ''}`} onClick={() => setActiveTab('matches')}>
                    Matches ({favoriteMatches.length})
                </button> */}
            </div>

            {/* Tab Content */}
            <div className="favorites-content">
                {/* {activeTab === 'players' && (
                    <div className="players-tab">
                        {favoritePlayers.length === 0 ? (
                            <div className="empty-state">
                                <h3>No favorite players yet</h3>
                                <p>Add players to your favorites from the Players page</p>
                                <Link to="/players" className="cta-button">Browse Players</Link>
                            </div>
                        ) : (
                            <div className="favorites-grid">
                                {favoritePlayers.map(player => (
                                    <div key={player.account_id} className="favorite-card">
                                        <div className="card-header">
                                            <h3>{player.name || player.personaname}</h3>
                                            <button 
                                                className="remove-btn"
                                                onClick={() => removeFromFavorites('players', player.account_id)}
                                                title="Remove from favorites"
                                            >
                                                ×
                                            </button>
                                        </div>
                                        <div className="card-content">
                                            <div className="player-info">
                                                <div className="info-item">
                                                    <span className="label">Team:</span>
                                                    <span className="value">{player.team_name || 'Free Agent'}</span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="label">Win Rate:</span>
                                                    <span className="value">{player.winRate}%</span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="label">Matches:</span>
                                                    <span className="value">{player.totalMatches}</span>
                                                </div>
                                                {player.country_code && (
                                                    <div className="info-item">
                                                        <span className="label">Country:</span>
                                                        <span className="value">{getCountryName(player.country_code)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="card-footer">
                                            <Link to={`/player/${player.account_id}`} className="view-details-btn">
                                                View Details
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )} */}

                {activeTab === 'teams' && (
                    <div className="teams-tab">
                        {favoriteTeams.length === 0 ? (
                            <div className="empty-state">
                                <h3>No favorite teams yet</h3>
                                <p>Add teams to your favorites from the Teams page</p>
                                <Link to="/teams" className="cta-button">Browse Teams</Link>
                            </div>
                        ) : (
                            <div className="favorites-grid">
                                {favoriteTeams.map(team => (
                                    <div key={team.id} className="favorite-card">
                                        <div className="card-header">
                                            <h3>{team.name}</h3>
                                            <button 
                                                className="remove-btn"
                                                onClick={() => removeFromFavorites('teams', team.id)}
                                                title="Remove from favorites"
                                            >
                                                ×
                                            </button>
                                        </div>
                                        <div className="card-content">
                                            <div className="team-stats">
                                                <div className="stat-row">
                                                    <span className="label">Win Rate:</span>
                                                    <span className="value">{team.winRate}%</span>
                                                </div>
                                                <div className="stat-row">
                                                    <span className="label">Wins:</span>
                                                    <span className="value">{team.wins}</span>
                                                </div>
                                                <div className="stat-row">
                                                    <span className="label">Losses:</span>
                                                    <span className="value">{team.losses}</span>
                                                </div>
                                                <div className="stat-row">
                                                    <span className="label">Total Games:</span>
                                                    <span className="value">{team.totalGames}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* {activeTab === 'heroes' && (
                    <div className="heroes-tab">
                        {favoriteHeroes.length === 0 ? (
                            <div className="empty-state">
                                <h3>No favorite heroes yet</h3>
                                <p>Add heroes to your favorites from the Heroes page</p>
                                <Link to="/heroes" className="cta-button">Browse Heroes</Link>
                            </div>
                        ) : (
                            <div className="favorites-grid">
                                {favoriteHeroes.map(hero => (
                                    <div key={hero.id} className="favorite-card">
                                        <div className="card-header">
                                            <h3>{hero.localized_name}</h3>
                                            <button 
                                                className="remove-btn"
                                                onClick={() => removeFromFavorites('heroes', hero.id)}
                                                title="Remove from favorites"
                                            >
                                                ×
                                            </button>
                                        </div>
                                        <div className="card-content">
                                            <div className="hero-stats">
                                                <div className="stat-row">
                                                    <span className="label">Pro Picks:</span>
                                                    <span className="value">{hero.pro_pick}</span>
                                                </div>
                                                <div className="stat-row">
                                                    <span className="label">Pro Bans:</span>
                                                    <span className="value">{hero.pro_ban}</span>
                                                </div>
                                                <div className="stat-row">
                                                    <span className="label">Pick Rate:</span>
                                                    <span className="value">{hero.pickRate.toFixed(1)}%</span>
                                                </div>
                                                <div className="stat-row">
                                                    <span className="label">Win Rate:</span>
                                                    <span className="value">{hero.pro_winrate}%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card-footer">
                                            <Link to={`/hero/${hero.id}`} className="view-details-btn">
                                                View Details
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )} */}

                {/* {activeTab === 'matches' && (
                    <div className="matches-tab">
                        {favoriteMatches.length === 0 ? (
                            <div className="empty-state">
                                <h3>No favorite matches yet</h3>
                                <p>Add matches to your favorites from the Matches page</p>
                                <Link to="/matches" className="cta-button">Browse Matches</Link>
                            </div>
                        ) : (
                            <div className="matches-list">
                                {favoriteMatches.map(match => (
                                    <div key={match.match_id} className="match-card">
                                        <div className="card-header">
                                            <h3>Match #{match.match_id}</h3>
                                            <button 
                                                className="remove-btn"
                                                onClick={() => removeFromFavorites('matches', match.match_id)}
                                                title="Remove from favorites"
                                            >
                                                ×
                                            </button>
                                        </div>
                                        <div className="card-content">
                                            <div className="match-info">
                                                <div className="teams-row">
                                                    <span className="team radiant">{match.radiant_name}</span>
                                                    <span className="vs">vs</span>
                                                    <span className="team dire">{match.dire_name}</span>
                                                </div>
                                                <div className="match-details">
                                                    <div className="detail-item">
                                                        <span className="label">Winner:</span>
                                                        <span className="value winner">{match.winner}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="label">Duration:</span>
                                                        <span className="value">{match.duration}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="label">League:</span>
                                                        <span className="value">{match.league_name}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card-footer">
                                            <Link to={`/match/${match.match_id}`} className="view-details-btn">
                                                View Match Details
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )} */}
            </div>
        </div>
    );
};

export default Favorites;