import { z } from "zod";

import { sample } from "./sample";

import type { Catalog } from "../src/shared";

const catalogSchema = z.object({
  ordersOpen: z.boolean(),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .refine((c) => {
      try {
        new Intl.NumberFormat("en", { style: "currency", currency: c });
        return true;
      } catch {
        return false;
      }
    }),
  site: z.record(z.string(), z.string()),
  products: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      category: z.string(),
      price: z.number().int().nonnegative().max(10000000),
      stock: z.number().int().nonnegative(),
      image: z.string().url(),
      description: z.string(),
      dimensions: z.string(),
      care: z.string(),
    }),
  ),
  zones: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      city: z.string().min(2),
      fee: z.number().int().nonnegative(),
    }),
  ),
  whatsapp: z.union([z.string().regex(/^\d{10,15}$/), z.literal("")]),
  policies: z.object({
    delivery: z.string().min(10),
    returns: z.string().min(10),
    privacy: z.string().min(10),
  }),
});

export async function gateway(action: string, payload: unknown = {}) {
  const url = process.env.SHEETS_GATEWAY_URL,
    secret = process.env.SHEETS_GATEWAY_SECRET;

  if (!url || !secret) throw new Error("Store connection unavailable");

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, action, payload }),
    signal: AbortSignal.timeout(25000),
  });

  if (!response.ok) throw new Error("Store connection unavailable");

  const result = await response.json();
  if (!result.ok)
    throw new Error(result.error || "Store connection unavailable");
  return result.data;
}

export async function catalog(): Promise<Catalog> {
  if (!process.env.SHEETS_GATEWAY_URL) return sample;
  const data = catalogSchema.parse(await gateway("catalog"));
  return {
    ...data,
    demo: false,
    ordersOpen: data.ordersOpen && process.env.ORDERS_ENABLED === "true",
  };
}
