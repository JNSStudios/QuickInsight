import React, { useState, useEffect } from 'react';
import { 
  Box, Card, Grid, Typography, Tooltip, IconButton, 
  ToggleButton, ToggleButtonGroup
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import './styles.css';

import TopBar from './TopBar';
import KPICard from './KPICard';
import ChangesOverTime from './ChangesOverTime';
import TrafficSources from './TrafficSources';



export default function Dashboard() {
  // Button definitions
  const ranges = [
    { value: 1, label: 'Past month' },
    { value: 3, label: 'Past 3 months' },
    { value: 6, label: 'Past 6 months' },
    { value: 12, label: 'Past year' },
  ];

  const [maxDataRange, setMaxDataRange] = useState(3);
  const [viewingDataRange, setViewingDataRange] = useState(maxDataRange); // Will be corrected by useEffect
  const [kpis, setKpis] = useState([]);

  const isMock = true; // Set to false when using real data
  const apiEndpoint = isMock ? "http://localhost:3000/api/" : "OTHER GOES HERE";

  const testKPIs = [
    { title: 'Total visitors', value: '22,251', subValue: '+4%', invertColors: false },
    { title: 'Total revenue & purchases', value: '$6,234', subValue: '792' , invertColors: false },
    { title: 'Top item sold', value: 'Zip Hoodie', invertColors: false },
    { title: 'Refund Rate', value: '0.32%', subValue: '-1.1%', invertColors: true },
  ];

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const params = new URLSearchParams({
          period: viewingDataRange.toString()
        });

        // Fetch all KPI data in parallel for current period
        const [visitorsRes, revenueRes, topItemRes, refundRes, refundChangeRes] = await Promise.all([
          fetch(`${apiEndpoint}visitors?${params}`),
          fetch(`${apiEndpoint}revenue-and-purchases?${params}`),
          fetch(`${apiEndpoint}top-item?${params}`),
          fetch(`${apiEndpoint}refund-rate?${params}`),
          fetch(`${apiEndpoint}refund-rate/change?${params}`)
        ]);

        const visitorsData = await visitorsRes.json();
        const revenueData = await revenueRes.json();
        const topItemData = await topItemRes.json();
        const refundData = await refundRes.json();
        const refundChangeData = await refundChangeRes.json();

        // Fetch today's visitors (latest day in period)
        const visitorsTodayRes = await fetch(`${apiEndpoint}visitors?latestDay=true&${params}`);
        const visitorsTodayData = await visitorsTodayRes.json();

        // Use percentChange from backend
        let refundChange;
        if (typeof refundChangeData.data?.percentChange === 'number') {
          const percent = refundChangeData.data.percentChange;
          refundChange = `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}%`;
        } else {
          // If no percentChange, show 0.0% with sign matching current vs previous
          const current = refundChangeData.data?.current;
          const previous = refundChangeData.data?.previous;
          let sign = '';
          if (typeof current === 'number' && typeof previous === 'number') {
            if (current > previous) sign = '+';
            else if (current < previous) sign = '-';
            else sign = '';
          } else {
            sign = '';
          }
          refundChange = `0.0%`;
        }

        // Transform API data to KPI format
        const kpiData = [
          { 
            title: 'Total Visitors / Today\'s Visitors', 
            value: visitorsData.value?.toLocaleString() || '0', 
            subValue: visitorsTodayData.value?.toLocaleString() || '0',
            invertColors: false 
          },
          { 
            title: 'Total revenue / purchases', 
            value: `$${(revenueData.data?.gross ?? 0).toLocaleString()}`,
            subValue: revenueData.data?.orders?.toString() || '0',
            invertColors: false 
          },
          { 
            title: 'Top item sold', 
            value: topItemData.data?.[0]?.name || 'No data', 
            invertColors: false 
          },
          { 
            title: 'Refund Rate / Change Over Time', 
            value: `${(refundData.data?.rate ?? 0).toFixed(2)}%`,
            subValue: refundChange,
            invertColors: true 
          }
        ];

        setKpis(kpiData);
      } catch (err) {
        console.log('Failed to fetch KPIs, using test data:', err);
        setKpis(testKPIs);
      }
    };

    fetchKPIs();
  }, [apiEndpoint, viewingDataRange]);

  // Auto-select highest available range when maxDataRange changes
  useEffect(() => {
    const availableRanges = ranges.filter(r => r.value <= maxDataRange);
    const highestAvailable = Math.max(...availableRanges.map(r => r.value));
    setViewingDataRange(highestAvailable);
  }, [maxDataRange]);

  const handleMaxDataRangeChange = (event, newRange) => {
    if (newRange !== null) setMaxDataRange(Number(newRange));
  };

  const handleViewingDataRangeChange = (event, newRange) => {
    if (newRange !== null) setViewingDataRange(Number(newRange));
  };



  return (
    <>
      {/* AppBar with title, API status connections, and account glyph*/}
      <TopBar />

      {/* Main Content */}
      <Box 
        component="main" 
        className="dashboard-main"
      >
        <Box className="dashboard-header">
          <Typography variant="h5" component="h1">
            <b>
              {ranges.find(r => r.value === viewingDataRange)?.label || `Past ${viewingDataRange} months`}
            </b>
          </Typography>
          <ToggleButtonGroup
            value={viewingDataRange}
            exclusive
            onChange={handleViewingDataRangeChange}
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
              const disabled = value > maxDataRange;
              const button = <ToggleButton value={value} disabled={disabled} key={value}>{label}</ToggleButton>;
              
              return disabled ? (
                <Tooltip title={`Need at least ${label.toLowerCase()} of data`} arrow disableInteractive key={value}>
                  <span>{button}</span>
                </Tooltip>
              ) : button;
            })}
          </ToggleButtonGroup>
        </Box>
        
        <Grid container spacing={2} justifyContent="center">
          {/* First 4 - KPI Cards, mapped like above*/}
          {kpis.map((kpi, index) => (
            <KPICard key={index} kpi={kpi} />
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


      </Box>
    </>
  );
}
