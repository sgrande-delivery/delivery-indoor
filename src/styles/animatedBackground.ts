import { darken } from '@material-ui/core/styles';
import { styled } from '@material-ui/core/styles';

export const AnimatedBackground = styled('div')(({ theme }) => {
  const background = theme.palette.background.default;

  const fromColor = darken(background, 0.02);
  const toColor = darken(background, 0.05);

  return {
    backgroundColor: fromColor,
    animation: '$alternateBackground 0.7s ease-in-out infinite alternate',

    '@keyframes alternateBackground': {
      from: {
        backgroundColor: fromColor,
      },
      to: {
        backgroundColor: toColor,
      },
    },
  };
});
