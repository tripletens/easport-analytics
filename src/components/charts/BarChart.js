// src/components/charts/BarChart.js
import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const BarChart = ({ 
  data, 
  width = 600, 
  height = 400, 
  margin = { top: 20, right: 30, bottom: 60, left: 60 } 
}) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const x = d3.scaleBand()
      .domain(data.map(d => d.label))
      .range([0, chartWidth])
      .padding(0.3);

    // Force Y scale to percentage range
    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([chartHeight, 0]);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Bars
    g.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.label))
      .attr('y', d => y(d.value))
      .attr('width', x.bandwidth())
      .attr('height', d => chartHeight - y(d.value + 60))
      .attr('fill', '#4CAF50')
      .on('mouseover', function () {
        d3.select(this).attr('fill', '#2E7D32');
      })
      .on('mouseout', function () {
        d3.select(this).attr('fill', '#4CAF50');
      });

    // X Axis
    g.append('g')
      .attr('transform', `translate(0,${chartHeight })`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-40)')
      .style('text-anchor', 'end');

    // Y Axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(10).tickFormat(d => d + "%"));

    // Y Axis Label
    g.append('text')
      .attr('x', -chartHeight / 2)
      .attr('y', -margin.left + 15)
      .attr('transform', 'rotate(-90)')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Win Rate (%)');

  }, [data, width, height, margin]);

  return <svg ref={svgRef}></svg>;
};

export default BarChart;
