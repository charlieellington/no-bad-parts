import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST() {
  const supabase = await createClient();

  // 1) Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Find current user's signup row id
  const { data: selfRow, error: selfErr } = await supabase
    .from("waitlist_signups")
    .select("id")
    .eq("email", user.email!)
    .single();

  if (selfErr || !selfRow)
    return NextResponse.json({ error: "row_not_found" }, { status: 404 });

  // fetch ordered rows with id & rank
  const { data: rows, error: rowsErr } = await supabase
    .from("waitlist_public")
    .select("id,email,rank")
    .order("rank", { ascending: true })
    .order("created_at", { ascending: true });

  if (rowsErr || !rows)
    return NextResponse.json({ error: rowsErr?.message ?? "list error" }, { status: 500 });

  const totalRows = rows.length;
  const placesUp = totalRows < 10 ? 1 : totalRows < 100 ? 5 : 10;

  const currentIdx = rows.findIndex((r: any) => r.id === selfRow.id);
  if (currentIdx === -1)
    return NextResponse.json({ error: "row not in list" }, { status: 404 });

  const targetIdx = Math.max(0, currentIdx - placesUp);

  let referenceRank: number;
  if (targetIdx === 0) {
    // use smallest existing rank or 1 if none
    referenceRank = rows[0].rank ?? 1;
    referenceRank = referenceRank - 1;
  } else {
    const refRow = rows[targetIdx];
    referenceRank = (refRow.rank ?? (rows[targetIdx - 1].rank ?? 0) + 1) - 1;
  }

  const newRank = referenceRank;

  // 3) Update only the current user's row
  const { error: updErr } = await supabase
    .from("waitlist_signups")
    .update({ rank: newRank })
    .eq("email", user.email!);

  if (updErr)
    return NextResponse.json({ error: updErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
} 