import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

export default function ChangesOverTime() {
  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle2" gutterBottom>
          Changes Over Time
        </Typography>
        <Box height={300} display="flex" justifyContent="center" alignItems="center" bgcolor="#f5f5f5">
          {/* TODO: Integrate LineChart component */}
          Line Chart Placeholder
        </Box>
      </CardContent>
    </Card>
  );
}
