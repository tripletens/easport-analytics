// pages/Teams.js
import React, { useState, useEffect } from 'react';
import { getProMatches } from '../services/opendota.api';
import TeamCard from '../components/TeamCard';
import './Teams.css';

const Teams = () => {
    const [matches, setMatches] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const matchesData = await getProMatches(100);
                setMatches(matchesData);
                
                // Extract unique teams from matches
                const uniqueTeams = {};
                matchesData.forEach(match => {
                    if (match.radiant_name) {
                        uniqueTeams[match.radiant_name] = {
                            name: match.radiant_name,
                            team_id: match.radiant_team_id
                        };
                    }
                    if (match.dire_name) {
                        uniqueTeams[match.dire_name] = {
                            name: match.dire_name,
                            team_id: match.dire_team_id
                        };
                    }
                });
                
                setTeams(Object.values(uniqueTeams));
            } catch (error) {
                console.error('Error fetching teams data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="loading">Loading teams...</div>;

    return (
        <div className="teams-page">
            <h1>Professional Teams</h1>
            <div className="teams-grid">
                {teams.map(team => (
                    <TeamCard key={team.name} team={team} matches={matches} />
                ))}
            </div>
        </div>
    );
};

export default Teams;