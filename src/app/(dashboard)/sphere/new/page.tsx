"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewSpherePage() {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: existing } = await supabase.from("spheres").select("sort_order").eq("user_id", user.id).order("sort_order", { ascending: false }).limit(1);
    const next = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;
    await supabase.from("spheres").insert({ user_id: user.id, name: name.trim(), icon: "circle", color: "#ffffff", score: 0, sort_order: next });
    router.push("/"); router.refresh();
  }

  return (
    <div className="max-w-sm animate-fade-in">
      <Link href="/" className="text-white/20 hover:text-white/40 text-[11px] mb-8 inline-block transition">← Матрица</Link>
      <h2 className="text-lg font-medium text-white/70 mb-8">Новая сфера</h2>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block text-[9px] text-white/15 uppercase tracking-widest mb-2">Название</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Здоровье, Финансы..."
            className="w-full bg-transparent border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white/70 placeholder-white/15 focus:outline-none focus:border-white/20 transition" required />
        </div>
        <div className="flex justify-center py-4">
          <div className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center">
            <span className="text-sm text-white/50 font-medium">0</span>
          </div>
        </div>
        <button type="submit" disabled={saving || !name.trim()}
          className="w-full border border-white/20 text-white/60 py-3 rounded-lg text-xs hover:border-white/40 hover:text-white transition disabled:opacity-20">
          {saving ? "..." : "Создать"}
        </button>
      </form>
    </div>
  );
}
