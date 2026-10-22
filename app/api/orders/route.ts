import { catalog, gateway } from "../../../server/store";

import { orderSchema, whatsappLink } from "../../../server/domain";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (
    !process.env.PUBLIC_ORIGIN ||
    req.headers.get("origin") !== process.env.PUBLIC_ORIGIN
  )
    return Response.json(
      { error: "Please place your order from the store website." },
      { status: 403 },
    );

  if (Number(req.headers.get("content-length") || 0) > 16384)
    return Response.json({ error: "Request too large." }, { status: 413 });

  let body;
  try {
    const reader = req.body?.getReader();
    if (!reader) throw new Error("Empty request");
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 16384) {
        await reader.cancel();
        return Response.json({ error: "Request too large." }, { status: 413 });
      }
      chunks.push(value);
    }
    const text = Buffer.concat(chunks).toString("utf8");
    body = JSON.parse(text);
  } catch {
    return Response.json(
      { error: "Request could not be read." },
      { status: 400 },
    );
  }

  const parsed = orderSchema.safeParse(body);
  if (!parsed.success)
    return Response.json(
      { error: "Check your delivery details and bag." },
      { status: 400 },
    );

  if (!process.env.SHEETS_GATEWAY_URL || process.env.ORDERS_ENABLED !== "true")
    return Response.json(
      { error: "Orders are not open yet. Your bag has been kept." },
      { status: 503 },
    );

  try {
    const c = await catalog();
    if (!c.ordersOpen)
      return Response.json(
        { error: "Orders are not open yet." },
        { status: 503 },
      );

    const order = await gateway("order", parsed.data);

    return Response.json(
      {
        id: order.id,
        total: order.total,
        delivery: order.delivery,
        whatsapp: whatsappLink(
          c.whatsapp,
          `Hello Lakkar Home, I placed COD order ${order.id}. Total ${c.currency} ${order.total}. Please confirm my order.`,
        ),
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    const known =
      e instanceof Error &&
      /unavailable in|delivery area|changed|stock|key|attempt/i.test(e.message);
    return Response.json(
      {
        error: known
          ? (e as Error).message
          : "We could not confirm your order. Retry with the same details; duplicate orders are prevented.",
      },
      { status: known ? 409 : 503 },
    );
  }
}
