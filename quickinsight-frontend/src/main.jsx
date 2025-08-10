import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import App from "./App.jsx";
import { useMemo } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';

function Main() {
  // check if the user prefers light or dark mode and update the color scheme accordingly
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light',
          primary: { main: '#40bdd0ff' },
          background: {
            default: prefersDarkMode ? '#0d1117' : '#f5f5f5',
            paper: prefersDarkMode ? '#161b22' : '#ffffff',
          },
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                backgroundColor: prefersDarkMode ? '#0d1117' : '#f5f5f5',
              },
            },
          },
        },
      }),
    [prefersDarkMode]
  );

  // render main application using the light/dark theme
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <Main />
);
