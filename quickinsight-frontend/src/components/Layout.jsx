import React from 'react';
import { AppBar, Box, Toolbar, Typography } from '@mui/material';
import TopBar from './TopBar';

export default function Layout({ children }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Bar with Logos & Avatar */}
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            <b>QuickInsight Demo</b>
          </Typography>
          <Box flexGrow={1} />
          <TopBar />
        </Toolbar>
      </AppBar>

      {/* Spacer for fixed AppBar */}
      <Toolbar />

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {children}
      </Box>

    </Box>
  );
}
