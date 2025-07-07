import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

export default function KPICard({ title, value, subValue, change, sx }) {
  return (
    <Card
      sx={{
        width: '100%',
        height: 120,   // fixed height for consistency
        display: 'flex',
        flexDirection: 'column',
        ...sx,
      }}
    >
      <CardContent sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between',
        p: 2,
        '&:last-child': { pb: 2 } // override default MUI padding
      }}>
        <Typography variant="subtitle2" gutterBottom>
          {title}
        </Typography>
        <Box>
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
        </Box>
      </CardContent>
    </Card>
  );
}
