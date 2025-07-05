import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

export default function AIBrief() {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          AI Brief
        </Typography>
        <Box height={600} overflow="auto" p={1} bgcolor="#fafafa">
          {/* TODO: Render AI-generated summary */}
          AI Brief Placeholder
        </Box>
      </CardContent>
    </Card>
  );
}