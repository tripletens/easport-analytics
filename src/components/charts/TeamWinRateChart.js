import React, { useState, useEffect } from 'react';
import BarChart from './BarChart'; // Adjust the import path as needed

const TeamWinRateChart = ({ matches }) => {
  const [winRateData, setWinRateData] = useState([]);

  useEffect(() => {
    if (matches && matches.length > 0) {
      const data = getTeamWinRateData(matches);
      setWinRateData(data);
    }
  }, [matches]);

  const getTeamWinRateData = (matches) => {
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
      .map(([team, stats]) => {
        const totalGames = stats.wins + stats.losses;
        const winRate = ((stats.wins / totalGames) * 100) || 0;
        
        return {
          label: team.length > 10 ? team.substring(0, 10) + '...' : team,
          fullLabel: team,
          value: winRate,
          wins: stats.wins,
          losses: stats.losses,
          totalGames: totalGames,
          percentage: winRate.toFixed(1)
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  };

  if (!matches || matches.length === 0) {
    return <div>No match data available</div>;
  }

  return (
    <div>
      <h2>Top Teams by Win Rate</h2>
      <BarChart
        data={winRateData}
        width={800}
        height={500}
        xAxisLabel="Teams"
        yAxisLabel="Win Rate (%)"
        barColor="#4a7bff"
        hoverColor="#2c5ce6"
      />
    </div>
  );
};

export default TeamWinRateChart;