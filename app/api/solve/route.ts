import { getSupabase, getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const { session_id, q_count, elapsed_sec } = await request.json();

  if (!session_id) {
    return Response.json({ error: "세션 없어." }, { status: 400 });
  }

  const today = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Seoul",
  });

  const supabase = getSupabase();
  // 이미 풀었는지 확인
  const { data: existing } = await supabase
    .from("solves")
    .select("id, rank")
    .eq("date", today)
    .eq("session_id", session_id)
    .single();

  if (existing) {
    return Response.json({ rank: existing.rank, already: true });
  }

  // 오늘 몇 번째인지 계산
  const { count } = await supabase
    .from("solves")
    .select("*", { count: "exact", head: true })
    .eq("date", today);

  const rank = (count ?? 0) + 1;

  const supabaseAdmin = getSupabaseAdmin();
  await supabaseAdmin.from("solves").insert({
    date: today,
    session_id,
    q_count,
    elapsed_sec,
    rank,
  });

  return Response.json({ rank });
}
