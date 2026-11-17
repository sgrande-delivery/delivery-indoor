import { createTheme } from '@material-ui/core';

const theme = createTheme({
  palette: {
    primary: {
      main: '#f0592a',
    },
    secondary: {
      main: '#4b4b4d',
      contrastText: '#fff',
    },
  },
  typography: {
    fontWeightLight: 200,
    fontWeightRegular: 300,
    fontWeightMedium: 400,
    fontSize: 14,
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },
  shape: {
    borderRadius: 0,
  },
  overrides: {
    MuiInput: {
      root: {
        fontWeight: 300,
      },
    },
    MuiButton: {
      contained: {
        boxShadow: 'none',
      },
    },
    MuiAppBar: {
      root: {
        boxShadow: 'none',
      },
    },
    MuiTypography: {
      h6: {
        fontWeight: 400,
      },
    },
    MuiLink: {
      underlineHover: {
        '&:hover': {
          textDecoration: 'none',
        },
      },
      underlineAlways: {
        textDecoration: 'none',
      },
    },
  },
});

export default theme;
