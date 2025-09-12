import React, { useMemo } from 'react';
import * as d3 from 'd3';
import { D3BaseChart } from '../components/charts';

const PlayerPerformanceChart = ({ players, width = 800, height = 500, className = "" }) => {
    const processedData = useMemo(() => {
        if (!players?.length) return [];

        return players
            .map(player => ({
                name: player.personaname || `Player ${player.account_id}`,
                value: player.deaths === 0
                    ? (player.kills + player.assists)
                    : ((player.kills + player.assists) / player.deaths),
                kills: player.kills || 0,
                deaths: player.deaths || 0,
                assists: player.assists || 0,
                isRadiant: player.isRadiant,
                win: player.win === 1,
                net_worth: player.net_worth || 0,
                hero_damage: player.hero_damage || 0,
                gold_per_min: player.gold_per_min || 0,
                hero_id: player.hero_id
            }))
            .sort((a, b) => b.value - a.value);
    }, [players]);

    const renderBarChart = (svg, g, { innerWidth, innerHeight, data, margin }) => {
        if (!data?.length) return;

        // Y-scale with padding
        const maxValue = d3.max(data, d => d.value) || 10;
        const yScale = d3.scaleLinear()
            .domain([0, Math.max(maxValue * 1.1, 5)])
            .range([innerHeight, 0])
            .nice();

        // X-scale
        const xScale = d3.scaleBand()
            .domain(data.map(d => d.name))
            .range([0, innerWidth])
            .padding(0.3);

        // Colors: green (Radiant), red (Dire)
        const colorScale = d3.scaleOrdinal()
            .domain(data.map(d => d.name))
            .range(data.map(d => d.isRadiant ? "#4CAF50" : "#F44336"));

        // Axes
        const xAxis = g.append("g")
            .attr("transform", `translate(0, ${innerHeight})`)
            .call(d3.axisBottom(xScale));

        xAxis.selectAll("text")
            .attr("class", "text-xs fill-gray-400")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end")
            .attr("dx", "-0.8em")
            .attr("dy", "0.15em");

        const yAxis = g.append("g")
            .call(d3.axisLeft(yScale).ticks(6));

        yAxis.selectAll("text")
            .attr("class", "text-xs fill-gray-400");

        // Axis labels
        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left + 15)
            .attr("x", -innerHeight / 2)
            .attr("dy", "1em")
            .attr("class", "text-sm font-semibold fill-gray-400")
            .style("text-anchor", "middle")
            .text("KDA Ratio");

        g.append("text")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight + margin.bottom - 20)
            .attr("class", "text-sm font-semibold fill-gray-400")
            .style("text-anchor", "middle")
            .text("Players");

        // Bars
        data.forEach(playerData => {
            const barHeight = Math.max(0, innerHeight - yScale(playerData.value));
            const barY = Math.max(0, yScale(playerData.value));

            const bar = g.append("rect")
                .attr("x", xScale(playerData.name))
                .attr("y", barY)
                .attr("width", xScale.bandwidth())
                .attr("height", barHeight)
                .attr("fill", colorScale(playerData.name))
                .attr("rx", 4)
                .attr("ry", 4)
                .style("cursor", "pointer");

            // Label above bar
            if (barHeight > 20) {
                g.append("text")
                    .attr("x", xScale(playerData.name) + xScale.bandwidth() / 2)
                    .attr("y", barY - 5)
                    .attr("text-anchor", "middle")
                    .attr("class", "text-xs font-semibold fill-gray-800")
                    .text(playerData.value.toFixed(2));
            }

            // Tooltip
            //   bar.on("mouseover", function () {
            //     d3.select(this)
            //       .transition()
            //       .duration(200)
            //       .attr("fill", d3.color(colorScale(playerData.name)).brighter(0.3));

            //     const tooltip = svg.append("g")
            //       .attr("class", "tooltip")
            //       .style("pointer-events", "none");

            //     const tooltipWidth = 200;
            //     const tooltipHeight = 160;
            //     const xPos = Math.max(0, Math.min(
            //       xScale(playerData.name) + xScale.bandwidth() / 2 - tooltipWidth / 2,
            //       width - tooltipWidth - margin.right
            //     ));
            //     const yPos = Math.max(margin.top, barY - tooltipHeight - 10);

            //     tooltip.append("rect")
            //       .attr("x", xPos)
            //       .attr("y", yPos)
            //       .attr("width", tooltipWidth)
            //       .attr("height", tooltipHeight)
            //       .attr("fill", "#1F2937")
            //       .attr("rx", 6)
            //       .attr("ry", 6)
            //       .attr("opacity", 0.95);

            //     const tooltipContent = [
            //       { label: "Player", value: playerData.name, color: "#E5E7EB" },
            //       { label: "Team", value: playerData.isRadiant ? "Radiant" : "Dire", color: playerData.isRadiant ? "#4CAF50" : "#F44336" },
            //       { label: "Result", value: playerData.win ? "Victory" : "Defeat", color: playerData.win ? "#27ae60" : "#e74c3c" },
            //       { label: "K/D/A", value: `${playerData.kills}/${playerData.deaths}/${playerData.assists}`, color: "#667eea" },
            //       { label: "Net Worth", value: playerData.net_worth.toLocaleString(), color: "#27ae60" },
            //       { label: "GPM", value: playerData.gold_per_min, color: "#f39c12" },
            //       { label: "Hero Damage", value: playerData.hero_damage.toLocaleString(), color: "#e74c3c" }
            //     ];

            //     tooltipContent.forEach((item, index) => {
            //       tooltip.append("text")
            //         .attr("x", xPos + 10)
            //         .attr("y", yPos + 25 + index * 20)
            //         .attr("fill", "#9CA3AF")
            //         .style("font-size", "11px")
            //         .text(item.label + ":");

            //       tooltip.append("text")
            //         .attr("x", xPos + tooltipWidth - 10)
            //         .attr("y", yPos + 25 + index * 20)
            //         .attr("text-anchor", "end")
            //         .attr("fill", item.color)
            //         .style("font-size", "11px")
            //         .style("font-weight", "600")
            //         .text(item.value);
            //     });
            //   })
            //   .on("mouseout", function () {
            //     d3.select(this)
            //       .transition()
            //       .duration(200)
            //       .attr("fill", colorScale(playerData.name));

            //     svg.selectAll(".tooltip").remove();
            //   });

            bar.on("mouseover", function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("fill", d3.color(colorScale(playerData.name)).brighter(0.3));

                // Use `g` instead of `svg` so tooltip aligns with bars and axes
                const tooltip = g.append("g")
                    .attr("class", "tooltip")
                    .style("pointer-events", "none");

                const tooltipWidth = 200;
                const tooltipHeight = 160;

                // Corrected X/Y positioning to match inner chart area
                const xPos = Math.max(
                    0,
                    Math.min(
                        xScale(playerData.name) + xScale.bandwidth() / 2 - tooltipWidth / 2,
                        innerWidth - tooltipWidth
                    )
                );
                const yPos = Math.max(0, barY - tooltipHeight - 10);

                tooltip.append("rect")
                    .attr("x", xPos)
                    .attr("y", yPos)
                    .attr("width", tooltipWidth)
                    .attr("height", tooltipHeight)
                    .attr("fill", "#1F2937")
                    .attr("rx", 6)
                    .attr("ry", 6)
                    .attr("opacity", 0.95);

                const tooltipContent = [
                    { label: "Player", value: playerData.name, color: "#E5E7EB" },
                    { label: "Team", value: playerData.isRadiant ? "Radiant" : "Dire", color: playerData.isRadiant ? "#4CAF50" : "#F44336" },
                    { label: "Result", value: playerData.win ? "Victory" : "Defeat", color: playerData.win ? "#27ae60" : "#e74c3c" },
                    { label: "K/D/A", value: `${playerData.kills}/${playerData.deaths}/${playerData.assists}`, color: "#667eea" },
                    { label: "Net Worth", value: playerData.net_worth.toLocaleString(), color: "#27ae60" },
                    { label: "GPM", value: playerData.gold_per_min, color: "#f39c12" },
                    { label: "Hero Damage", value: playerData.hero_damage.toLocaleString(), color: "#e74c3c" }
                ];

                tooltipContent.forEach((item, index) => {
                    tooltip.append("text")
                        .attr("x", xPos + 10)
                        .attr("y", yPos + 25 + index * 20)
                        .attr("fill", "#9CA3AF")
                        .style("font-size", "11px")
                        .text(item.label + ":");

                    tooltip.append("text")
                        .attr("x", xPos + tooltipWidth - 10)
                        .attr("y", yPos + 25 + index * 20)
                        .attr("text-anchor", "end")
                        .attr("fill", item.color)
                        .style("font-size", "11px")
                        .style("font-weight", "600")
                        .text(item.value);
                });
            })
                .on("mouseout", function () {
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .attr("fill", colorScale(playerData.name));

                    g.selectAll(".tooltip").remove(); // remove from `g` instead of svg
                });

        });

        // Team labels
        const radiantCount = data.filter(d => d.isRadiant).length;
        const direCount = data.filter(d => !d.isRadiant).length;

        if (radiantCount) {
            g.append("text")
                .attr("x", innerWidth / 4)
                .attr("y", -15)
                .attr("text-anchor", "middle")
                .attr("class", "text-sm font-semibold")
                .attr("fill", "#4CAF50")
                .text(`Radiant (${radiantCount})`);
        }

        if (direCount) {
            g.append("text")
                .attr("x", (3 * innerWidth) / 4)
                .attr("y", -15)
                .attr("text-anchor", "middle")
                .attr("class", "text-sm font-semibold")
                .attr("fill", "#F44336")
                .text(`Dire (${direCount})`);
        }
    };

    if (!processedData.length) {
        return (
            <div className="bg-gray-900/50 rounded-lg p-8 text-center border border-gray-700">
                <div className="text-gray-400">No player data available</div>
            </div>
        );
    }

    return (
        <D3BaseChart
            data={processedData}
            width={width}
            height={height}
            renderChart={renderBarChart}
            className={className}
            margin={{ top: 60, right: 30, bottom: 80, left: 60 }}
        />
    );
};

export default PlayerPerformanceChart;
