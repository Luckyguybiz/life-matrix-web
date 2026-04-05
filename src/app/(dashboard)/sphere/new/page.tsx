"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import Link from "next/link";

const COLORS = [
  "#3b82f6", "#22c55e", "#eab308", "#a855f7",
  "#ef4444", "#f97316", "#06b6d4", "#ec4899",
  "#8b5cf6", "#14b8a6",
];

export default function NewSpherePage() {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [targetLevel, setTargetLevel] = useState(10);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existing } = await supabase
      .from("spheres")
      .select("sort_order")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: false })
      .limit(1);

    const nextOrder =
      existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

    await supabase.from("spheres").insert({
      user_id: user.id,
      name: name.trim(),
      icon: "ellipse-outline",
      color,
      target_level: targetLevel,
      sort_order: nextOrder,
    });

    router.push("/");
    router.refresh();
  }

  return (
    <div className="max-w-md">
      <Link
        href="/"
        className="text-zinc-500 hover:text-white text-sm mb-4 inline-block"
      >
        ← Назад
      </Link>

      <h2 className="text-xl font-bold mb-6">Новая сфера</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs text-zinc-500 uppercase tracking-wide mb-2">
            Название
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например: Путешествия"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            required
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-500 uppercase tracking-wide mb-2">
            Цвет
          </label>
          <div className="flex gap-3 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-9 h-9 rounded-full flex items-center justify-center transition"
                style={{ backgroundColor: c }}
              >
                {color === c && (
                  <span className="text-white text-sm">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-zinc-500 uppercase tracking-wide mb-2">
            Целевой уровень: {targetLevel}
          </label>
          <div className="flex gap-1.5">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setTargetLevel(n)}
                className="flex-1 h-2 rounded-full transition"
                style={{
                  backgroundColor: n <= targetLevel ? color : "#333",
                }}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition disabled:opacity-50"
        >
          {saving ? "Создание..." : "Создать сферу"}
        </button>
      </form>
    </div>
  );
}
