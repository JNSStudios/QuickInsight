import React from 'react';
import { Card, Grid, Box, Typography } from '@mui/material';

import KPICard from './KPICard';
import ChangesOverTime from './ChangesOverTime';
import TrafficSources from './TrafficSources';
import InfoIcon from '@mui/icons-material/Info';
import { IconButton, Tooltip } from '@mui/material';
import './styles.css';

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
          <Card variant="outlined" key={index} className="card-dashboard">
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <b>{kpi.title}</b>
            </Typography>
            <Box style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Typography variant="h4" component="div" style={{ fontWeight: 'bold' }}>
                {kpi.value}
              </Typography>
              {kpi.subValue && (
                <Typography 
                  variant="h5" 
                  style={{ 
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
        <Card variant="outlined" className="card-row">
          <Typography variant="h5" component="div" style={{ fontWeight: 'bold' }}>
            Change Over Time
          </Typography>

          <p>Placeholder for graph</p>


        </Card>


        <Card variant="outlined" className="card-row">
          <Typography variant="h5" component="div" style={{ fontWeight: 'bold' }}>
            Traffic Sources
          </Typography>

          <p>Placeholder for traffic</p>

        </Card>


        <Card variant="outlined" className="card-brief">
          <Typography variant="h4" component="div" style={{ fontWeight: 'bold', textAlign: 'center'}}>
            AI Brief
          </Typography>
          <div className="ai-brief-gradient" />

          <p>Placeholder for AI Brief</p>

          <Box style={{ marginTop: 'auto' }}>
            <hr style={{ color: '#333'}} />

            <p style={{ fontWeight: 'bold', textAlign: 'center', color: 'GrayText'}}>
              AI can be incorrect. Verify its statements.
            </p>
          </Box>

        </Card>

        <Box className="maincontent-footer">
          <Typography variant="body1">© JNS 2025. For demonstration purposes only.</Typography>
          
          <Tooltip title="More Info">
            <IconButton 
              size="small"
              style={{ width: 32, height: 32, borderRadius: '50%' }}
            >
              <InfoIcon />
            </IconButton>
          </Tooltip>
        </Box>

      </Grid>

      
    </>
  );
}