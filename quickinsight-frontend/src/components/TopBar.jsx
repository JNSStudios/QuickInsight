import React from 'react';
import { Box, Avatar } from '@mui/material';
import { AppBar, Toolbar, Typography, Container } from '@mui/material';
import './styles.css';


export default function TopBar() {
  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          <b>QuickInsight Demo</b>
        </Typography>
        <Box flexGrow={1} />
        <Box display="flex" alignItems="center" >
          <img src="/assets/stripe-logo.jpeg" alt="Stripe Connection" className="topbar-img" />
          <img src="/assets/ga-logo.png" alt="Google Analytics" className="topbar-img" />
          <img src="/assets/oai-logo.png" alt="OpenAI" className="topbar-img" />
          <Box flexGrow={1} />
          <Avatar alt="User Avatar" className="topbar-avatar" src="/assets/avatar-placeholder.png" />
        </Box>
      </Toolbar>
    </AppBar>
  );
}