import { makeStyles, Typography } from '@material-ui/core';
import { Schedule } from '@material-ui/icons';
import React from 'react';
import { Restaurant } from 'src/types/restaurant';
import StatusIcon from '@material-ui/icons/FiberManualRecord';

interface UseStyleProps {
  isOpen: boolean;
}

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    position: 'relative',
  },
  info: {
    display: 'flex',
    justifyContent: 'space-around',
    width: '100%',
    '&>h5': {
      [theme.breakpoints.down('sm')]: {
        marginLeft: 0,
        fontSize: 20,
      },
    },
  },
  deliveryTime: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    '& svg': {
      marginRight: 7,
    },
  },
  infoItem: {
    fontWeight: 300,
  },
  logo: (props: UseStyleProps) => ({
    width: 120,
    height: 120,
    objectFit: 'cover',
    borderRadius: '50%',
    border: `3px solid ${props.isOpen ? theme.palette.success.main : theme.palette.error.main}`,
    position: 'absolute',
    top: -20,
    zIndex: 20,
    backgroundColor: '#fff',
    [theme.breakpoints.down('sm')]: {
      width: 100,
      height: 100,
    },
  }),
  restaurantIdentity: {
    marginBottom: 10,
    borderBottom: '1px solid #eee',
    padding: '20px 10px 20px 50px',
    display: 'flex',
    alignItems: 'center',
    [theme.breakpoints.down('sm')]: {
      padding: '16px 15px 10px',
      flexWrap: 'wrap',
    },
    '& .restaurant-name': {
      fontWeight: 400,
      fontSize: 26,
    },
  },
  logoContainer: {
    width: 135,
    flexShrink: 0,
    [theme.breakpoints.down('sm')]: {
      width: 115,
    },
  },
  description: {
    maxWidth: 'calc(100vw - 150px)',
  },
  detail: {
    width: '100%',
    [theme.breakpoints.down('sm')]: {
      width: 'auto',
      marginBottom: 10,
    },
  },
  status: (props: UseStyleProps) => ({
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 4,
    '& svg': {
      color: props.isOpen ? '#28a745' : '#dc3545',
      marginRight: 5,
    },
    '& p': {
      fontWeight: 600,
    },
  }),
}));

type InfoProps = {
  restaurant: Restaurant;
};

const Info: React.FC<InfoProps> = ({ restaurant }) => {
  const classes = useStyles({ isOpen: restaurant.is_kitchen_open });

  return (
    <div className={classes.container}>
      <div className={classes.restaurantIdentity}>
        <div className={classes.logoContainer}>
          <img
            className={classes.logo}
            src={restaurant.image.imageThumbUrl ? restaurant.image.imageThumbUrl : restaurant.image.imageUrl}
            alt={restaurant.name}
          />
        </div>
        <div className={classes.detail}>
          <Typography noWrap className={`restaurant-name ${classes.description}`}>
            {restaurant.name}
          </Typography>
          <Typography className={classes.description} variant="body2" color="textSecondary">
            {restaurant.description}
          </Typography>
          <div className={classes.status}>
            <Typography variant="body1">{restaurant.is_kitchen_open ? 'aberto' : 'fechado'}</Typography>
            <StatusIcon />
          </div>
        </div>
        <div className={classes.info}>
          {restaurant.configs.delivery_time > 0 && (
            <div className={classes.deliveryTime}>
              <Schedule />

              <Typography variant="h6" className={classes.infoItem}>
                {restaurant.configs.board_time} minutos
              </Typography>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Info;
