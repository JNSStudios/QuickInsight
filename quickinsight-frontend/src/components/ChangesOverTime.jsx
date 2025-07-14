import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, Typography, Box, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Legend, Tooltip } from 'recharts';
import './styles.css';



export default function ChangesOverTime({ data }) {
  // console.log("ChangesOverTime rendering with data:", data);

  const [selectedButton, setSelectedButton] = React.useState('r');

  const handleViewingDataRangeChange = (event, newRange) => {
    if (newRange !== null) setSelectedButton(newRange);
  }


  const revDeselectColor = '#482000ff';
  const purDeselectColor = '#004a1cff';
  const userDeselectColor = '#060053ff';

  const revSelectedColor = '#ff4500';
  const purSelectedColor = '#4caf50';
  const userSelectedColor = '#007fb5ff';


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

      <LineChart width={400} height={250} data={data}>
        {/* <CartesianGrid stroke="#eee" strokeDasharray="5 5"/> */}
        <XAxis dataKey="date"/>
        <YAxis/>
        {selectedButton === 'u' && <Line dot={false} animationDuration='500' animationEasing='ease-in-out' type="monotone" dataKey="users" stroke={userSelectedColor} />}
        {selectedButton === 'p' && <Line dot={false} animationDuration='500' animationEasing='ease-in-out' type="monotone" dataKey="purchases" stroke={purSelectedColor} />}
        {selectedButton === 'r' && <Line dot={false} animationDuration='500' animationEasing='ease-in-out' type="monotone" dataKey="revenue" stroke={revSelectedColor} />}
        <Tooltip />
      </LineChart>
    </Box>
  );
}

ChangesOverTime.propTypes = {
  data: PropTypes.shape({
    date: PropTypes.string,
    purchases: PropTypes.int,  
    revenue: PropTypes.int,
    users: PropTypes.int
  }).isRequired
};