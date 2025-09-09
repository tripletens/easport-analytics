import React from 'react';
import { Link } from 'react-router-dom';
import FavoriteButton from './FavoriteButton';

const TeamCard = ({ team, matches }) => {
    const teamStats = calculateTeamStats(team, matches);
    
    return (
        <div className="team-card">
            <div className="team-card-header">
                <h3>{team.name}</h3>
                <FavoriteButton 
                    type="teams" 
                    item={{ id: team.team_id || team.name, name: team.name }}
                    size="medium"
                />
            </div>
            <div className="team-stats">
                <div className="stat">
                    <span>Win Rate:</span>
                    <span>{teamStats.winRate}%</span>
                </div>
                <div className="stat">
                    <span>Wins:</span>
                    <span>{teamStats.wins}</span>
                </div>
                <div className="stat">
                    <span>Losses:</span>
                    <span>{teamStats.losses}</span>
                </div>
            </div>
            <Link to={`/team/${team.team_id || team.name}`} className="view-details">
                View Team Details
            </Link>
        </div>
    );
};

// Helper function to calculate team stats
const calculateTeamStats = (team, matches) => {
    const teamMatches = matches.filter(match => 
        match.radiant_name === team.name || match.dire_name === team.name
    );
    
    let wins = 0;
    let losses = 0;
    
    teamMatches.forEach(match => {
        const isRadiant = match.radiant_name === team.name;
        if ((isRadiant && match.radiant_win) || (!isRadiant && !match.radiant_win)) {
            wins++;
        } else {
            losses++;
        }
    });
    
    const totalGames = wins + losses;
    const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : 0;
    
    return { wins, losses, totalGames, winRate };
};

export default TeamCard;