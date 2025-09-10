// src/components/charts/TeamWinRateChart.js
import React, { useState, useEffect } from "react";
import * as d3 from "d3";
import D3BaseChart from "./D3BaseChart";

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

    matches.forEach((match) => {
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
          label: team.length > 10 ? team.substring(0, 10) + "..." : team,
          fullLabel: team,
          value: winRate,
          wins: stats.wins,
          losses: stats.losses,
          totalGames: totalGames,
          percentage: winRate.toFixed(1),
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  };

  const renderChart = (svg, g, { innerWidth, innerHeight, data }) => {
    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, innerWidth])
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value) || 0])
      .nice()
      .range([innerHeight, 0]);

    // Bars
    g.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.label))
      .attr("y", (d) => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", (d) => innerHeight - y(d.value))
      .attr("fill", "#4CAF50");

    // X Axis
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-40)")
      .style("text-anchor", "end");

    // Y Axis
    g.append("g").call(d3.axisLeft(y));
  };

  if (!matches || matches.length === 0) {
    return <div>No match data available</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 text-center text-gray-800 dark:text-gray-200">
        Top Teams by Win Rate
      </h2>
      <D3BaseChart
        data={winRateData}
        width={800}
        height={500}
        renderChart={renderChart}
      />
    </div>
  );
};

export default TeamWinRateChart;
