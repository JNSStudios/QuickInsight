import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Typography, Box } from '@mui/material';
import './styles.css';

import { Pie, Cell, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts';


// AnimatedNumber: animates a number from previous to next value
function AnimatedNumber({ value, duration = 400 }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);
  const raf = useRef();

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    const startTime = performance.now();

    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.round(start + (end - start) * progress);
      setDisplayValue(current);
      if (progress < 1) {
        raf.current = requestAnimationFrame(animate);
      } else {
        prevValue.current = end;
      }
    }
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);

  return displayValue.toLocaleString();
}

export default function TrafficSources({ data }) {
  // Position the pie chart to center it properly with room for legend below
  const CHART_CY = 30; // percentage from top (0-100) - centered for the donut
  // Helper to interpolate between green and red
  function getGradientColor(t) {
    // t: 0 (green) to 1 (red)
    const r = Math.round(255 * t);
    const g = Math.round(200 * (1 - t) + 55 * t); // 200 (green) to 55 (red)
    const b = 0;
    return `rgb(${r},${g},${b})`;
  }

  // Sort data by value descending
  let sortedData = data
    .map(item => ({
      name: item.source,
      value: item.users || 0,
      purchases: item.purchases,
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);


  // Assign gradient colors
  const n = sortedData.length;
  sortedData = sortedData.map((item, idx) => ({
    ...item,
    color: getGradientColor(idx / Math.max(n - 1, 1)),
  }));

  // Calculate total users
  const totalUsers = sortedData.reduce((sum, item) => sum + item.value, 0);

  // console.log("TrafficSources rendering with data:", sortedData);



  // No slice labels around the chart; legend below will describe segments

  return (
    <Box sx={{ width: '100%', height: 500 }}>
      {/* Chart area */}
      <Box sx={{ position: 'relative', width: '100%', height: 320 }}>
        <Box
          sx={{
            position: 'absolute',
            top: `${CHART_CY}%`,
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2,
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontSize: 14, fontWeight: 500 }}>
            Total Users
          </Typography>
          <Typography variant="h4" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, fontSize: 16, lineHeight: 1 }}>
            <AnimatedNumber value={totalUsers} />
          </Typography>
        </Box>
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={sortedData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy={`${CHART_CY}%`}
              innerRadius={50}
              outerRadius={80}
              fill="#8884d8"
              label={false}
              labelLine={false}
              animationDuration={400}
              animationEasing='ease-in-out'
              animationBegin={0}
            >
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name) => [value.toLocaleString(), name]}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Legend positioned at bottom of chart area */}
        <Box sx={{ 
          position: 'absolute',
          bottom: 35,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 3,
          width: '90%'
        }}>
          <div className="traffic-sources-container">
            {sortedData.map((item, index) => (
              <div 
                key={index}
                className="traffic-sources-legend-item"
              >
                <div 
                  className="traffic-sources-color-square"
                  style={{ backgroundColor: item.color }}
                />
                <span className="traffic-sources-name">
                  {item.name}
                </span>
                <span className="traffic-sources-count">
                  ({item.value.toLocaleString()})
                </span>
              </div>
            ))}
          </div>
        </Box>
      </Box>
    </Box>
  );
}

TrafficSources.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      source:         PropTypes.string.isRequired,
      users:          PropTypes.number,
      purchases:      PropTypes.number,
    }),
  ).isRequired,
};
