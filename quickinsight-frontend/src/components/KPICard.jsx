
import React from 'react';
import PropTypes from 'prop-types';
import { Card, Typography, Box } from '@mui/material';
import millify from 'millify';



export default function KPICard({ kpi }) {
  
  // Helper to abbreviate numbers using millify if more than 3 digits, preserving prefix/suffix and symbol (symbol is now passed in)
  function abbreviateIfLong(val) {
    if (typeof val === 'number') {
      const str = val.toString();
      if (str.length > 3) {
        return millify(val, { precision: 1 });
      }
      return str;
    }
    if (typeof val === 'string') {
      let str = val.trim();
      // Extract prefix (+/-) and suffix (%)
      let prefix = '';
      let suffix = '';
      if (str[0] === '+' || str[0] === '-') {
        prefix = str[0];
        str = str.slice(1);
      }
      if (str.endsWith('%')) {
        suffix = '%';
        str = str.slice(0, -1);
      }
      // Find the first digit in the string
      const firstDigitIdx = str.search(/[0-9]/);
      if (firstDigitIdx !== -1) {
        const symbol = str.slice(0, firstDigitIdx);
        const numStr = str.slice(firstDigitIdx).replace(/,/g, '');
        let num = parseFloat(numStr);
        if (!isNaN(num)) {
          if (numStr.replace(/[^0-9]/g, '').length > 3) {
            return prefix + symbol + millify(num, { precision: 1 }) + suffix;
          }
          return prefix + symbol + num.toLocaleString() + suffix;
        }
      }
      // Fallback: not a number, just return original string
      return val;
    }
    return val;
  }

  // For non-numeric text, shrink font if over SMALL_FONT_LEN, truncate if over TRUNCATE_LEN
  const SMALL_FONT_LEN = 17;
  const TRUNCATE_LEN = 28;

  function isNumericLike(val) {
    if (typeof val === 'number') return true;
    if (typeof val !== 'string') return false;
    // Remove +, -, $, %, commas, spaces
    const cleaned = val.replace(/[+\-$%,\s]/g, '');
    return !isNaN(parseFloat(cleaned)) && isFinite(cleaned);
  }

  function processText(val) {
    if (typeof val === 'number' || (typeof val === 'string' && val.match(/[0-9]/))) {
      return { text: abbreviateIfLong(val), useSmallFont: false };
    }
    let str = typeof val === 'string' ? val : String(val);
    let useSmallFont = str.length > SMALL_FONT_LEN;
    let truncated = str;
    if (str.length > TRUNCATE_LEN) {
      truncated = str.slice(0, TRUNCATE_LEN - 1) + '…';
    }
    return { text: truncated, useSmallFont };
  }

  const processedValue = processText(kpi.value);
  const processedSubValue = kpi.subValue ? processText(kpi.subValue) : undefined;

  return (
    <Card variant="outlined" className="card-dashboard">
      <Box style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          <b>{kpi.title}</b>
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          <b>{kpi.subtitle}</b>
        </Typography>
      </Box>
      <Box style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Typography
          variant="h4"
          component="div"
          style={{
            fontWeight: 'bold',
            fontSize: processedValue.useSmallFont ? '1.7rem' : undefined,
            maxWidth: processedValue.useSmallFont ? 300 : undefined,
            overflow: processedValue.useSmallFont ? 'hidden' : undefined,
            textOverflow: processedValue.useSmallFont ? 'ellipsis' : undefined,
            whiteSpace: processedValue.useSmallFont ? 'nowrap' : undefined,
            letterSpacing: processedValue.useSmallFont ? '0.01em' : undefined
          }}
          title={kpi.value}
        >
          {processedValue.text}
        </Typography>
        {processedSubValue && (
          <Typography
            variant="h4"
            style={{
              color: (typeof processedSubValue.text === 'string' && (processedSubValue.text.startsWith('+') || processedSubValue.text.startsWith('-')))
                ? (() => {
                    const isPositive = processedSubValue.text.startsWith('+');
                    const isNegative = processedSubValue.text.startsWith('-');
                    if (kpi.invertColors) {
                      // For metrics where negative is good (like refund rate)
                      return isNegative ? 'green' : (isPositive ? 'red' : 'inherit');
                    } else {
                      // Default: positive is good, negative is bad
                      return isPositive ? 'green' : (isNegative ? 'red' : 'inherit');
                    }
                  })()
                : 'inherit',
              fontWeight: 'bold',
              fontSize: processedSubValue.useSmallFont ? '1.2rem' : undefined,
              maxWidth: processedSubValue.useSmallFont ? 220 : undefined,
              overflow: processedSubValue.useSmallFont ? 'hidden' : undefined,
              textOverflow: processedSubValue.useSmallFont ? 'ellipsis' : undefined,
              whiteSpace: processedSubValue.useSmallFont ? 'nowrap' : undefined,
              letterSpacing: processedSubValue.useSmallFont ? '0.01em' : undefined
            }}
          >
            {processedSubValue.text}
          </Typography>
        )}
      </Box>
    </Card>
  );
}

KPICard.propTypes = {
  kpi: PropTypes.shape({
    title: PropTypes.string,
    subtitle: PropTypes.string,  
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    subValue: PropTypes.string,
    invertColors: PropTypes.bool
  }).isRequired
};
