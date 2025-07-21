import React from 'react';
import { Box, Typography } from '@mui/material';

export default function CustomTooltip({ active, payload, label, currencySymbol = '$' }) {
  if (!active || !payload?.length) return null;

  return (
    <Box sx={{ p: 1, bgcolor: 'background.paper', color: 'text.primary', border: 1, borderColor: 'divider' }}>
      <Typography variant="subtitle2">{label}</Typography>
      {payload.map((row) => (
        <Typography key={row.dataKey} variant="body2">
          {String(row.name).charAt(0).toUpperCase() + String(row.name).slice(1)}:{" "}
          {row.name === 'revenue' ? currencySymbol : ''}
          {row.value.toLocaleString()}
        </Typography>
      ))}
    </Box>
  );
}


CustomTooltip.propTypes = {
  active:    (props, propName, componentName) => typeof props[propName] !== 'boolean' ? new Error(`Invalid prop ${propName} supplied to ${componentName}. Expected boolean.`) : null,
  payload:   (props, propName, componentName) => !Array.isArray(props[propName]) ? new Error(`Invalid prop ${propName} supplied to ${componentName}. Expected array.`) : null,
  label:     (props, propName, componentName) => typeof props[propName] !== 'string' ? new Error(`Invalid prop ${propName} supplied to ${componentName}. Expected string.`) : null,
  currencySymbol: (props, propName, componentName) => typeof props[propName] !== 'string' ? new Error(`Invalid prop ${propName} supplied to ${componentName}. Expected string.`) : null,
};