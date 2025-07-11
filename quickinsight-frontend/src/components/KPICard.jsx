import React from 'react';
import PropTypes from 'prop-types';
import { Card, Typography, Box } from '@mui/material';

export default function KPICard({ kpi }) {
  return (
    <Card variant="outlined" className="card-dashboard">
      <Typography variant="body2" color="text.secondary" gutterBottom>
        <b>{kpi.title}</b>
      </Typography>
      <Box style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Typography 
          variant={kpi.title && kpi.title.toLowerCase().includes('top item') ? 'h6' : 'h4'}
          component="div"
          style={{
            fontWeight: 'bold',
            maxWidth: kpi.title && kpi.title.toLowerCase().includes('top item') ? 220 : undefined,
            overflow: kpi.title && kpi.title.toLowerCase().includes('top item') ? 'hidden' : undefined,
            textOverflow: kpi.title && kpi.title.toLowerCase().includes('top item') ? 'ellipsis' : undefined,
            whiteSpace: kpi.title && kpi.title.toLowerCase().includes('top item') ? 'nowrap' : undefined,
            letterSpacing: kpi.title && kpi.title.toLowerCase().includes('top item') ? '0.01em' : undefined
          }}
          title={kpi.value}
        >
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
  );
}

KPICard.propTypes = {
  kpi: PropTypes.shape({
    title: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    subValue: PropTypes.string,
    invertColors: PropTypes.bool
  }).isRequired
};
