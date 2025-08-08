import React, { useState, useEffect } from 'react';
import { 
  Box, Card, Grid, Typography, Tooltip, IconButton, 
  ToggleButton, ToggleButtonGroup
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import getSymbolFromCurrency from 'currency-symbol-map';

import './styles.css';

import TopBar from './TopBar';
import KPICard from './KPICard';
import ChangesOverTime from './ChangesOverTime';
import TrafficSources from './TrafficSources';

/*

CHECK POSTGRESQL DATABASE BEFORE YOU LOAD THE SITE TO MAKE SURE THAT THE UPDATE-CACHE FUNCTIONALITY STILL WORKS!!!!

AND DELETE THIS MESSAGE AFTER!

*/

export default function Dashboard() {
  // Button definitions
  const ranges = [
    { value: 1, label: 'Past month' },
    { value: 3, label: 'Past 3 months' },
    { value: 6, label: 'Past 6 months' },
    { value: 12, label: 'Past year' },
  ];

  const [maxDataRange, setMaxDataRange] = useState(3);
  const [viewingDataRange, setViewingDataRange] = useState(maxDataRange); // start with max available
  const [kpis, setKpis] = useState([]);
  const [changesData, setChangesData] = useState([]);
  const [currencyCode, setCurrencyCode] = useState('ERR');

  const isMock = true; // Set to false when using real data
  const overrideWithTestData = false;
  const apiEndpoint = "https://api.quickinsightdemo.com/api/";

  const failedKPIs = [
    { title: 'Total visitors', subtitle: 'Today\'s visitors', value: 'NULL', subValue: 'NULL', invertColors: false },
    { title: 'Total profit', subtitle: 'Total purchases', value: 'NULL', subValue: 'NULL' , invertColors: false },
    { title: 'Top item sold', value: 'NULL', invertColors: false },
    { title: 'Refund Rate', subtitle: 'Money Refunded', value: 'NULL', subValue: 'NULL', invertColors: true },
  ];


  const [trafficData, setTrafficData] = useState([]);
  const [aiBrief, setAiBrief] = useState('');
  const [aiBriefVisible, setAiBriefVisible] = useState(false);
  const [businessInfo, setBusinessInfo] = useState({ business_name: '', business_industry: '' });

  // Error card state
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');


  useEffect(() => {
    let aiBriefTimeout;
    const fetchData = async () => {
      // Fetch all data immediately except AI Brief animation
      if (overrideWithTestData) {
        setKpis(failedKPIs);
        setChangesData([]);
        setTrafficData([]);
        setBusinessInfo({ business_name: '', business_industry: '' });
        // Animate AI Brief only
        setAiBriefVisible(false);
        aiBriefTimeout = setTimeout(() => {
          setAiBrief('');
          setAiBriefVisible(true);
        }, 400);
        return;
      }

      try {
        const params = new URLSearchParams({
          period: viewingDataRange.toString()
        });

        // Fetch all KPI data in parallel for current period
        const [
          visitorsRes, 
          revenueRes, 
          topItemRes, 
          refundRes, 
          trafficSourcesRes,
          aiBriefRes,
          businessInfoRes
        ] = await Promise.all([
          fetch(`${apiEndpoint}visitors?${params}`),
          fetch(`${apiEndpoint}revenue-and-purchases?${params}`),
          fetch(`${apiEndpoint}top-item?${params}`),
          fetch(`${apiEndpoint}refund-rate?${params}`),
          fetch(`${apiEndpoint}traffic-sources?${params}`),
          fetch(`${apiEndpoint}summary?period=${viewingDataRange}`),
          fetch(`${apiEndpoint}business-info`)
        ]);

        const visitorsData = await visitorsRes.json();
        const revenueData = await revenueRes.json();
        const topItemData = await topItemRes.json();
        const refundData = await refundRes.json();
        const trafficSourcesData = await trafficSourcesRes.json();
        const aiBriefData = await aiBriefRes.json();
        const businessInfoData = await businessInfoRes.json();

        // Fetch today's visitors (latest day in period)
        const visitorsTodayRes = await fetch(`${apiEndpoint}visitors?latestDay=true&${params}`);
        const visitorsTodayData = await visitorsTodayRes.json();

        // Set currency code and symbol for use elsewhere
        let code = revenueData.data?.currency || 'USD';
        setCurrencyCode(code.toUpperCase());
        const symbol = getSymbolFromCurrency(code);

        // Transform API data to KPI format
        const kpiData = [
          { 
            title: 'Total Unique Visitors', 
            subtitle: 'Today\'s Visitors',
            value: visitorsData.value?.toLocaleString() || '0', 
            subValue: visitorsTodayData.value?.toLocaleString() || '0',
            invertColors: false 
          },
          { 
            title: `Total Profit (${code ? code.toUpperCase() : 'ERR'})`,
            subtitle: 'Total Purchases', 
            value: revenueData.data && revenueData.data.net != null ? `${symbol || 'ERR'}${revenueData.data.net}` : `${symbol || 'ERR'}0`,
            subValue: revenueData.data && revenueData.data.orders != null ? Number(revenueData.data.orders).toLocaleString() : '0',
            invertColors: false 
          },
          { 
            title: 'Top Item Sold', 
            value: topItemData.data?.[0]?.name || 'No data', 
            invertColors: false 
          },
          { 
            title: 'Refund Rate', 
            subtitle: 'Refund Amount',
            value: `${refundData.data && refundData.data.rate != null ? Number(refundData.data.rate).toFixed(2) : '0.00'}%`,
            subValue: revenueData.data && revenueData.data.refunded != null ? `${symbol || 'ERR'}${revenueData.data.refunded}` : `${symbol || 'ERR'}0`,
            invertColors: true 
          }
        ];
        setKpis(kpiData);

        // Now fetch changes data and attach the correct currency code
        try {
          const changesResponse = await fetch(`${apiEndpoint}changes-over-time?${params}`);
          const changesDataJson = await changesResponse.json();
          if (changesDataJson.data && Array.isArray(changesDataJson.data) && changesDataJson.data.length > 0) {
            changesDataJson.data.forEach(item => {
              item.currencyCode = code.toUpperCase();
            });
          }
          setChangesData(changesDataJson.data);
        } catch (err) {
          console.log('Failed to fetch Changes over Time.', err);
          setChangesData([]);
        }

        // Set traffic sources data
        setTrafficData(trafficSourcesData.data || []);

        // Set business info
        setBusinessInfo({
          business_name: businessInfoData.business_name || '',
          business_industry: businessInfoData.business_industry || ''
        });

        // Animate AI Brief only
        setAiBriefVisible(false);
        aiBriefTimeout = setTimeout(() => {
          setAiBrief(aiBriefData.summary || 'Summary is still generating. Try refreshing or changing the date range.');
          setAiBriefVisible(true);
        }, 400);

      } catch (err) {
        console.log('Failed to fetch KPIs:', err);
        // display "unable to fetch" message in place of KPIs
        setKpis(failedKPIs);
        setChangesData([]);
        setTrafficData([]);
        setBusinessInfo({ business_name: '', business_industry: '' });
        setAiBrief('Unable to fetch data. Please try again later.');
        setAiBriefVisible(true); // Show error message immediately

        // Show error card with message
        setErrorMessage('Unable to contact backend server. Please check your connection or try again later.');
        setErrorOpen(true);
      }
    };
    fetchData();
    return () => {
      clearTimeout(aiBriefTimeout);
    };
  }, [apiEndpoint, viewingDataRange]);

  // Auto-select highest available range when maxDataRange changes
  useEffect(() => {
    const availableRanges = ranges.filter(r => r.value <= maxDataRange);
    const highestAvailable = Math.max(...availableRanges.map(r => r.value));
    setViewingDataRange(highestAvailable);
  }, [maxDataRange]);

  // ...removed separate changes data effect, now handled in main effect above...

  const handleMaxDataRangeChange = (event, newRange) => {
    if (newRange !== null) setMaxDataRange(Number(newRange));
  };

  const handleViewingDataRangeChange = (event, newRange) => {
    if (newRange !== null) setViewingDataRange(Number(newRange));
  };



  // Info card state
  const [infoOpen, setInfoOpen] = useState(false);

  const handleInfoOpen = () => setInfoOpen(true);
  const handleInfoClose = () => setInfoOpen(false);

  // Error card close handler
  const handleErrorClose = () => setErrorOpen(false);

  return (
    <>
      {/* AppBar with title, API status connections, and account glyph*/}
      <TopBar businessInfo={businessInfo} />

      {/* Info Dialog */}
      <Box>
        {/* Overlay for blur/dark background when info card or error card is open */}
        {(infoOpen || errorOpen) && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              bgcolor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(6px)',
              zIndex: 1299,
              transition: 'all 0.3s',
            }}
          />
        )}
        {/* Info Card */}
        <Card
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: infoOpen ? 'translate(-50%, -50%)' : 'translate(-50%, -60%)',
            zIndex: 1300,
            minWidth: 350,
            maxWidth: 750,
            display: infoOpen ? 'block' : 'none',
            boxShadow: 8,
            p: 3,
          }}
        >
          <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
            <IconButton onClick={handleInfoClose} size="small">
              <span style={{ fontWeight: 'bold', fontSize: 18 }}>×</span>
            </IconButton>
          </Box>
          <Typography variant="h5" gutterBottom>
            About QuickInsight Demo
          </Typography>
          <Typography variant="body1" gutterBottom>
            QuickInsight is a demonstration dashboard for visualizing ecommerce business data. It features data source integration, date range filtering, AI-generated summaries, and data caching. (All data shown is for demonstration purposes only.)
          </Typography>
          <Typography variant="body1" gutterBottom>
            This project was created by Joshua Schiavi to demonstrate frontend and backend integration, Amazon Web Services experience, data visualization, and AI capabilities in a modern web application. (View his LinkedIn <a href="https://www.linkedin.com/in/joshua-schiavi/" target="_blank" rel="noopener noreferrer">here</a>.)
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Built with React/Vite with Material UI for the frontend, Node and Express for the backend, ESLint, and PostgreSQL. Utilizes Amazon Web Services S3 static website hosting, CloudFront and OAC for content delivery, Elastic Beanstalk for the Backend, RDS PostgreSQL, Route 53, and CloudWatch Alarms. Uses Google BigQuery&apos;s &quot;ga4_obfuscated_sample_ecommerce&quot; dataset, adapted into mock API responses from Stripe and Google Analytics. OpenAI API used for AI Brief. New responses generated every hour.
          </Typography>
        </Card>
        {/* Error Card */}
        <Card
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: errorOpen ? 'translate(-50%, -50%)' : 'translate(-50%, -60%)',
            zIndex: 1300,
            minWidth: 350,
            maxWidth: 600,
            display: errorOpen ? 'block' : 'none',
            boxShadow: 8,
            p: 3,
            border: '2px solid #d32f2f',
            bgcolor: '#fff5f5',
          }}
        >
          <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
            <IconButton onClick={handleErrorClose} size="small">
              <span style={{ fontWeight: 'bold', fontSize: 18, color: '#d32f2f' }}>×</span>
            </IconButton>
          </Box>
          <Typography variant="h5" gutterBottom color="error">
            Error
          </Typography>
          <Typography variant="body1" gutterBottom color="error">
            {errorMessage}
          </Typography>
        </Card>
      </Box>
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
                <Tooltip title={`Need at least ${value} month${value != 1 ? 's' : ''} of data`} arrow disableInteractive key={value}>
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

            <ChangesOverTime data={changesData} />

          </Card>


          <Card variant="outlined" className="card-row">
            <Typography variant="h5" component="div" style={{ fontWeight: 'bold' }}>
              Traffic Sources
            </Typography>

            <TrafficSources data={trafficData} />

          </Card>



          <Card variant="outlined" className="card-brief">
            <Typography variant="h4" component="div" style={{ fontWeight: 'bold', textAlign: 'center'}}>
              AI Brief
            </Typography>
            <div className="ai-brief-gradient" />

            <p
              className={`ai-brief-text${aiBriefVisible ? ' ai-brief-animate-in' : ' ai-brief-animate-out'}`}
              style={{ margin: 0 }}
            >
              {aiBrief || "Generating AI summary..."}
            </p>
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
                onClick={handleInfoOpen}
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
