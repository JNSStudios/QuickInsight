// KPICards.jsx
import React from 'react';
import { Grid, Box } from '@mui/material';
import KPICard from './KPICard';

const kpis = [
  { title: 'Total visitors', value: '22,251', change: '+4%' },
  { title: 'Total purchases & revenue', value: '792', subValue: '$6.2k' },
  { title: 'Top item sold', value: 'Zip Hoodie' },
  { title: 'Refund Rate', value: '0.32%', change: '-1.1%' },
];

export default function KPICards() {
  return (
    // ensure the container itself is full-width
    <Box sx={{ width: '100%', mb: 2 }}>
      <Grid container spacing={2}>
        {kpis.map((kpi) => (
          <Grid 
            item 
            key={kpi.title}
            xs={12}   // 1 column on extra-small
            sm={6}    // 2 columns ≥600px
            md={3}    // 4 columns ≥900px
          >
            <KPICard {...kpi} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
