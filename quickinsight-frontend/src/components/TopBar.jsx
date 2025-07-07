import React from 'react';
import { Box, Avatar } from '@mui/material';
import { AppBar, Toolbar, Typography, Container } from '@mui/material';


export default function TopBar() {
  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          <b>QuickInsight Demo</b>
        </Typography>
        <Box flexGrow={1} />
        <Box display="flex" alignItems="center" >
          <img src="/assets/stripe-logo.jpeg" alt="Stripe Connection" height={32} style={{ marginRight: 12, borderRadius: 100, border: "3px solid Chartreuse"}} />
          <img src="/assets/ga-logo.png" alt="Google Analytics" height={32} style={{ marginRight: 12, borderRadius: 100, border: "3px solid Chartreuse"}} />
          <img src="/assets/oai-logo.png" alt="OpenAI" height={32} style={{ marginRight: 12, borderRadius: 100, border: "3px solid Chartreuse"}} />
          <Box flexGrow={1} />
          <Avatar alt="User Avatar" sx={{ ml: 3 }} src="/assets/avatar-placeholder.png" />
        </Box>
      </Toolbar>
    </AppBar>
  );
}