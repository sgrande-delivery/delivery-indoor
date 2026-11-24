import { MenuCategory } from '@/types/menu-category';
import { ProductSummary } from '@/types/product';

export interface MenuSectionData {
  categoryId: number;
  name: string;
  hasChip: boolean;
  products: ProductSummary[];
}

export function sectionElementId(categoryId: number): string {
  return `menu-category-${categoryId}`;
}

function groupByCategory(products: ProductSummary[]): Map<number, MenuSectionData> {
  const groups = new Map<number, MenuSectionData>();

  products.forEach(product => {
    // `category: null` é a projeção que não resolveu a categoria: o produto não tem seção onde entrar.
    if (!product.activated || product.category === null) {
      return;
    }

    const category = product.category;
    const group = groups.get(category.id);

    if (group) {
      group.products.push(product);
      return;
    }

    groups.set(category.id, { categoryId: category.id, name: category.name, hasChip: false, products: [product] });
  });

  return groups;
}

// As duas fontes divergem: a listagem traz categoria que `/categories/v2` não devolve. A ordem sai da relevância das
// categorias e o que sobra vai ao fim, sem chip, para nenhum produto ficar inalcançável. Sem filtro por
// disponibilidade de entrega: a categoria só de mesa vem marcada como indisponível ali.
export function createMenuSections(categories: MenuCategory[], products: ProductSummary[]): MenuSectionData[] {
  const groups = groupByCategory(products);

  // Categoria desativada não vira trilha nem cai no fim como órfã: o grupo dela sai antes da ordenação (RN-09).
  categories.filter(category => !category.activated).forEach(category => groups.delete(category.id));

  const ordered = categories
    .filter(category => category.activated)
    .sort((first, second) => second.relevance - first.relevance)
    .reduce<MenuSectionData[]>((sections, category) => {
      const group = groups.get(category.id);

      if (!group) {
        return sections;
      }

      groups.delete(category.id);
      sections.push({ ...group, name: category.name, hasChip: true });

      return sections;
    }, []);

  return [...ordered, ...groups.values()];
}
