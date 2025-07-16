
import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Card, Typography, Box } from '@mui/material';
import millify from 'millify';

// AnimatedNumber: animates a number from previous to next value
function AnimatedNumber({ value, duration = 400, millify: useMillify = false, precision = 1 }) {
  // Parse prefix/suffix and numeric part from value
  let prefix = '', suffix = '', num = 0;
  if (typeof value === 'number') {
    num = value;
  } else if (typeof value === 'string') {
    let str = value.trim();
    // Extract prefix (+, -, $) and suffix (%)
    if (str[0] === '+' || str[0] === '-') {
      prefix = str[0];
      str = str.slice(1);
    }
    if (str[0] === '$') {
      prefix += '$';
      str = str.slice(1);
    }
    if (str.endsWith('%')) {
      suffix = '%';
      str = str.slice(0, -1);
    }
    // Remove commas and whitespace
    str = str.replace(/,/g, '').trim();
    // Parse number
    num = parseFloat(str);
    if (isNaN(num)) num = 0;
  }

  const [displayValue, setDisplayValue] = useState(num);
  const prevValue = useRef(num);
  const raf = useRef();

  useEffect(() => {
    // Re-parse on value change
    let newNum = 0;
    if (typeof value === 'number') {
      newNum = value;
    } else if (typeof value === 'string') {
      let str = value.trim();
      if (str[0] === '+' || str[0] === '-') {
        str = str.slice(1);
      }
      if (str[0] === '$') {
        str = str.slice(1);
      }
      if (str.endsWith('%')) {
        str = str.slice(0, -1);
      }
      str = str.replace(/,/g, '').trim();
      newNum = parseFloat(str);
      if (isNaN(newNum)) newNum = 0;
    }
    const end = newNum;
    const start = typeof prevValue.current === 'number' && !isNaN(prevValue.current) ? prevValue.current : 0;
    const startTime = performance.now();

    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // For percentages, animate with decimals; otherwise, use integer
      let current;
      if (suffix === '%') {
        current = start + (end - start) * progress;
      } else {
        current = Math.round(start + (end - start) * progress);
      }
      setDisplayValue(current);
      if (progress < 1) {
        raf.current = requestAnimationFrame(animate);
      } else {
        prevValue.current = end;
      }
    }
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);

  // If the value prop changes abruptly (e.g., from string to number), update state/ref
  useEffect(() => {
    setDisplayValue(num);
    prevValue.current = num;
    // eslint-disable-next-line
  }, []); // only on mount

  let output;
  if (useMillify && Math.abs(displayValue) >= 1000) {
    output = millify(displayValue, { precision });
  } else if (suffix === '%') {
    output = displayValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else {
    output = displayValue.toLocaleString();
  }
  // Re-apply prefix/suffix
  output = `${prefix}${output}${suffix}`;
  return output;
}


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

  // Only abbreviate after animation for numbers
  const isValueNumeric = isNumericLike(kpi.value);
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
          {isValueNumeric ? (
            <AnimatedNumber value={kpi.value} millify precision={1} />
          ) : (
            processedValue.text
          )}
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
                  {isNumericLike(kpi.subValue) ? (
                    <AnimatedNumber value={kpi.subValue} millify precision={1} />
                  ) : (
                    processedSubValue.text
                  )}
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
