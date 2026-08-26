import { useEffect, useSyncExternalStore } from 'react';
import { SOCKET_APP } from 'src/constants/constants';
import { useSelector } from 'src/store/redux/selector';
import { SocketStore } from 'src/store/socket-store';

const store = new SocketStore(process.env.NEXT_PUBLIC_SOCKET!, 'client', SOCKET_APP);

export function useClientSocket() {
  const restaurant = useSelector(state => state.restaurant);

  useEffect(() => {
    if (restaurant) {
      store.connect(restaurant.uuid);
    }
  }, [restaurant]);

  useEffect(() => {
    return () => {
      store.disconnect();
    };
  }, []);

  return useSyncExternalStore(
    store.subscribe.bind(store),
    store.getSnapshot.bind(store),
    store.getSnapshot.bind(store)
  );
}
