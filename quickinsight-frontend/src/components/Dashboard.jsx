import React, { useState } from 'react';
import { AppBar, Box, Toolbar, Typography, Container, Tooltip, ToggleButton, ToggleButtonGroup} from '@mui/material';
import TopBar from './TopBar';
import MainContent from './MainContent';
import './styles.css';

export default function Dashboard() {
  const [selectedRange, setSelectedRange] = useState('3');
  // Used to determine the maximum available range (1, 3, 6, or 12)
  const monthRange = 3; //dynamically set based on data availability.

  const handleRangeChange = (event, newRange) => {
    if (newRange !== null) {
      setSelectedRange(newRange);
    }
  };

  // Button definitions
  const ranges = [
    { value: '1', label: 'Past month' },
    { value: '3', label: 'Past 3 months' },
    { value: '6', label: 'Past 6 months' },
    { value: '12', label: 'Past year' },
  ];

  // Helper to determine if a button should be disabled
  const isDisabled = (val) => parseInt(val) > monthRange;

  return (
    <>
      {/* Fixed AppBar */}
      <TopBar />

      {/* Main Content - starts below the fixed AppBar */}
      <Box 
        component="main" 
        className="dashboard-main"
      >
        <Box className="dashboard-header">
          <Typography variant="h5" component="h1">
            <b>
              {selectedRange === '1' && 'Past month'}
              {selectedRange === '3' && 'Past 3 months'}
              {selectedRange === '6' && 'Past 6 months'}
              {selectedRange === '12' && 'Past year'}
            </b>
          </Typography>
          <ToggleButtonGroup
            value={selectedRange}
            exclusive
            onChange={handleRangeChange}
            className="dashboard-btn-group"
            sx={{
              '& .MuiToggleButton-root': {
                borderRadius: '100px',
                textTransform: 'none',
                px: 3,
                py: 1,
                fontWeight: 500,
              },
            }}
          >
            {ranges.map(({ value, label }) => {
              const disabled = isDisabled(value);
              const btn = (
                <ToggleButton value={value} disabled={disabled} key={value}>{label}</ToggleButton>
              );
              return disabled ? (
                <Tooltip title="insufficient data to show this range" arrow disableInteractive key={value}>
                  <span>{btn}</span>
                </Tooltip>
              ) : btn;
            })}
          </ToggleButtonGroup>
        </Box>
        <MainContent />
      </Box>
    </>
  );
}
