import React from 'react';
import { AppBar, Box, Toolbar, Typography, Container } from '@mui/material';
import TopBar from './TopBar';
import MainContent from './MainContent';

export default function Dashboard() {
  return (
    <>
      {/* Fixed AppBar */}
      <TopBar />

      {/* Main Content - starts below the fixed AppBar */}
      <Box 
        component="main" 
        sx={{ 
          mt: 8, // Offset for AppBar height
          minHeight: 'calc(100vh - 64px)', // Full height minus AppBar
          width: '100vw', // Full viewport width
          px: 3, // Horizontal padding
        }}
      >
        <Box sx={{ py: 3, pl: 3, width: '100%' }}>
          <Typography variant="h5" component="h1">
            <b>Past 3 months (Nov 2020 - Jan 2021)</b>
          </Typography>
        </Box>
        
        <MainContent />
      </Box>
    </>
  );
}
