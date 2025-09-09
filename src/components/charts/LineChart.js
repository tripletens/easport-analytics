import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const LineChart = ({ data, width = 400, height = 300, margin = { top: 20, right: 30, bottom: 40, left: 40 } }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Parse dates if needed
    const parseTime = d3.timeParse("%Y-%m-%d");
    const formattedData = data.map(d => ({
      date: typeof d.date === 'string' ? parseTime(d.date) : d.date,
      value: d.value
    }));

    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(formattedData, d => d.date))
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(formattedData, d => d.value)])
      .range([innerHeight, 0])
      .nice();

    // Create line generator
    const line = d3.line()
      .x(d => xScale(d.date))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Create SVG group
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add x-axis
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(5));

    // Add y-axis
    g.append("g")
      .call(d3.axisLeft(yScale));

    // Add line
    g.append("path")
      .datum(formattedData)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Add points
    g.selectAll(".dot")
      .data(formattedData)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.date))
      .attr("cy", d => yScale(d.value))
      .attr("r", 4)
      .attr("fill", "steelblue")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("r", 6).attr("fill", "orange");
        // Add tooltip
        g.append("text")
          .attr("class", "tooltip")
          .attr("x", xScale(d.date))
          .attr("y", yScale(d.value) - 10)
          .attr("text-anchor", "middle")
          .text(d.value);
      })
      .on("mouseout", function() {
        d3.select(this).attr("r", 4).attr("fill", "steelblue");
        svg.selectAll(".tooltip").remove();
      });

  }, [data, width, height, margin]);

  return (
    <svg ref={svgRef} width={width} height={height}></svg>
  );
};

export default LineChart;