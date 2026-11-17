import { Components, Theme } from '@mui/material/styles';
import { componentRadii, fontWeights, radii } from './tokens';

export const components: Components<Theme> = {
  MuiButton: {
    defaultProps: {
      disableElevation: true,
    },
    styleOverrides: {
      root: {
        minHeight: 52,
        paddingInline: 24,
        borderRadius: componentRadii.button,
      },
      sizeSmall: {
        minHeight: 36,
        paddingInline: 16,
        borderRadius: componentRadii.buttonSmall,
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: componentRadii.input,
        backgroundColor: theme.vars.palette.surface.field,
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: 'transparent',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: 'transparent',
        },
        '&.Mui-focused': {
          backgroundColor: theme.vars.palette.surface.card,
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderWidth: 2,
          borderColor: theme.vars.palette.primary.main,
        },
        '&.Mui-error .MuiOutlinedInput-notchedOutline': {
          borderWidth: 2,
          borderColor: theme.vars.palette.error.main,
        },
      }),
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: radii.pill,
        fontWeight: fontWeights.bold,
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
        borderRadius: componentRadii.paper,
      },
    },
  },
  MuiAppBar: {
    defaultProps: {
      elevation: 0,
    },
  },
  MuiLink: {
    defaultProps: {
      underline: 'none',
    },
  },
  MuiTypography: {
    defaultProps: {
      variantMapping: {
        label: 'span',
        price: 'span',
      },
    },
  },
};
