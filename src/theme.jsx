import { createTheme as createMantineTheme } from '@mantine/core';
import { createTheme as createMuiTheme } from '@mui/material/styles';

export const theme = createMantineTheme({
  fontFamily: 'Parkinsans, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  fontFamilyMonospace: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  headings: {
    fontFamily: 'Parkinsans, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  },
  colors: {
    'frosted-mint': ['#f0fdf4', '#e5f9e0', '#d1f3ca', '#b5ebb1', '#99e298', '#7dd980', '#61d067', '#4ac554', '#35b844', '#20a935'],
    'light-green': ['#f0fef4', '#e1fde8', '#c6fbd1', '#a3f7b5', '#7ff299', '#5eed7d', '#3fe861', '#2ed14b', '#1fb83a', '#0f9f2c'],
    'mint-leaf': ['#e6fbf7', '#c7f5ed', '#a1efe2', '#74e8d6', '#4ce0ca', '#40c9a2', '#34af8b', '#299574', '#1e7b5d', '#136146'],
    'verdigris': ['#e6f5f4', '#c7eae7', '#a1ddd8', '#74cfc8', '#4cbfb7', '#2f9c95', '#278680', '#20706b', '#185a56', '#104441'],
    'chocolate-plum': ['#f5e9ea', '#ead3d5', '#ddbcc0', '#d0a4ab', '#c28d96', '#b47681', '#a6606c', '#8e5159', '#664147', '#5a383d'],
    'alert-red': ['#fff5f5', '#ffe3e3', '#ffc9c9', '#ffa8a8', '#ff8787', '#ff6b6b', '#fa5252', '#f03e3e', '#e03131', '#c92a2a'],
    'alert-orange': ['#fff4e6', '#ffe8cc', '#ffd8a8', '#ffc078', '#ffa94d', '#ff922b', '#fd7e14', '#f76707', '#e8590c', '#d9480f'],
    'alert-yellow': ['#fff9db', '#fff3bf', '#ffec99', '#ffe066', '#ffd43b', '#fcc419', '#fab005', '#f59f00', '#f08c00', '#e67700'],
  },
  primaryColor: 'mint-leaf',
});

// Create MUI theme based on color scheme with DM Sans
export const createMuiThemeFromColorScheme = (colorScheme) => {
  return createMuiTheme({
    palette: {
      mode: colorScheme === 'dark' ? 'dark' : 'light',
      primary: {
        main: '#40c9a2', // mint-leaf
      },
    },
    typography: {
      fontFamily: 'Parkinsans, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    },
  });
};