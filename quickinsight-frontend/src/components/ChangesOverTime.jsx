import React from 'react';
import getSymbolFromCurrency from 'currency-symbol-map';
import PropTypes from 'prop-types';
import { Card, CardContent, Typography, Box, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { AreaChart, Area, LineChart, Line, CartesianGrid, XAxis, YAxis, Legend, Tooltip } from 'recharts';
import millify from 'millify';
import './styles.css';

import CustomTooltip from './CustomTooltip.jsx';



export default function ChangesOverTime({ data }) {
  // console.log("ChangesOverTime rendering with data:", data);

  const [selectedButton, setSelectedButton] = React.useState('r');

  const handleViewingDataRangeChange = (event, newRange) => {
    if (newRange !== null) setSelectedButton(newRange);
  }

  let currencySymbol = "ERR";
  if (data && data.length > 0) {
    if (data[0].currencySymbol) {
      currencySymbol = data[0].currencySymbol;
    } else if (data[0].currencyCode) {
      currencySymbol = getSymbolFromCurrency(data[0].currencyCode) || data[0].currencyCode;
    }
  }
  // console.log("Using currency symbol:", currencySymbol);

  const revSelectedColor = '#ff4500';
  const purSelectedColor = '#4caf50';
  const userSelectedColor = '#007fb5';


  // Consolidate common Line props
  const commonGraphProps = {
    dot: false,
    animationDuration: 400,
    animationEasing: 'ease-in-out',
    type: 'monotone'
  };

  return (
    <Box className="changes-over-time-container">
      <ToggleButtonGroup
        value={selectedButton}
        exclusive
        onChange={handleViewingDataRangeChange}
        className="graph-btn-group"
        fullWidth
      >
        <ToggleButton
          value="r"
          key="r"
          variant="contained"
          className={`toggle-btn revenue-btn${selectedButton === 'r' ? ' selected' : ''}`}
        >
          Revenue
        </ToggleButton>
        <ToggleButton
          value="p"
          key="p"
          variant="contained"
          className={`toggle-btn purchases-btn${selectedButton === 'p' ? ' selected' : ''}`}
        >
          Purchases
        </ToggleButton>
        <ToggleButton
          value="u"
          key="u"
          variant="contained"
          className={`toggle-btn users-btn${selectedButton === 'u' ? ' selected' : ''}`}
        >
          Users
        </ToggleButton>
      </ToggleButtonGroup>

      <AreaChart width={400} height={250} data={data} >
        {/* <CartesianGrid stroke="#eee" strokeDasharray="5 5"/> */}
        <XAxis dataKey="date" interval="equidistantPreserveStart" />
        <YAxis
          tickFormatter={selectedButton === 'r'
            ? (value) => `${currencySymbol}${millify(value)}`
            : (value) => millify(value)
          }
        />
        {selectedButton === 'u' && <Area {...commonGraphProps} dataKey="users" stroke={userSelectedColor} fill={userSelectedColor} />}
        {selectedButton === 'p' && <Area {...commonGraphProps} dataKey="purchases" stroke={purSelectedColor} fill={purSelectedColor} />}
        {selectedButton === 'r' && <Area {...commonGraphProps} dataKey="revenue" stroke={revSelectedColor} fill={revSelectedColor} />}
        <Tooltip content={<CustomTooltip currencySymbol={currencySymbol}/>} cursor={{ stroke: '#ccc' }} />
      </AreaChart>
    </Box>
  );
}

ChangesOverTime.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      date:           PropTypes.string.isRequired,
      purchases:      PropTypes.number,
      revenue:        PropTypes.number,
      users:          PropTypes.number,
      currencySymbol: PropTypes.string,
      currencyCode:   PropTypes.string,
    }),
  ).isRequired,
};
