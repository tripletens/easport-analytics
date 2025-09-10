import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { getCountryName } from './../../utils/countries';

const PieChart = ({ data, width = 300, height = 300, margin = 40 }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;
    console.log("countries data region", {data});
    // Transform data: add full country name
    const processedData = data.map(d => ({
      ...d,
      fullLabel: getCountryName(d.label.toUpperCase()) 
    }));

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const radius = Math.min(width, height) / 2 - margin;
    const innerRadius = radius * 0.5;

    // Create color scale
    const color = d3.scaleOrdinal()
      .domain(processedData.map(d => d.label))
      .range(d3.quantize(d3.interpolateRainbow, processedData.length + 1));

    // Pie generator
    const pie = d3.pie()
      .value(d => d.value)
      .sort(null);

    // Arc generator
    const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(radius);

    // Group
    const g = svg.append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    // Tooltip
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "d3-tooltip")
      .style("position", "absolute")
      .style("background", "#fff")
      .style("padding", "8px 12px")
      .style("border", "1px solid #ddd")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("box-shadow", "0 2px 8px rgba(0,0,0,0.15)");

    // Arcs
    const arcs = g.selectAll(".arc")
      .data(pie(processedData))
      .enter().append("g")
      .attr("class", "arc");

    // Paths
    arcs.append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data.label))
      .attr("stroke", "white")
      .style("stroke-width", "2px")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("opacity", 0.8);

        tooltip
          .style("opacity", 1)
          .html(`
            <div><strong>${d.data.fullLabel}</strong></div>
            <div>Value: ${d.data.value}</div>
            <div>Percentage: ${((d.data.value / d3.sum(processedData, x => x.value)) * 100).toFixed(1)}%</div>
          `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mousemove", function(event) {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).attr("opacity", 1);
        tooltip.style("opacity", 0);
      });

    // Percentage labels inside
    arcs.append("text")
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .attr("text-anchor", "middle")
      .text(d => `${((d.data.value / d3.sum(processedData, x => x.value)) * 100).toFixed(1)}%`)
      .style("font-size", "10px")
      .style("font-weight", "bold")
      .style("fill", "white");

    // Outer labels
    const labelArc = d3.arc()
      .outerRadius(radius + 20)
      .innerRadius(radius + 20);

    arcs.append("text")
      .attr("transform", d => {
        const pos = labelArc.centroid(d);
        pos[0] = radius * 1.1 * (midAngle(d) < Math.PI ? 1 : -1);
        return `translate(${pos})`;
      })
      .attr("dy", "0.35em")
      .attr("text-anchor", d => midAngle(d) < Math.PI ? "start" : "end")
      .text(d => {
        const label = d.data.fullLabel;
        return label.length > 10 ? label.substring(0, 10) + '...' : label;
      })
      .style("font-size", "10px")
      .style("fill", "#666");

    function midAngle(d) {
      return d.startAngle + (d.endAngle - d.startAngle) / 2;
    }

    return () => {
      tooltip.remove();
    };

  }, [data, width, height, margin]);

  return (
    <svg ref={svgRef} width={width} height={height}></svg>
  );
};

export default PieChart;
