import React from 'react';
import { AppBar, Box, Toolbar, Typography } from '@mui/material';

export default function Layout({ children }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* --- TopBar --------------------------------------------------- */}
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            <b>QuickInsight</b>
          </Typography>
        </Toolbar>
      </AppBar>

      {/* --- Main content -------------------------------------------- */}
      {/* Toolbar span adds space equal to AppBar height */}
      <Toolbar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {children}
      </Box>
    </Box>
  );
}
