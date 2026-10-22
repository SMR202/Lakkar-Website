export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  description: string;
  dimensions: string;
  care: string;
};

export type Zone = { id: string; name: string; fee: number; city: string };

export type Catalog = {
  products: Product[];
  zones: Zone[];
  demo: boolean;
  ordersOpen: boolean;
  currency: string;
  site: Record<string, string>;
  whatsapp: string;
  policies: { delivery: string; returns: string; privacy: string };
};

export type CartItem = { id: string; quantity: number };

export const money = (n: number, currency = "PKR") =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
