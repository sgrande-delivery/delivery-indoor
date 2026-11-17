import React, { useState } from 'react';
import { Dialog, AppBar, Toolbar, IconButton, Typography } from '@material-ui/core';
import PropTypes from 'prop-types';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  modal: {
    overflowY: 'auto',
    padding: '0 30px 40px',
    [theme.breakpoints.down('md')]: {
      padding: '0 30px 40px !important',
    },
  },
  root: {
    paddingRight: '0!important',
  },
  appbar: {
    zIndex: '1102!important',
    '@media print': {
      display: 'none',
    },
  },
  grow: {
    flexGrow: 1,
  },
  background: props => ({
    backgroundColor: props.backgroundColor ? props.backgroundColor : '#fff',
  }),
  content: ({ title }) => ({
    display: 'flex',
    flex: 1,
    marginTop: title ? 64 : 15,
    marginBottom: 0,
    paddingTop: 15,
    paddingLeft: 15,
    paddingRight: 15,
    overflowY: 'auto',
    [theme.breakpoints.down('md')]: {
      marginTop: title ? 56 : 15,
    },
    [theme.breakpoints.between('xs', 'xs') + ' and (orientation: landscape)']: {
      marginTop: title ? 48 : 15,
    },
  }),
}));

export const DialogFullscreenContext = React.createContext({
  handleCloseDialog: () => {
    //
  },
});

function DialogFullscreen({ handleModalState, title, componentActions, children, backgroundColor }) {
  const [open, setOpen] = useState(true);
  const styleProps = { backgroundColor, title };
  const classes = useStyles(styleProps);

  function handleClose() {
    setOpen(false);
  }

  return (
    <Dialog
      classes={
        ({ root: classes.root },
        {
          paper: classes.background,
        })
      }
      open={open}
      onClose={handleClose}
      fullScreen
      fullWidth
      onExited={() => handleModalState()}
    >
      {title && (
        <AppBar className={classes.appbar}>
          <Toolbar>
            <IconButton color="inherit" onClick={handleClose}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant={'h6'} color="inherit" noWrap>
              {title}
            </Typography>
            <div className={classes.grow} />
            <div>{componentActions}</div>
          </Toolbar>
        </AppBar>
      )}
      <div className={classes.content}>
        <DialogFullscreenContext.Provider value={{ handleCloseDialog: handleClose }}>
          {children}
        </DialogFullscreenContext.Provider>
      </div>
    </Dialog>
  );
}

DialogFullscreen.propTypes = {
  handleModalState: PropTypes.func.isRequired,
  title: PropTypes.string,
  componentActions: PropTypes.element,
  children: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  backgroundColor: PropTypes.string,
};

// eslint-disable-next-line react/display-name
export const withDialoagFullscreen = Component => props => (
  <DialogFullscreenContext.Consumer>
    {context => <Component {...props} {...context} />}
  </DialogFullscreenContext.Consumer>
);

export default DialogFullscreen;
export const DialogFullscreenConsumer = DialogFullscreenContext.Consumer;
