import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProPlayers, getProMatches, getHeroStats } from '../services/opendota.api';
import { getCountryName } from '../utils/countries';
import { BarChart, LineChart, PieChart } from '../components/charts';
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


    const getMatchTrendData = () => {
        const matchesByDate = {};
        matches.forEach(match => {
            if (match.start_time) {
                const date = new Date(match.start_time * 1000).toLocaleDateString();
                matchesByDate[date] = (matchesByDate[date] || 0) + 1;
            }
        });

        return Object.entries(matchesByDate)
            .sort(([a], [b]) => new Date(a) - new Date(b))
            .slice(-7)
            .map(([date, count]) => ({
                date: date,
                value: count
            }));
    };

    // Update the getRegionData function to include full labels
    const getRegionData = () => {
        const regionStats = {};
        players.forEach(player => {
            if (player.country_code) {
                const country = getCountryName(player.country_code);
                regionStats[country] = (regionStats[country] || 0) + 1;
            }
        });

        return Object.entries(regionStats)
            .map(([country, count]) => ({
                label: country.length > 10 ? country.substring(0, 10) + '...' : country, // Short label for display
                fullLabel: country, // Full label for tooltip
                value: count
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);
    };

    // Also update other data preparation functions to support full labels if needed
    const getTeamWinRateData = () => {
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
                label: team.length > 15 ? team.substring(0, 15) + '...' : team,
                fullLabel: team, // Full team name for tooltip
                value: ((stats.wins / (stats.wins + stats.losses)) * 100) || 0
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);
    };

    // In your Analytics component, update the margin functions:
    const getTeamChartMargins = () => {
        return { top: 60, right: 30, bottom: 120, left: 70 };
    };

    const getHeroChartMargins = () => {
        return { top: 60, right: 30, bottom: 100, left: 70 };
    };


    const getHeroPickData = () => {
        return heroes
            .filter(hero => hero.pro_pick > 0)
            .map(hero => ({
                label: hero.localized_name ?
                    (hero.localized_name.length > 10 ? hero.localized_name.substring(0, 10) + '...' : hero.localized_name) :
                    `Hero ${hero.id}`,
                fullLabel: hero.localized_name || `Hero ${hero.id}`, // Full hero name for tooltip
                value: hero.pro_pick
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    };



    const calculatePlayerStats = () => {
        return players
            .filter(player => player.is_current_team_member)
            .sort((a, b) => {
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

    if (loading) return <div className="loading">Loading analytics...</div>;
    if (error) return <div className="error">{error}</div>;

    const topPlayers = calculatePlayerStats();
    const teamWinRateData = getTeamWinRateData();
    const matchTrendData = getMatchTrendData();
    const heroPickData = getHeroPickData();
    const regionData = getRegionData();

    return (
        <div className="analytics-page">
            <div className="page-header">
                <h1>eSports Analytics</h1>
                <p>Advanced D3.js visualizations for Dota 2 professional scene</p>
            </div>

            {/* Time Range Filter */}
            <div className="filters-section card">
                <div className="filters-row">
                    <div className="filter-group">
                        <label>Time Range</label>
                        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                            <option value="90">Last 90 days</option>
                            <option value="365">Last year</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Player Metric</label>
                        <select value={selectedMetric} onChange={(e) => setSelectedMetric(e.target.value)}>
                            <option value="win_rate">Win Rate</option>
                            <option value="rating">Rating</option>
                            <option value="matches">Total Matches</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="analytics-tabs">
                <button className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                    Overview
                </button>
                <button className={`tab-button ${activeTab === 'players' ? 'active' : ''}`} onClick={() => setActiveTab('players')}>
                    Players
                </button>
                <button className={`tab-button ${activeTab === 'teams' ? 'active' : ''}`} onClick={() => setActiveTab('teams')}>
                    Teams
                </button>
                <button className={`tab-button ${activeTab === 'heroes' ? 'active' : ''}`} onClick={() => setActiveTab('heroes')}>
                    Heroes
                </button>
                <button className={`tab-button ${activeTab === 'regions' ? 'active' : ''}`} onClick={() => setActiveTab('regions')}>
                    Regions
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'overview' && (
                    <div className="overview-tab">
                        <div className="overview-grid">
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

                        {/* D3 Charts Section */}
                        <div className="charts-section">
                            <div className="chart-card">
                                <h3>Top Teams by Win Rate</h3>
                                {/* <BarChart
                                    data={teamWinRateData}
                                    width={500}
                                    height={400}
                                    margin={{ top: 20, right: 30, bottom: 100, left: 40 }}
                                /> */}

                                <BarChart
                                    data={teamWinRateData}
                                    width={650}  // Increased width
                                    height={700} // Increased height
                                    margin={getTeamChartMargins()}
                                    xAxisLabel="Teams"
                                    yAxisLabel="Win Rate (%)"
                                    barColor="#4CAF50"
                                    hoverColor="#2E7D32"
                                />
                            </div>

                            <div className="chart-card">
                                <h3>Match Trends (Last 7 Days)</h3>
                                <LineChart
                                    data={matchTrendData}
                                    width={500}
                                    height={300}
                                    margin={{ top: 20, right: 30, bottom: 40, left: 40 }}
                                />
                            </div>
                        </div>

                        <div className="charts-section">
                            <div className="chart-card">
                                <h3>Most Picked Heroes</h3>
                                <PieChart
                                    data={heroPickData}
                                    width={400}
                                    height={300}
                                />
                            </div>

                            <div className="chart-card">
                                <h3>Player Distribution by Region</h3>
                                <PieChart
                                    data={regionData}
                                    width={400}
                                    height={300}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Other tabs remain similar but can be enhanced with D3 charts */}
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

                {/* Add similar D3 visualizations for other tabs */}
                {activeTab === 'teams' && (
                    <div className="teams-tab">
                        <h2>Team Performance Analysis</h2>
                        <div className="chart-card">
                            <h3>Team Win Rates Distribution</h3>
                            <BarChart
                                data={teamWinRateData}
                                width={800}
                                height={400}
                                margin={{ top: 20, right: 30, bottom: 100, left: 40 }}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'heroes' && (
                    <div className="heroes-tab">
                        <h2>Hero Meta Analysis</h2>
                        <div className="chart-card">
                            <h3>Hero Pick Rates</h3>
                            <BarChart
                                data={heroPickData.map(d => ({ ...d, label: d.label.length > 10 ? d.label.substring(0, 10) + '...' : d.label }))}
                                width={800}
                                height={400}
                                margin={{ top: 20, right: 30, bottom: 60, left: 40 }}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'regions' && (
                    <div className="regions-tab">
                        <h2>Regional Analysis</h2>
                        <div className="chart-card">
                            <h3>Player Distribution by Region</h3>
                            <PieChart
                                data={regionData}
                                width={600}
                                height={400}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Analytics;