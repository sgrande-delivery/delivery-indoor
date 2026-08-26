import { useEffect, useSyncExternalStore } from 'react';
import { SOCKET_APP } from 'src/constants/constants';
import { useSelector } from 'src/store/redux/selector';
import { SocketStore } from 'src/store/socket-store';

const store = new SocketStore(process.env.NEXT_PUBLIC_SOCKET!, 'board', SOCKET_APP);

export function useBoardSocket() {
  const restaurant = useSelector(state => state.restaurant);

  useEffect(() => {
    if (restaurant) {
      store.connect(restaurant.uuid);
    }
  }, [restaurant]);

  return useSyncExternalStore(
    store.subscribe.bind(store),
    store.getSnapshot.bind(store),
    store.getSnapshot.bind(store)
  );
}
