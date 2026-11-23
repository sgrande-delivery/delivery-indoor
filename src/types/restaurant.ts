import { Image } from './image';

export type RestaurantConfigTaxMode = 'district' | 'distance' | 'no_tax' | 'order_value' | 'products_amount';
export type RestaurantConfigPizzaCalculate = 'higher_value' | 'average_value';

export interface RestaurantConfig {
  pizza_calculate: RestaurantConfigPizzaCalculate;
  require_login: boolean;
  customer_collect: boolean;
  tax_mode: RestaurantConfigTaxMode;
  tax_value: number;
  delivery_time: number;
  board_time: number;
  order_minimum_value: number;
  order_auto_approve: boolean;
  use_postalcode: boolean;
  shipment_schedule: boolean;
  shipment_date_schedule: boolean;
  use_deliverer: boolean;
  google_analytics_id: string;
  facebook_pixel_id: string;
  google_login: boolean;
  facebook_login: boolean;
  order_minimum_products_amount: number;
  cart_accumulate_discount: boolean;
  restaurant_address_selection: boolean;
  use_google_map_addresses: boolean;
  checkout_allow_change_address: boolean;
}

export interface RestaurantAddress {
  id: number;
  address: string;
  number: string;
  district: string;
  postal_code: string;
  city: string;
  is_main: boolean;
  region: string;
  complement: string | null;
  nickname: string;
  active: boolean;
}

interface RestaurantPhones {
  id: number;
  phone: string;
}

export interface Restaurant {
  uuid: string;
  id: number;
  is_open: boolean;
  is_kitchen_open: boolean;
  name: string;
  description: string;
  logo: string | null;
  favicon: string | null;
  keywords?: string;
  title?: string;
  url: string;
  cnpj: string;
  corporate_name: string;
  email: string;
  primary_color: string;
  secondary_color: string;
  facebook_link: string | null;
  instagram_link: string | null;
  twitter_link: string | null;
  image_id: number | null;
  cover_id: number | null;
  working_hours: string;
  image: Image | null;
  cover: Image | null;
  mobile_cover: Image | null;
  configs: RestaurantConfig;
  delivery_max_distance: number;
  addresses: RestaurantAddress[];
  phones: RestaurantPhones[];
  play_store_link: string;
  payment_gateway: string;
}
