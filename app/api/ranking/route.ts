import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const today = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Seoul",
  });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("solves")
    .select("nickname, q_count, elapsed_sec, rank")
    .eq("date", today)
    .order("rank", { ascending: true })
    .limit(20);

  if (error) {
    return Response.json({ error: "랭킹 조회 실패" }, { status: 500 });
  }

  return Response.json(data ?? []);
}
