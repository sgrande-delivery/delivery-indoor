import { Image } from './image';
import { Paginated } from './paginated';
import { Product } from './product';
import { Restaurant } from './restaurant';

export interface Category {
  id: number;
  restaurant_id: number;
  image_id: number;
  name: string;
  description: string;
  keywords: string;
  url: string;
  is_pizza: boolean;
  has_ingredient: boolean;
  has_additional: boolean;
  activated: boolean;
  has_complement: boolean;
  available_products_amount: number;
  image: Image;
  restaurant: Restaurant;
}

export interface CategoryWithPaginatedProducts extends Category {
  products: Paginated<Product[]>;
}
