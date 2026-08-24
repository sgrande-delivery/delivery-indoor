import React from 'react';
import { makeStyles } from '@material-ui/core';
import Link, { LinkProps } from 'next/link';

interface CustomLinkProps extends LinkProps {
  color: 'primary' | 'secondary' | 'error';
  className?: string;
  children: React.ReactNode;
}

const useStyles = makeStyles(theme => ({
  link: (props: { color: string }) => ({
    color: theme.palette[props.color].main,
    fontSize: 16,
  }),
}));

const CustomLink: React.FC<CustomLinkProps> = ({ color, className, children, ...rest }) => {
  const classes = useStyles({ color });

  return (
    <Link {...rest} className={className ? `${classes.link} ${className}` : classes.link}>
      {children}
    </Link>
  );
};

export default CustomLink;
