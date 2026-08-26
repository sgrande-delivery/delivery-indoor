export interface Paginated<T> {
  items: T;
  total: number;
  current_page: number;
  last_page: number;
}
