import { catalog } from "../../../server/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await catalog(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      {
        error:
          "The collection is temporarily unavailable. Please try again shortly.",
      },
      { status: 503 },
    );
  }
}
