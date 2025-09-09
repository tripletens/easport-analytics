import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const PlayerPerformanceChart = ({ players, width = 800, height = 500 }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!players || players.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Set up margins and dimensions
    const margin = { top: 50, right: 30, bottom: 100, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Prepare data - calculate KDA ratio for each player
    const playerData = players.map(player => ({
      name: player.personaname || `Player ${player.account_id}`,
      hero_id: player.hero_id,
      kills: player.kills,
      deaths: player.deaths,
      assists: player.assists,
      kda: player.deaths === 0 ? (player.kills + player.assists) : ((player.kills + player.assists) / player.deaths).toFixed(2),
      isRadiant: player.isRadiant,
      win: player.win,
      net_worth: player.net_worth,
      hero_damage: player.hero_damage,
      gold_per_min: player.gold_per_min
    }));

    // Sort players by KDA (descending)
    playerData.sort((a, b) => b.kda - a.kda);

    // Create scales
    const xScale = d3.scaleBand()
      .domain(playerData.map(d => d.name))
      .range([0, innerWidth])
      .padding(0.3);

    const maxKDA = d3.max(playerData, d => parseFloat(d.kda));
    const yScale = d3.scaleLinear()
      .domain([0, maxKDA * 1.1])
      .range([innerHeight, 0])
      .nice();

    // Create SVG group
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add x-axis
    const xAxis = g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale));

    // Rotate x-axis labels for better readability
    xAxis.selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)")
      .style("font-size", "10px")
      .style("fill", "#666");

    // Add y-axis
    g.append("g")
      .call(d3.axisLeft(yScale).ticks(6))
      .style("font-size", "10px")
      .style("color", "#666");

    // Add y-axis label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 20)
      .attr("x", -innerHeight / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#2c3e50")
      .style("font-weight", "600")
      .text("KDA Ratio");

    // Add chart title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .style("fill", "#2c3e50")
      .text("Player Performance - KDA Ratio");

    // Add grid lines
    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(yScale)
        .ticks(6)
        .tickSize(-innerWidth)
        .tickFormat("")
      )
      .style("color", "#e1e8ed")
      .style("opacity", 0.7);

    // Add bars with different colors for Radiant and Dire
    const bars = g.selectAll(".bar")
      .data(playerData)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => xScale(d.name))
      .attr("y", d => yScale(d.kda))
      .attr("width", xScale.bandwidth())
      .attr("height", d => innerHeight - yScale(d.kda))
      .attr("fill", d => d.isRadiant ? "#4CAF50" : "#F44336") // Green for Radiant, Red for Dire
      .attr("rx", 4)
      .attr("ry", 4)
      .style("cursor", "pointer")
      .style("transition", "fill 0.2s ease");

    // Add value labels on top of bars
    g.selectAll(".bar-label")
      .data(playerData)
      .enter().append("text")
      .attr("class", "bar-label")
      .attr("x", d => xScale(d.name) + xScale.bandwidth() / 2)
      .attr("y", d => yScale(d.kda) - 8)
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("font-weight", "600")
      .style("fill", "#2c3e50")
      .style("pointer-events", "none")
      .text(d => d.kda);

    // Add team indicators
    g.append("text")
      .attr("x", innerWidth / 4)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("fill", "#4CAF50")
      .text("Radiant (Winners)");

    g.append("text")
      .attr("x", (3 * innerWidth) / 4)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("fill", "#F44336")
      .text("Dire (Losers)");

    // Add hover effects with detailed tooltip
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "d3-tooltip")
      .style("position", "absolute")
      .style("background", "white")
      .style("padding", "10px 14px")
      .style("border", "1px solid #ddd")
      .style("border-radius", "6px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("box-shadow", "0 4px 12px rgba(0,0,0,0.15)")
      .style("z-index", "1000")
      .style("min-width", "180px");

    bars.on("mouseover", function(event, d) {
        // Highlight bar
        d3.select(this)
          .attr("stroke", "#2c3e50")
          .attr("stroke-width", 2);

        // Calculate tooltip content
        const tooltipContent = `
          <div style="margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 6px;">
            <strong style="color: #2c3e50; font-size: 13px;">${d.name}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; gap: 15px; margin: 4px 0;">
            <span style="color: #7f8c8d;">Team:</span>
            <span style="font-weight: 600; color: ${d.isRadiant ? '#4CAF50' : '#F44336'};">${d.isRadiant ? 'Radiant' : 'Dire'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; gap: 15px; margin: 4px 0;">
            <span style="color: #7f8c8d;">Result:</span>
            <span style="font-weight: 600; color: ${d.win ? '#27ae60' : '#e74c3c'};">${d.win ? 'Victory' : 'Defeat'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; gap: 15px; margin: 4px 0;">
            <span style="color: #7f8c8d;">K/D/A:</span>
            <span style="font-weight: 600; color: #667eea;">${d.kills}/${d.deaths}/${d.assists}</span>
          </div>
          <div style="display: flex; justify-content: space-between; gap: 15px; margin: 4px 0;">
            <span style="color: #7f8c8d;">Net Worth:</span>
            <span style="font-weight: 600; color: #27ae60;">${d.net_worth.toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; gap: 15px; margin: 4px 0;">
            <span style="color: #7f8c8d;">GPM:</span>
            <span style="font-weight: 600; color: #f39c12;">${d.gold_per_min}</span>
          </div>
          <div style="display: flex; justify-content: space-between; gap: 15px; margin: 4px 0;">
            <span style="color: #7f8c8d;">Hero Damage:</span>
            <span style="font-weight: 600; color: #e74c3c;">${d.hero_damage.toLocaleString()}</span>
          </div>
        `;

        // Show tooltip
        tooltip
          .html(tooltipContent)
          .style("opacity", 1)
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mousemove", function(event) {
        tooltip
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        // Reset bar style
        d3.select(this)
          .attr("stroke", "none")
          .attr("stroke-width", 0);

        // Hide tooltip
        tooltip.style("opacity", 0);
      });

  }, [players, width, height]);

  return (
    <div className="player-performance-chart">
      <svg 
        ref={svgRef} 
        width={width} 
        height={height}
        style={{ display: 'block', margin: '0 auto' }}
      ></svg>
    </div>
  );
};

export default PlayerPerformanceChart;