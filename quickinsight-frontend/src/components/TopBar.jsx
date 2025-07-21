import React from 'react';
import PropTypes from 'prop-types';
import { Box, Avatar } from '@mui/material';
import { AppBar, Toolbar, Typography, Container } from '@mui/material';
import './styles.css';


export default function TopBar({ businessInfo }) {

  console.log("TopBar businessInfo:", businessInfo);

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          <b>QuickInsight Demo</b>
        </Typography>
        <Box flexGrow={1} />
        <Typography variant="h6" noWrap component="div">
          {businessInfo.business_name || 'Fetching business name from database...'}
        </Typography>

        <Box flexGrow={1} />
        <Box display="flex" alignItems="center" >
          <img src="/assets/stripe-logo.jpeg" alt="Stripe Connection" className="topbar-img" />
          <img src="/assets/ga-logo.png" alt="Google Analytics" className="topbar-img" />
          <img src="/assets/oai-logo.png" alt="OpenAI" className="topbar-img" />
          <Box flexGrow={1} />
          <Avatar alt="Test User Avatar" className="topbar-avatar" src="/assets/avatar-placeholder.png" />
        </Box>
      </Toolbar>
    </AppBar>
  );
}

TopBar.propTypes = {
  businessInfo: PropTypes.shape({
    business_name: PropTypes.string,
    business_industry: PropTypes.string,
  }),
};