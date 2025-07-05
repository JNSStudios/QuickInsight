import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

export default function KPICard({ title, value, subValue, change, sx }) {
  return (
    <Card
      sx={{
        width: '100%',    // always fill the column
        height: '100%',   // useful if you want uniform heights
        display: 'flex',
        flexDirection: 'column',
        ...sx,            // allow overrides
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h5">{value}</Typography>
        {subValue && <Typography variant="h6">{subValue}</Typography>}
        {change && (
          <Typography
            variant="body2"
            color={change.startsWith('-') ? 'error' : 'success.main'}
          >
            {change}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
