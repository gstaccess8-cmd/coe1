import { NextResponse } from "next/server";
import { requireSession } from "@/lib/server/auth";
import { getRepo } from "@/lib/server/singleton";

export async function GET(req: Request) {
  if (!requireSession(req)) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const url = new URL(req.url);

  /*
   * Capped, because `limit` arrives from the browser and an unbounded one
   * would let a single request pull the whole table into memory.
   */
  const limit = Math.min(1000, Math.max(1, Number(url.searchParams.get("limit") ?? "100") || 100));
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? "0") || 0);
  const sinceParam = url.searchParams.get("since");
  // Only a value the database can actually compare — a malformed date would
  // otherwise silently filter everything out and look like an empty log.
  const since =
    sinceParam && !Number.isNaN(Date.parse(sinceParam)) ? sinceParam : undefined;

  const repo = getRepo();
  /*
   * The total is for the window, not the table: it answers "is there more
   * to load", which is the only question the Load more button needs.
   */
  return NextResponse.json({
    rows: repo.listCommandLogs(limit, { offset, since }),
    total: repo.countCommandLogs(since),
  });
}
