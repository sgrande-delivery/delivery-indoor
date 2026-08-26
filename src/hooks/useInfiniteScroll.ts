import { useEffect, useRef } from 'react';

type Opts = {
  root?: Element | null;
  rootMargin?: string;
  disabled?: boolean;
};

export function useInfiniteScroll(onLoadMore: () => void, opts?: Opts) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (opts?.disabled) {
      return;
    }

    const element = ref.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLoadMore();
        }
      },
      {
        root: opts?.root ?? null,
        rootMargin: opts?.rootMargin ?? '0px 0px 300px 0px',
        threshold: 0,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [onLoadMore, opts?.root, opts?.rootMargin, opts?.disabled]);

  return ref;
}
