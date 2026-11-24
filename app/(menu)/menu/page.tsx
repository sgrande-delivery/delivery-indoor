import type { ReactElement } from 'react';
import { notFound, redirect } from 'next/navigation';
import MenuCategoryScreen from '@/components/category/MenuCategoryScreen';
import { CATEGORY_SEARCH_PARAM, HOME_ROUTE, parseCategoryId } from '@/routes/app-routes';

interface MenuPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MenuPage({ searchParams }: MenuPageProps): Promise<ReactElement> {
  const raw = (await searchParams)[CATEGORY_SEARCH_PARAM];

  if (raw === undefined) {
    redirect(HOME_ROUTE);
  }

  const categoryId = parseCategoryId(raw);

  if (categoryId === null) {
    notFound();
  }

  return <MenuCategoryScreen categoryId={categoryId} />;
}
