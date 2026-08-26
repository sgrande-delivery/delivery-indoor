import React from 'react';
import { darken, makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => {
  const background = theme.palette.background.default;

  return {
    '@keyframes alternateBackground': {
      from: { backgroundColor: darken(background, 0.02) },
      to: { backgroundColor: darken(background, 0.05) },
    },
    animated: {
      backgroundColor: darken(background, 0.02),
      animation: '$alternateBackground 0.7s ease-in-out infinite alternate',
    },
  };
});

type AnimatedBackgroundProps = {
  className?: string;
};

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ className }) => {
  const classes = useStyles();

  return <div className={[classes.animated, className].filter(Boolean).join(' ')} />;
};
