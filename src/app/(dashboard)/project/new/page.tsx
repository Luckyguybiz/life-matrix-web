"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function NewProjectPage() {
  const searchParams = useSearchParams();
  const sphereId = searchParams.get("sphereId") || "";
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !sphereId) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("projects").insert({ user_id: user.id, sphere_id: sphereId, name: name.trim(), description: description.trim() });
    router.push(`/sphere/${sphereId}`); router.refresh();
  }

  const inp = "w-full bg-transparent border border-white/[0.06] rounded-lg px-4 py-3 text-sm text-white/60 placeholder-white/12 focus:outline-none focus:border-white/15 transition";

  return (
    <div className="max-w-sm animate-fade-in">
      <Link href={sphereId ? `/sphere/${sphereId}` : "/"} className="text-white/20 hover:text-white/40 text-[11px] mb-8 inline-block transition">← Назад</Link>
      <h2 className="text-lg font-medium text-white/70 mb-8">Новый проект</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[9px] text-white/15 uppercase tracking-widest mb-2">Название</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Пробежать марафон" className={inp} required />
        </div>
        <div>
          <label className="block text-[9px] text-white/15 uppercase tracking-widest mb-2">Описание</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Опционально" rows={3} className={`${inp} resize-none`} />
        </div>
        <button type="submit" disabled={saving || !name.trim()}
          className="w-full border border-white/20 text-white/60 py-3 rounded-lg text-xs hover:border-white/40 hover:text-white transition disabled:opacity-20">
          {saving ? "..." : "Создать"}
        </button>
      </form>
    </div>
  );
}
