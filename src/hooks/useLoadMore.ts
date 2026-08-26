import { useCallback } from 'react';
import { usePagination } from 'src/providers/PaginationProvider';
import { useInfiniteScroll } from './useInfiniteScroll';

export function useLoadMore() {
  const { lastPage, page, setPage, loading, error } = usePagination();

  const canLoadMore = page < lastPage && !error;

  const loadMore = useCallback(() => {
    if (!loading && canLoadMore) {
      setPage(state => state + 1);
    }
  }, [loading, canLoadMore, setPage]);

  const endRef = useInfiniteScroll(loadMore, {
    disabled: !canLoadMore,
    rootMargin: '0px 0px 300px 0px',
  });

  return endRef;
}
