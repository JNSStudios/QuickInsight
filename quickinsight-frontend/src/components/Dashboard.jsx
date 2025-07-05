import React from 'react';
import { Grid } from '@mui/material';
import TitleTimeframe from '../components/TitleTimeframe';
import KPICards from '../components/KPICards';
import ChangesOverTime from '../components/ChangesOverTime';
import TrafficSources from '../components/TrafficSources';
import AIBrief from '../components/AIBrief';

export default function Dashboard() {
  return (
    <>
      <TitleTimeframe />
      <KPICards />
      <Grid container spacing={2}>
        <Grid item xs={12} md={8} container spacing={2} direction="column">
          <Grid item>
            <ChangesOverTime />
          </Grid>
          <Grid item>
            <TrafficSources />
          </Grid>
        </Grid>
        <Grid item xs={12} md={4}>
          <AIBrief />
        </Grid>
      </Grid>
    </>
  );
}
