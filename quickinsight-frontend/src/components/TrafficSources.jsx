import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, Typography, Box } from '@mui/material';

import { Pie, Cell, PieChart, ResponsiveContainer, Sector, AreaChart, Area, LineChart, Line, CartesianGrid, XAxis, YAxis, Legend, Tooltip } from 'recharts';


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



  // Custom label renderer that truncates with ellipsis if too long
  const LABEL_WIDTH = 80;
  const renderTruncatedLabel = ({ name, x, y, textAnchor, fill }) => {
    // If label is on the left, shift box to the left by its width
    const adjustedX = textAnchor === 'end' ? x - LABEL_WIDTH : x;
    return (
      <foreignObject x={adjustedX} y={y - 10} width={LABEL_WIDTH} height={20} style={{ overflow: 'visible' }}>
        <div
          style={{
            maxWidth: LABEL_WIDTH,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: fill || '#fff',
            fontSize: 14,
            textAlign: textAnchor === 'end' ? 'right' : 'left',
            marginLeft: textAnchor === 'end' ? 0 : 4,
            marginRight: textAnchor === 'end' ? 4 : 0,
          }}
          title={name}
        >
          <b>{name}</b>
        </div>
      </foreignObject>
    );
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', height: 400 }}>
      <Box
        sx={{
          position: 'absolute',
          top: '39%',
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
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={sortedData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="45%"
            innerRadius={50}
            outerRadius={80}
            fill="#8884d8"
            label={renderTruncatedLabel}
            animationDuration={400}
            animationEasing='ease-in-out'
            animationBegin={true}
          >
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Legend />
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
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
