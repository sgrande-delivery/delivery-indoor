import { Button, makeStyles, Typography } from '@material-ui/core';
import { useRouter } from 'next/router';
import React from 'react';
import { useSelector } from 'src/store/redux/selector';

const styles = makeStyles(theme => ({
  content: {
    display: 'flex',
    backgroundColor: '#f5f5f5',
    border: '1px solid #eee',
    flexDirection: 'column',
    padding: 10,
    '& > .row': {
      display: 'grid',
      gridTemplateColumns: '1fr 3fr',
      gap: 10,
      alignItems: 'baseline',
      '& > .value': {
        textAlign: 'right',
        fontSize: 20,
      },
      '& > .bold': {
        fontWeight: 'bold',
      },
    },
  },
  container: {
    marginBottom: 100,
    display: 'flex',
    flexDirection: 'column',
    gap: 50,
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  warning: {
    textAlign: 'center',
    marginBottom: 20,
    backgroundColor: theme.palette.warning.light,
    padding: 10,
    fontWeight: 'bold',
  },
}));

const BoardTotal: React.FC = () => {
  const router = useRouter();
  const movement = useSelector(state => state.boardMovement);
  const classes = styles();
  const orders = new Set(movement?.products.map(product => product.id)).size;

  function handleClick() {
    router.push({
      pathname: '/menu',
      query: router.query,
    });
  }

  return (
    <div className={classes.container}>
      <div className={classes.content}>
        <div className="row">
          <Typography>Pedidos</Typography>
          <Typography className="value">{orders}</Typography>
        </div>
        <div className="row">
          <Typography>Desconto</Typography>
          <Typography className="value">{movement?.formattedDiscount}</Typography>
        </div>
        <div className="row">
          <Typography>Gorjeta</Typography>
          <Typography className="value">{movement?.formattedTipAmount}</Typography>
        </div>
        <div className="row">
          <Typography>Total</Typography>
          <Typography className="value bold">{movement?.formattedTotal}</Typography>
        </div>
        <div className="row">
          <Typography>Pago</Typography>
          <Typography className="value">{movement?.formattedTotalPaid}</Typography>
        </div>
      </div>

      {!movement?.is_open && (
        <div className={classes.warning}>
          <Typography variant="h6">Esta conta foi fechada. Não é possível enviar pedidos</Typography>
        </div>
      )}

      {movement?.is_open && (
        <div className={classes.actions}>
          <Button variant="contained" color="primary" size="large" fullWidth onClick={handleClick}>
            ACESSAR CARDÁPIO
          </Button>
        </div>
      )}
    </div>
  );
};

export default BoardTotal;
