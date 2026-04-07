import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const today = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Seoul",
  });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("words")
    .select("id, date, category, hints")
    .eq("date", today)
    .single();

  if (error || !data) {
    return Response.json({ error: "오늘 단어가 없어." }, { status: 404 });
  }

  return Response.json(data);
}
