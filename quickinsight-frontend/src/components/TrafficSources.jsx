import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

export default function TrafficSources() {
  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle2" gutterBottom>
          Traffic Sources
        </Typography>
        <Box height={300} display="flex" justifyContent="center" alignItems="center" bgcolor="#f5f5f5">
          {/* TODO: Integrate DonutChart component */}
          Donut Chart Placeholder
        </Box>
      </CardContent>
    </Card>
  );
}