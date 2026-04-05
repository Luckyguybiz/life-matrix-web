"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function NewProjectPage() {
  const searchParams = useSearchParams();
  const sphereId = searchParams.get("sphereId") || "";
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pointA, setPointA] = useState("");
  const [pointB, setPointB] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !sphereId) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("projects").insert({
      user_id: user.id,
      sphere_id: sphereId,
      title: title.trim(),
      description: description.trim(),
      point_a: pointA.trim(),
      point_b: pointB.trim(),
    });

    router.push(`/sphere/${sphereId}`);
    router.refresh();
  }

  const inputCls =
    "w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 text-white placeholder-zinc-700 focus:outline-none focus:border-violet-500/30 focus:bg-white/[0.05] transition-all text-sm";

  return (
    <div className="max-w-md animate-fade-in relative">
      <div className="absolute -top-20 -right-20 w-[200px] h-[200px] rounded-full bg-violet-600/[0.03] blur-[100px] pointer-events-none" />

      <Link
        href={sphereId ? `/sphere/${sphereId}` : "/"}
        className="text-zinc-600 hover:text-zinc-300 text-xs mb-6 inline-flex items-center gap-1.5 transition"
      >
        <span>←</span> Назад
      </Link>

      <h2 className="text-2xl font-bold tracking-tight mb-8">Новый проект</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-[10px] text-zinc-600 uppercase tracking-widest mb-2.5">
            Название
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Пробежать марафон"
            className={inputCls}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-zinc-600 uppercase tracking-widest mb-2.5">
              Точка А
            </label>
            <input
              type="text"
              value={pointA}
              onChange={(e) => setPointA(e.target.value)}
              placeholder="Где сейчас"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-[10px] text-zinc-600 uppercase tracking-widest mb-2.5">
              Точка Б
            </label>
            <input
              type="text"
              value={pointB}
              onChange={(e) => setPointB(e.target.value)}
              placeholder="Куда хочу"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] text-zinc-600 uppercase tracking-widest mb-2.5">
            Описание <span className="text-zinc-800">· опционально</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Детали, заметки..."
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* Preview */}
        {(pointA || pointB) && (
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 flex items-center gap-3">
            <span className="text-xs text-zinc-500">{pointA || "?"}</span>
            <div className="flex-1 h-px bg-gradient-to-r from-zinc-700 via-violet-500/30 to-zinc-700" />
            <span className="text-xs text-violet-400">{pointB || "?"}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="w-full bg-white text-black font-semibold py-3.5 rounded-xl hover:bg-zinc-100 transition-all text-sm disabled:opacity-30"
        >
          {saving ? "Создание..." : "Создать проект"}
        </button>
      </form>
    </div>
  );
}
