import React from 'react';
import { Card, Grid, Box, Typography } from '@mui/material';

import KPICard from './KPICard';
import ChangesOverTime from './ChangesOverTime';
import TrafficSources from './TrafficSources';
import InfoIcon from '@mui/icons-material/Info';
import { IconButton, Tooltip } from '@mui/material';

const kpis = [
  { title: 'Total visitors',           value: '22,251', subValue: '+4%'   , invertColors: false  },
  { title: 'Total revenue & purchases', value: '$6,234',   subValue: '792' , invertColors: false },
  { title: 'Top item sold',            value: 'Zip Hoodie'          , invertColors: false },
  { title: 'Refund Rate',              value: '0.32%', subValue: '-1.1%', invertColors: true },
];

export default function MainContent() {
  return (
    <>
      <Grid container spacing={2} justifyContent="center">
        {/* First 4 - KPI Cards, mapped like above*/}
        {kpis.map((kpi, index) => (
          <Card variant="outlined" key={index} sx={{ width: '23.5%', height: '100px', p: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <b>{kpi.title}</b>
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {kpi.value}
              </Typography>
              {kpi.subValue && (
                <Typography 
                  variant="h5" 
                  sx={{ 
                    color: (kpi.subValue.startsWith('+') || kpi.subValue.startsWith('-')) 
                      ? (() => {
                          const isPositive = kpi.subValue.startsWith('+');
                          const isNegative = kpi.subValue.startsWith('-');
                          
                          if (kpi.invertColors) {
                            // For metrics where negative is good (like refund rate)
                            return isNegative ? 'green' : (isPositive ? 'red' : 'inherit');
                          } else {
                            // Default: positive is good, negative is bad
                            return isPositive ? 'green' : (isNegative ? 'red' : 'inherit');
                          }
                        })()
                      : 'inherit',
                    fontWeight: 'bold'
                  }}
                >
                  {kpi.subValue}
                </Typography>
              )}
            </Box>
          </Card>
        ))}

        {/* Row 2: three cards */}

        {/* Change over time card */}
        <Card variant="outlined" sx={{ width: '30%', height: '350px', p: 2 }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
            Change Over Time
          </Typography>

          <p>Placeholder for graph</p>


        </Card>


        {/* Traffic Sources card */}
        
        <Card variant="outlined" sx={{ width: '30%', height: '350px', p: 2 }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
            Traffic Sources
          </Typography>

          <p>Placeholder for traffic</p>

        </Card>


        {/* AI Briefing card */}
        <Card variant="outlined" sx={{ width: '35%', height: '350px', p: 2, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', textAlign: 'center'}}>
            AI Brief
          </Typography>
          <Box
            sx={{
              height: '3px',
              background: 'linear-gradient(90deg,rgb(12, 15, 35) 0%, rgb(34, 41, 98) 25%, rgb(133, 247, 255) 50%,rgb(34, 41, 98) 75%, rgb(12, 15, 35) 100%)',
              backgroundSize: '200% 100%',
              animation: 'gradientShift 3s ease-in-out infinite, shadowShift 3s ease-in-out infinite',
              margin: '16px 0',
              '@keyframes gradientShift': {
                '0%, 100%': {
                  backgroundPosition: '0% 50%'
                },
                '50%': {
                  backgroundPosition: '100% 50%'
                }
              },
              '@keyframes shadowShift': {
                '0%, 100%': {
                  boxShadow: '0 0 8px rgba(102, 126, 234, 1.0)'
                },
                '50%': {
                  boxShadow: '0 0 8px rgba(118, 75, 162, 1.0)'
                }
              }
            }}
          />

          <p>Placeholder for AI Brief</p>

          <Box sx={{ mt: 'auto' }}>
            <hr style={{ color: '#333'}} />

            <p style={{ fontWeight: 'bold', textAlign: 'center', color: 'GrayText'}}>
              AI can be incorrect. Verify its statements.
            </p>
          </Box>

        </Card>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', justifyContent: 'center', mt: 3}}>
          <Typography variant="body1">© JNS 2025. For demonstration purposes only.</Typography>
          
          <Tooltip title="More Info">
            <IconButton 
              size="small"
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%'
              }}
            >
              <InfoIcon />
            </IconButton>
          </Tooltip>
        </Box>

      </Grid>

      
    </>
  );
}