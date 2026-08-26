import React, {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useMemo,
  useState,
} from 'react';
import { PER_PAGE_PAGINATION_VALUE } from 'src/constants/constants';

export interface PaginationContext {
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  lastPage: number;
  setLastPage: Dispatch<SetStateAction<number>>;
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
  rows: number;
  error: string | null;
  setError: Dispatch<SetStateAction<string | null>>;
}

const Context = createContext<PaginationContext | null>(null);

export function usePagination(): PaginationContext {
  const context = useContext(Context);

  if (!context) {
    throw new Error('usePagination precisa estar dentro de PaginationProvider');
  }

  return context;
}

const PaginationProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => PER_PAGE_PAGINATION_VALUE, []);

  return (
    <Context.Provider
      value={{
        page,
        setPage,
        lastPage,
        loading,
        setLastPage,
        rows,
        setLoading,
        error,
        setError,
      }}
    >
      {children}
    </Context.Provider>
  );
};

export default PaginationProvider;
