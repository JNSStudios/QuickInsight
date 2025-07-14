
import React from 'react';
import PropTypes from 'prop-types';
import { Card, Typography, Box } from '@mui/material';
import millify from 'millify';

export default function KPICard({ kpi }) {
  // Helper to abbreviate numbers using millify if more than 3 digits, preserving $ if present
  function abbreviateIfLong(value) {
    if (typeof value === 'number') {
      const str = value.toString();
      if (str.length > 3) {
        return millify(value, { precision: 1 });
      }
      return str;
    }
    if (typeof value === 'string') {
      let str = value.trim();
      // Extract prefix (+/-), $ and suffix (%)
      let prefix = '';
      let isDollar = false;
      let suffix = '';
      // Check for + or - at start
      if (str[0] === '+' || str[0] === '-') {
        prefix = str[0];
        str = str.slice(1);
      }
      if (str.startsWith('$')) {
        isDollar = true;
        str = str.slice(1);
      }
      if (str.endsWith('%')) {
        suffix = '%';
        str = str.slice(0, -1);
      }
      // Remove commas for parsing
      let num = parseFloat(str.replace(/,/g, ''));
      if (!isNaN(num)) {
        // Only abbreviate if number part is more than 3 digits
        if (str.replace(/[^0-9]/g, '').length > 3) {
          return prefix + (isDollar ? '$' : '') + millify(num, { precision: 1 }) + suffix;
        }
        // Otherwise, keep original string (with $ and prefix/suffix if present)
        return prefix + (isDollar ? '$' : '') + num.toLocaleString() + suffix;
      }
    }
    return value;
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
    if (isNumericLike(val)) {
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
