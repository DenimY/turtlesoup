import { createClient } from "@supabase/supabase-js";

export type Word = {
  id: number;
  date: string;
  word: string;
  category: string;
  hints: string[];
};

export type Solve = {
  id: number;
  date: string;
  session_id: string;
  q_count: number;
  elapsed_sec: number;
  rank: number;
};

// 클라이언트 사이드용 (읽기) — 빌드 시 env 없을 경우 대비해 함수로 래핑
export function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  );
}

// 서버 사이드용 (쓰기, Cron)
export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
