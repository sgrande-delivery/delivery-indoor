import React, { PropsWithChildren, ReactElement, useState } from 'react';
import { Dialog, AppBar, Toolbar, IconButton, Typography, makeStyles } from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import { useApp } from 'src/providers/AppProvider';
import { ModalProvider } from './hooks/useModal';

interface ModalStyleProps {
  backgroundColor: string;
  title: boolean;
  displayBottomActions: boolean;
  height: string;
  disablePadding: boolean;
}

const useStyles = makeStyles(theme => ({
  modal: {
    overflowY: 'auto',
    padding: '0 30px 40px',
    [theme.breakpoints.down('sm')]: {
      padding: '0 30px 40px !important',
    },
  },
  root: {
    paddingRight: '0!important',
    position: 'relative',
  },
  appbar: {
    position: 'absolute',
    zIndex: 1102,
    [theme.breakpoints.down('sm')]: {
      position: 'fixed',
    },
    '@media print': {
      display: 'none',
    },
  },
  grow: {
    flexGrow: 1,
  },
  paper: ({ backgroundColor, height }: ModalStyleProps) => ({
    backgroundColor,
    [theme.breakpoints.up('md')]: {
      height,
    },
  }),
  content: ({ title, displayBottomActions, disablePadding }: ModalStyleProps) => ({
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    marginTop: title ? 64 : 15,
    marginBottom: displayBottomActions ? 72 : 0,
    padding: disablePadding ? 0 : '15px 15px 0 15px',
    overflowY: 'auto',
    [theme.breakpoints.down('sm')]: {
      marginTop: title ? 56 : 15,
    },
    [theme.breakpoints.between('xs', 'xs') + ' and (orientation: landscape)']: {
      marginTop: title ? 48 : 15,
    },
  }),
}));

interface ModalProps extends PropsWithChildren {
  onExited(): void;
  title?: string;
  componentActions?: ReactElement;
  backgroundColor?: string;
  hideBackdrop?: boolean;
  displayBottomActions?: boolean;
  height?: string;
  backAction?(): void;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  disablePadding?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  onExited,
  title,
  componentActions,
  children,
  backgroundColor = '#fff',
  hideBackdrop = false,
  displayBottomActions = false,
  maxWidth = 'md',
  height = '100vh',
  backAction,
  disablePadding = false,
}) => {
  const [open, setOpen] = useState(true);
  const app = useApp();
  const styleProps = { backgroundColor, title: !!title, displayBottomActions, height, disablePadding };
  const classes = useStyles(styleProps);

  function handleModalClose() {
    setOpen(false);
  }

  return (
    <Dialog
      classes={{ root: classes.root, paper: classes.paper }}
      hideBackdrop={hideBackdrop}
      open={open}
      onClose={handleModalClose}
      fullWidth
      fullScreen={app.isMobile || app.windowWidth < 960}
      maxWidth={maxWidth}
      TransitionProps={{
        onExited,
      }}
    >
      <ModalProvider value={{ handleModalClose }}>
        {title && (
          <AppBar className={classes.appbar}>
            <Toolbar>
              <IconButton color="inherit" onClick={backAction || handleModalClose}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h6" color="inherit" noWrap>
                {title}
              </Typography>
              <div className={classes.grow} />
              <div>{componentActions}</div>
            </Toolbar>
          </AppBar>
        )}
        <div className={classes.content}>{children}</div>
      </ModalProvider>
    </Dialog>
  );
};

export default Modal;
