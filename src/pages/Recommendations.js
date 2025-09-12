import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProPlayers, getProMatches, getHeroStats } from '../services/opendota.api';
import { getCountryName } from '../utils/countries';
import './Recommendations.css';

const Recommendations = () => {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('team-strategy');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [playersData, matchesData, heroesData] = await Promise.all([
          getProPlayers(),
          getProMatches(50),
          getHeroStats()
        ]);
        
        setPlayers(playersData || []);
        setMatches(matchesData || []);
        setHeroes(heroesData || []);
      } catch (err) {
        setError('Failed to fetch data for recommendations. Please try again later.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  
  // Safe data calculation functions with proper error handling
  const calculateTeamRecommendations = () => {
    if (!matches || matches.length === 0) return [];
    
    const teamPerformance = {};
    
    matches.forEach(match => {
      if (match && match.radiant_name && match.dire_name) {
        const radiantTeam = match.radiant_name;
        const direTeam = match.dire_name;
        
        teamPerformance[radiantTeam] = teamPerformance[radiantTeam] || { wins: 0, losses: 0, matches: 0 };
        teamPerformance[direTeam] = teamPerformance[direTeam] || { wins: 0, losses: 0, matches: 0 };
        
        if (match.radiant_win) {
          teamPerformance[radiantTeam].wins += 1;
          teamPerformance[direTeam].losses += 1;
        } else {
          teamPerformance[direTeam].wins += 1;
          teamPerformance[radiantTeam].losses += 1;
        }
        
        teamPerformance[radiantTeam].matches += 1;
        teamPerformance[direTeam].matches += 1;
      }
    });

    const teamsWithMatches = Object.entries(teamPerformance)
      .filter(([_, stats]) => stats.wins + stats.losses > 0);

    if (teamsWithMatches.length === 0) return [];

    return teamsWithMatches
      .map(([team, stats]) => {
        const totalMatches = stats.wins + stats.losses;
        const winRate = (stats.wins / totalMatches) * 100;
        
        return {
          team,
          winRate,
          matches: totalMatches,
          recommendation: winRate < 40 ? 
            'Consider roster changes or strategy overhaul' :
            winRate < 60 ?
            'Focus on consistency and mid-game decision making' :
            'Maintain current strategy and focus on tournament preparation'
        };
      })
      .sort((a, b) => a.winRate - b.winRate)
      .slice(0, 10);
  };

  const calculatePlayerRecommendations = () => {
    if (!players || players.length === 0) return [];
    
    const playerData = players
      .filter(player => player && player.is_current_team_member && player.wins !== undefined && player.losses !== undefined)
      .map(player => {
        const totalMatches = (player.wins || 0) + (player.losses || 0);
        const winRate = totalMatches > 0 ? (player.wins / totalMatches) * 100 : 0;
        
        let recommendation = '';
        if (totalMatches < 10) {
          recommendation = 'Needs more competitive experience. Recommend participating in more tournaments.';
        } else if (winRate < 45) {
          recommendation = 'Consider role change or intensive training. Focus on hero mastery.';
        } else if (winRate < 60) {
          recommendation = 'Solid performance. Focus on consistency and team coordination.';
        } else {
          recommendation = 'Elite performer. Consider leadership role and mentor younger players.';
        }

        return {
          name: player.name || player.personaname || 'Unknown Player',
          team: player.team_name,
          winRate,
          matches: totalMatches,
          recommendation
        };
      })
      .sort((a, b) => a.winRate - b.winRate)
      .slice(0, 10);

    return playerData.length > 0 ? playerData : [];
  };

  const calculateHeroRecommendations = () => {
    if (!heroes || heroes.length === 0) return [];
    
    const validHeroes = heroes.filter(hero => 
      hero && hero.pro_pick > 20 && hero.localized_name
    );

    if (validHeroes.length === 0) return [];

    const totalPicks = validHeroes.reduce((sum, hero) => sum + (hero.pro_pick || 0), 0);

    const heroData = validHeroes
      .map(hero => {
        const winRate = hero.pro_pick > 0 ? ((hero.pro_win || 0) / hero.pro_pick) * 100 : 0;
        const pickRate = totalPicks > 0 ? (hero.pro_pick / totalPicks) * 100 : 0;
        
        let recommendation = '';
        if (winRate > 55 && pickRate < 5) {
          recommendation = 'Hidden gem! This hero has high win rate but low pick rate. Consider adding to strategy.';
        } else if (winRate < 45 && pickRate > 10) {
          recommendation = 'Overpicked and underperforming. Consider reducing priority in drafts.';
        } else if (winRate > 60) {
          recommendation = 'Top tier hero. High priority pick in current meta.';
        } else {
          recommendation = 'Balanced performance. Solid pick in specific strategies.';
        }

        return {
          name: hero.localized_name || `Hero ${hero.id}`,
          winRate,
          pickRate: pickRate.toFixed(1),
          matches: hero.pro_pick,
          recommendation
        };
      })
      .filter(hero => hero.winRate > 0)
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 10);

    return heroData.length > 0 ? heroData : [];
  };

  const calculateDraftRecommendations = () => {
    if (!heroes || heroes.length === 0) return [];
    
    const highWinRateHeroes = heroes
      .filter(hero => hero && hero.pro_pick > 10 && ((hero.pro_win || 0) / hero.pro_pick) > 0.55)
      .sort((a, b) => ((b.pro_win || 0) / b.pro_pick) - ((a.pro_win || 0) / a.pro_pick))
      .slice(0, 5)
      .map(hero => hero.localized_name || `Hero ${hero.id}`);

    return [
      {
        type: 'Priority Picks',
        heroes: highWinRateHeroes.length > 0 ? highWinRateHeroes : ['No high win rate heroes found'],
        recommendation: highWinRateHeroes.length > 0 ? 
          'These heroes have exceptional win rates in the current meta. Consider first-picking them when possible.' :
          'Not enough data to identify priority picks. More matches needed for analysis.'
      },
      {
        type: 'Counter Picks',
        heroes: ['Consider enemy team composition', 'Adapt to opponent playstyle', 'Ban key heroes'],
        recommendation: 'Always have counter picks ready. Study opponent team patterns and prepare specific counters.'
      },
      {
        type: 'Synergy Picks',
        heroes: ['Focus on hero combinations', 'Consider team fight synergy', 'Plan lane combinations'],
        recommendation: 'Build teams with strong synergy. Practice specific hero combinations in scrims.'
      }
    ];
  };

  const calculateRegionalInsights = () => {
    if (!players || players.length === 0) return [];
    
    const regionStats = {};
    
    players.forEach(player => {
      if (player && player.country_code && player.team_name) {
        const country = getCountryName(player.country_code.toUpperCase());
        regionStats[country] = regionStats[country] || { players: 0, teams: new Set() };
        regionStats[country].players += 1;
        regionStats[country].teams.add(player.team_name);
      }
    });

    const regionData = Object.entries(regionStats)
      .map(([country, stats]) => ({
        country,
        playerCount: stats.players,
        teamCount: stats.teams.size,
        recommendation: stats.players > 20 ? 
          'Strong regional presence. Consider regional tournaments and scouting.' :
          'Emerging region. Focus on talent development and international exposure.'
      }))
      .sort((a, b) => b.playerCount - a.playerCount)
      .slice(0, 8);

    return regionData.length > 0 ? regionData : [];
  };

  if (loading) return <div className="loading">Loading recommendations...</div>;
  if (error) return <div className="error">{error}</div>;

  const teamRecommendations = calculateTeamRecommendations();
  const playerRecommendations = calculatePlayerRecommendations();
  const heroRecommendations = calculateHeroRecommendations();
  const draftRecommendations = calculateDraftRecommendations();
  const regionalInsights = calculateRegionalInsights();

  // Check if we have any data to show
  const hasData = teamRecommendations.length > 0 || 
                 playerRecommendations.length > 0 || 
                 heroRecommendations.length > 0 ||
                 regionalInsights.length > 0;

  if (!hasData) {
    return (
      <div className="recommendations-page">
        <div className="page-header">
          <h1>Strategic Recommendations</h1>
          <p>Data-driven insights and actionable recommendations for eSports success</p>
        </div>
        <div className="no-data">
          <p>Not enough data available for recommendations yet. Please check back after more matches have been played.</p>
          <Link to="/matches" className="cta-btn primary">
            View Matches
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="recommendations-page">
      <div className="page-header">
        <h1>Strategic Recommendations</h1>
        <p>Data-driven insights and actionable recommendations for eSports success</p>
      </div>

      {/* Navigation Tabs */}
      <div className="recommendation-categories">
        <button 
          className={`category-btn ${activeCategory === 'team-strategy' ? 'active' : ''}`}
          onClick={() => setActiveCategory('team-strategy')}
        >
          🏆 Team Strategy
        </button>
        <button 
          className={`category-btn ${activeCategory === 'player-development' ? 'active' : ''}`}
          onClick={() => setActiveCategory('player-development')}
        >
          👥 Player Development
        </button>
        <button 
          className={`category-btn ${activeCategory === 'hero-meta' ? 'active' : ''}`}
          onClick={() => setActiveCategory('hero-meta')}
        >
          ⚔️ Hero Meta
        </button>
        <button 
          className={`category-btn ${activeCategory === 'drafting' ? 'active' : ''}`}
          onClick={() => setActiveCategory('drafting')}
        >
          📋 Drafting
        </button>
        <button 
          className={`category-btn ${activeCategory === 'regional' ? 'active' : ''}`}
          onClick={() => setActiveCategory('regional')}
        >
          🌍 Regional Insights
        </button>
      </div>

      {/* Content Section */}
      <div className="recommendations-content">
        {activeCategory === 'team-strategy' && (
          <div className="category-section">
            <h2>Team Performance Recommendations</h2>
            <p className="section-description">
              Based on recent match data, here are tailored recommendations for team improvement and strategy development.
            </p>
            
            {teamRecommendations.length > 0 ? (
              <div className="recommendations-grid">
                {teamRecommendations.map((team, index) => (
                  <div key={team.team} className="recommendation-card">
                    <div className="card-header">
                      <h3>{team.team}</h3>
                      <span className="win-rate">{team.winRate.toFixed(1)}% Win Rate</span>
                    </div>
                    <div className="card-stats">
                      <span className="stat">{team.matches} Matches Analyzed</span>
                    </div>
                    <div className="recommendation-text">
                      <p>{team.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data-category">
                <p>No team data available for recommendations yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Other categories with similar safety checks */}
        {activeCategory === 'player-development' && (
          <div className="category-section">
            <h2>Player Development Recommendations</h2>
            <p className="section-description">
              Individual player analysis and development suggestions based on performance metrics.
            </p>
            
            {playerRecommendations.length > 0 ? (
              <div className="recommendations-list">
                {playerRecommendations.map((player, index) => (
                  <div key={player.name + index} className="player-recommendation">
                    <div className="player-info">
                      <h4>{player.name}</h4>
                      <span className="team">{player.team || 'Free Agent'}</span>
                    </div>
                    <div className="player-stats">
                      <span className="stat">{player.winRate.toFixed(1)}% Win Rate</span>
                      <span className="stat">{player.matches} Matches</span>
                    </div>
                    <div className="recommendation">
                      <p>{player.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data-category">
                <p>No player data available for recommendations yet.</p>
              </div>
            )}
          </div>
        )}

        {activeCategory === 'hero-meta' && (
          <div className="category-section">
            <h2>Hero Meta Analysis</h2>
            <p className="section-description">
              Current hero performance insights and meta recommendations for strategic advantage.
            </p>
            
            {heroRecommendations.length > 0 ? (
              <div className="hero-recommendations">
                {heroRecommendations.map((hero, index) => (
                  <div key={hero.name} className="hero-card">
                    <div className="hero-header">
                      <h3>{hero.name}</h3>
                      <div className="hero-stats">
                        <span className="win-rate">{hero.winRate.toFixed(1)}% Win Rate</span>
                        <span className="pick-rate">{hero.pickRate}% Pick Rate</span>
                      </div>
                    </div>
                    <div className="hero-matches">
                      <span>{hero.matches} Pro Matches</span>
                    </div>
                    <div className="recommendation">
                      <p>{hero.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data-category">
                <p>No hero data available for recommendations yet.</p>
              </div>
            )}
          </div>
        )}

        {activeCategory === 'drafting' && (
          <div className="category-section">
            <h2>Drafting Strategy Recommendations</h2>
            <p className="section-description">
              Advanced drafting insights and strategic recommendations for competitive advantage.
            </p>
            
            <div className="drafting-recommendations">
              {draftRecommendations.map((strategy, index) => (
                <div key={strategy.type} className="strategy-card">
                  <h3>{strategy.type}</h3>
                  <div className="strategy-heroes">
                    {strategy.heroes.map((hero, heroIndex) => (
                      <span key={heroIndex} className="hero-tag">{hero}</span>
                    ))}
                  </div>
                  <div className="strategy-recommendation">
                    <p>{strategy.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeCategory === 'regional' && (
          <div className="category-section">
            <h2>Regional Insights</h2>
            <p className="section-description">
              Geographic distribution analysis and regional development recommendations.
            </p>
            
            {regionalInsights.length > 0 ? (
              <div className="regional-insights">
                {regionalInsights.map((region, index) => (
                  <div key={region.country} className="region-card">
                    <div className="region-header">
                      <h3>{region.country}</h3>
                      <span className="player-count">{region.playerCount} Players</span>
                    </div>
                    <div className="region-stats">
                      <span className="stat">{region.teamCount} Professional Teams</span>
                    </div>
                    <div className="recommendation">
                      <p>{region.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data-category">
                <p>No regional data available for recommendations yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className="cta-section">
        <h2>Ready to Implement These Strategies?</h2>
        <p>Start by analyzing your team's current performance and implementing these data-driven recommendations.</p>
        <div className="cta-buttons">
          <Link to="/teams" className="cta-btn primary">
            Explore Teams
          </Link>
          <Link to="/analytics" className="cta-btn secondary">
            View Analytics
          </Link>
          <Link to="/matches" className="cta-btn secondary">
            Analyze Matches
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Recommendations;