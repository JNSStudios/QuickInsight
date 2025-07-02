import React from 'react';
import ReactDOM from 'react-dom/client';
import "./index.css";
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';

const theme = createTheme({
  palette: { mode: 'dark', primary: { main: '#2E70FF' } },
  // add more theme customization here, refer to MUI docs
});

import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline /> 
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
