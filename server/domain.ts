import { z } from "zod";
import type { Catalog } from "../src/shared";
export const orderSchema = z
  .object({
    key: z.string().uuid(),
    expectedTotal: z.number().int().nonnegative(),
    customer: z.object({
      name: z.string().trim().min(2).max(80),
      phone: z
        .string()
        .regex(
          /^(?:\+92|0)3\d{9}$/,
          "Enter a Pakistani mobile number, e.g. 03001234567",
        ),
      email: z.union([z.string().email().max(150), z.literal("")]).optional(),
      address: z.string().trim().min(12).max(400),
      city: z.string().trim().min(2).max(80),
      zone: z.string().max(50),
      notes: z.string().max(500).optional(),
    }),
    items: z
      .array(
        z.object({
          id: z.string().max(80),
          quantity: z.number().int().min(1).max(20),
        }),
      )
      .min(1)
      .max(30),
  })
  .strict();
export function quote(
  c: Catalog,
  items: { id: string; quantity: number }[],
  zoneId: string,
) {
  const zone = c.zones.find((z) => z.id === zoneId);
  if (!zone) throw new Error("Choose an available delivery area.");
  const merged = new Map<string, number>();
  for (const i of items) merged.set(i.id, (merged.get(i.id) || 0) + i.quantity);
  const lines = [...merged].map(([id, quantity]) => {
    const p = c.products.find((p) => p.id === id);
    if (!p || quantity > p.stock || quantity > 20)
      throw new Error(
        "An item is unavailable in the requested quantity. Review your bag.",
      );
    return { id, name: p.name, quantity, price: p.price };
  });
  const subtotal = lines.reduce((s, i) => s + i.price * i.quantity, 0);
  return { lines, subtotal, delivery: zone.fee, total: subtotal + zone.fee };
}
export function whatsappLink(phone: string, message: string) {
  return /^\d{10,15}$/.test(phone)
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : null;
}
