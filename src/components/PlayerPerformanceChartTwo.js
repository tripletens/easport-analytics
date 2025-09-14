import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './PlayerPerformanceChart.css';

const PlayerPerformanceChartTwo = ({ players, width = 800, height = 500 }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!players || players.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Filter out players without basic data
    const validPlayers = players.filter(p => p && p.hero_id && p.kills !== undefined);

    if (validPlayers.length === 0) return;

    const margin = { top: 50, right: 100, bottom: 100, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Prepare data for radar chart
    const metrics = [
      { key: 'kills', label: 'Kills', max: Math.max(10, d3.max(validPlayers, d => d.kills) || 10) },
      { key: 'deaths', label: 'Deaths', max: Math.max(10, d3.max(validPlayers, d => d.deaths) || 10) },
      { key: 'assists', label: 'Assists', max: Math.max(20, d3.max(validPlayers, d => d.assists) || 20) },
      { key: 'last_hits', label: 'Last Hits', max: Math.max(200, d3.max(validPlayers, d => d.last_hits) || 200) },
      { key: 'gold_per_min', label: 'GPM', max: Math.max(600, d3.max(validPlayers, d => d.gold_per_min) || 600) },
      { key: 'xp_per_min', label: 'XPM', max: Math.max(600, d3.max(validPlayers, d => d.xp_per_min) || 600) }
    ];

    // Create tooltip
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "radar-tooltip")
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "8px 12px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", "1000")
      .style("min-width", "120px");

    // Normalize data for radar chart
    const playerData = validPlayers.map(player => ({
      name: `Player ${player.player_slot < 128 ? 'R' : 'D'}${player.player_slot % 128 + 1}`,
      hero: player.hero_id,
      team: player.player_slot < 128 ? 'radiant' : 'dire',
      player_slot: player.player_slot,
      metrics: metrics.map(metric => ({
        axis: metric.label,
        value: player[metric.key] || 0,
        normalized: (player[metric.key] || 0) / metric.max,
        actual: player[metric.key] || 0,
        max: metric.max
      })),
      // Store actual values for tooltip
      actualValues: {
        kills: player.kills || 0,
        deaths: player.deaths || 0,
        assists: player.assists || 0,
        last_hits: player.last_hits || 0,
        gold_per_min: player.gold_per_min || 0,
        xp_per_min: player.xp_per_min || 0,
        hero_damage: player.hero_damage || 0,
        tower_damage: player.tower_damage || 0,
        hero_healing: player.hero_healing || 0
      }
    }));

    const radius = Math.min(innerWidth, innerHeight) / 2;
    const angleSlice = (2 * Math.PI) / metrics.length;

    // Create SVG group
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left + innerWidth / 2}, ${margin.top + innerHeight / 2})`);

    // Create axes
    const axis = g.selectAll(".axis")
      .data(metrics)
      .enter().append("g")
      .attr("class", "axis");

    axis.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", (d, i) => radius * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y2", (d, i) => radius * Math.sin(angleSlice * i - Math.PI / 2))
      .attr("class", "line")
      .style("stroke", "#ccc")
      .style("stroke-width", "1px");

    axis.append("text")
      .attr("class", "legend")
      .style("font-size", "11px")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("x", (d, i) => (radius + 20) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y", (d, i) => (radius + 20) * Math.sin(angleSlice * i - Math.PI / 2))
      .text(d => d.label);

    // Create circular grid
    const levels = 5;
    for (let level = 1; level <= levels; level++) {
      const levelFactor = radius * level / levels;
      
      g.selectAll(".levels")
        .data(metrics)
        .enter().append("line")
        .attr("x1", (d, i) => levelFactor * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y1", (d, i) => levelFactor * Math.sin(angleSlice * i - Math.PI / 2))
        .attr("x2", (d, i) => levelFactor * Math.cos(angleSlice * (i + 1) - Math.PI / 2))
        .attr("y2", (d, i) => levelFactor * Math.sin(angleSlice * (i + 1) - Math.PI / 2))
        .attr("class", "line")
        .style("stroke", "#ccc")
        .style("stroke-width", "0.5px")
        .style("stroke-dasharray", "2,2");

      g.append("text")
        .attr("class", "level-label")
        .attr("x", levelFactor * Math.cos(angleSlice * 0 - Math.PI / 2))
        .attr("y", levelFactor * Math.sin(angleSlice * 0 - Math.PI / 2))
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("fill", "#666")
        .text(level * 20 + "%");
    }

    // Create colors for teams
    const colorScale = d3.scaleOrdinal()
      .domain(["radiant", "dire"])
      .range(["#4CAF50", "#F44336"]);

    // Draw player paths
    const radarLine = d3.lineRadial()
      .curve(d3.curveLinearClosed)
      .radius(d => radius * d.normalized)
      .angle((d, i) => i * angleSlice);

    playerData.forEach((player, playerIndex) => {
      const path = g.append("path")
        .datum(player.metrics)
        .attr("class", "radar-area")
        .attr("d", radarLine)
        .style("fill", colorScale(player.team))
        .style("fill-opacity", 0.1)
        .style("stroke", colorScale(player.team))
        .style("stroke-width", "2px")
        .style("stroke-opacity", 0.8)
        .on("mouseover", function(event) {
          // Highlight this player's path
          d3.select(this)
            .style("fill-opacity", 0.3)
            .style("stroke-width", "3px");

          // Show tooltip
          tooltip
            .style("opacity", 1)
            .html(`
              <div style="margin-bottom: 8px; border-bottom: 1px solid #555; padding-bottom: 5px;">
                <strong style="color: ${colorScale(player.team)}">${player.name}</strong>
                <div style="font-size: 11px; color: #ccc;">Hero ${player.hero} • ${player.team.toUpperCase()}</div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px;">
                <div>Kills:</div><div style="text-align: right; font-weight: 600;">${player.actualValues.kills}</div>
                <div>Deaths:</div><div style="text-align: right; font-weight: 600;">${player.actualValues.deaths}</div>
                <div>Assists:</div><div style="text-align: right; font-weight: 600;">${player.actualValues.assists}</div>
                <div>Last Hits:</div><div style="text-align: right; font-weight: 600;">${player.actualValues.last_hits}</div>
                <div>GPM:</div><div style="text-align: right; font-weight: 600;">${player.actualValues.gold_per_min}</div>
                <div>XPM:</div><div style="text-align: right; font-weight: 600;">${player.actualValues.xp_per_min}</div>
                <div>Hero Damage:</div><div style="text-align: right; font-weight: 600;">${player.actualValues.hero_damage.toLocaleString()}</div>
                <div>Tower Damage:</div><div style="text-align: right; font-weight: 600;">${player.actualValues.tower_damage.toLocaleString()}</div>
              </div>
            `)
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mousemove", function(event) {
          tooltip
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
          // Reset style
          d3.select(this)
            .style("fill-opacity", 0.1)
            .style("stroke-width", "2px");

          // Hide tooltip
          tooltip.style("opacity", 0);
        });

      // Add data points with tooltips
      player.metrics.forEach((metric, i) => {
        g.append("circle")
          .attr("class", "radar-point")
          .attr("r", 3)
          .attr("cx", radius * metric.normalized * Math.cos(angleSlice * i - Math.PI / 2))
          .attr("cy", radius * metric.normalized * Math.sin(angleSlice * i - Math.PI / 2))
          .style("fill", colorScale(player.team))
          .style("stroke", "#fff")
          .style("stroke-width", "1px")
          .on("mouseover", function(event) {
            d3.select(this).attr("r", 5);
            tooltip
              .style("opacity", 1)
              .html(`
                <div style="margin-bottom: 5px;">
                  <strong style="color: ${colorScale(player.team)}">${player.name}</strong>
                  <div style="font-size: 11px; color: #ccc;">${metric.axis}</div>
                </div>
                <div style="text-align: center;">
                  <span style="font-size: 16px; font-weight: bold;">${metric.actual}</span>
                  <span style="font-size: 11px; color: #ccc;">/ ${metric.max}</span>
                </div>
                <div style="text-align: center; font-size: 11px; margin-top: 3px;">
                  ${(metric.normalized * 100).toFixed(1)}% of max
                </div>
              `)
              .style("left", (event.pageX + 15) + "px")
              .style("top", (event.pageY - 28) + "px");
          })
          .on("mousemove", function(event) {
            tooltip
              .style("left", (event.pageX + 15) + "px")
              .style("top", (event.pageY - 28) + "px");
          })
          .on("mouseout", function() {
            d3.select(this).attr("r", 3);
            tooltip.style("opacity", 0);
          });
      });
    });

    // Add legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);

    const teams = ["radiant", "dire"];
    teams.forEach((team, i) => {
      const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${i * 25})`);

      legendRow.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", colorScale(team))
        .style("cursor", "pointer")
        .on("mouseover", function() {
          d3.select(this).attr("opacity", 0.7);
          // Highlight all paths of this team
          svg.selectAll(".radar-area")
            .filter((d, i) => playerData[i].team === team)
            .style("fill-opacity", 0.3)
            .style("stroke-width", "3px");
        })
        .on("mouseout", function() {
          d3.select(this).attr("opacity", 1);
          // Reset all paths
          svg.selectAll(".radar-area")
            .style("fill-opacity", 0.1)
            .style("stroke-width", "2px");
        });

      legendRow.append("text")
        .attr("x", 25)
        .attr("y", 12)
        .attr("text-anchor", "start")
        .style("font-size", "12px")
        .style("cursor", "pointer")
        .text(team === "radiant" ? "Radiant Players" : "Dire Players");
    });

    // Add chart title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Player Performance Comparison");

    // Add instructions
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("fill", "#666")
      .text("Hover over players or points to see detailed stats");

    // Cleanup function
    return () => {
      tooltip.remove();
    };

  }, [players, width, height]);

  return (
    <div className="player-performance-chart">
      <svg ref={svgRef} width={width} height={height}></svg>
    </div>
  );
};

export default PlayerPerformanceChartTwo;