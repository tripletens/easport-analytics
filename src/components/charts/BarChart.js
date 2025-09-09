import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const BarChart = ({ 
  data, 
  width = 600, 
  height = 500,
  margin = { top: 40, right: 30, bottom: 120, left: 70 },
  xAxisLabel = "Category",
  yAxisLabel = "Value",
  barColor = "#667eea",
  hoverColor = "#5a6fd8"
}) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    let tooltip = d3.select("body").select(".d3-tooltip");
    if (tooltip.empty()) {
      tooltip = d3.select("body")
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
        .style("min-width", "120px");
    }

    const innerWidth = Math.max(0, width - margin.left - margin.right);
    const innerHeight = Math.max(0, height - margin.top - margin.bottom);

    const xScale = d3.scaleBand()
      .domain(data.map(d => d.label))
      .range([0, innerWidth])
      .padding(0.3);

    // INCREASED PADDING: Makes bars shorter by adding more space at the top
    const maxValue = d3.max(data, d => Math.max(0, d.value));
    const yScale = d3.scaleLinear()
      .domain([0, maxValue * 1.2]) // Increased from 1.05 to 1.2 (20% padding)
      .range([innerHeight, 0])
      .nice();

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add x-axis
    const xAxis = g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale));

    xAxis.selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)")
      .style("font-size", "10px")
      .style("fill", "#666");

    // Add x-axis label
    g.append("text")
      .attr("transform", `translate(${innerWidth / 2}, ${innerHeight + margin.bottom - 40})`)
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#2c3e50")
      .style("font-weight", "600")
      .text(xAxisLabel);

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
      .text(yAxisLabel);

    // Add chart title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .style("fill", "#2c3e50")
      .text(`${yAxisLabel} by ${xAxisLabel}`);

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

    // Add bars - they will be shorter due to the increased padding
    const bars = g.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => xScale(d.label))
      .attr("y", d => yScale(d.value))
      .attr("width", xScale.bandwidth())
      .attr("height", d => innerHeight - yScale(d.value))
      .attr("fill", barColor)
      .attr("rx", 4)
      .attr("ry", 4)
      .style("cursor", "pointer")
      .style("transition", "fill 0.2s ease");

    // Add hover effects
    bars.on("mouseover", function(event, d) {
        d3.select(this)
          .attr("fill", hoverColor)
          .attr("stroke", "#2c3e50")
          .attr("stroke-width", 2);

        const tooltipContent = `
          <div style="margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 6px;">
            <strong style="color: #2c3e50; font-size: 13px;">${d.fullLabel || d.label}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; gap: 15px; margin: 4px 0;">
            <span style="color: #7f8c8d;">Value:</span>
            <span style="font-weight: 600; color: #667eea;">${typeof d.value === 'number' ? d.value.toLocaleString() : d.value}</span>
          </div>
          ${d.percentage ? `
          <div style="display: flex; justify-content: space-between; gap: 15px; margin: 4px 0;">
            <span style="color: #7f8c8d;">Percentage:</span>
            <span style="font-weight: 600; color: #27ae60;">${d.percentage}%</span>
          </div>
          ` : ''}
          ${d.wins !== undefined ? `
          <div style="display: flex; justify-content: space-between; gap: 15px; margin: 4px 0;">
            <span style="color: #7f8c8d;">Wins:</span>
            <span style="font-weight: 600; color: #27ae60;">${d.wins}</span>
          </div>
          ` : ''}
          ${d.losses !== undefined ? `
          <div style="display: flex; justify-content: space-between; gap: 15px; margin: 4px 0;">
            <span style="color: #7f8c8d;">Losses:</span>
            <span style="font-weight: 600; color: #e74c3c;">${d.losses}</span>
          </div>
          ` : ''}
          ${d.totalGames !== undefined ? `
          <div style="display: flex; justify-content: space-between; gap: 15px; margin: 4px 0;">
            <span style="color: #7f8c8d;">Total Games:</span>
            <span style="font-weight: 600; color: #667eea;">${d.totalGames}</span>
          </div>
          ` : ''}
        `;

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
        d3.select(this)
          .attr("fill", barColor)
          .attr("stroke", "none")
          .attr("stroke-width", 0);
        tooltip.style("opacity", 0);
      });

    // Add value labels on top of bars
    g.selectAll(".bar-label")
      .data(data)
      .enter().append("text")
      .attr("class", "bar-label")
      .attr("x", d => xScale(d.label) + xScale.bandwidth() / 2)
      .attr("y", d => yScale(d.value) - 8)
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("font-weight", "600")
      .style("fill", "#2c3e50")
      .style("pointer-events", "none")
      .text(d => typeof d.value === 'number' ? d.value.toLocaleString() : d.value);

  }, [data, width, height, margin, xAxisLabel, yAxisLabel, barColor, hoverColor]);

  return (
    <div className="bar-chart-container">
      <svg 
        ref={svgRef} 
        width={width} 
        height={height}
        style={{ display: 'block', margin: '0 auto' }}
      ></svg>
    </div>
  );
};

export default BarChart;