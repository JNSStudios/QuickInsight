import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

export default function ChangesOverTime() {
  return (
    <Card sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Changes Over Time
        </Typography>
        <Box 
          sx={{ 
            flexGrow: 1,
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            bgcolor: '#f5f5f5',
            borderRadius: 1,
            minHeight: 400
          }}
        >
          {/* TODO: Integrate LineChart component */}
          Line Chart Placeholder
        </Box>
      </CardContent>
    </Card>
  );
}
