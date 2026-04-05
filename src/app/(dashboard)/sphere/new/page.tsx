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

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

export default function NewSpherePage() {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [targetLevel, setTargetLevel] = useState(10);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const rgb = hexToRgb(color);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existing } = await supabase
      .from("spheres")
      .select("sort_order")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: false })
      .limit(1);

    const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

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
    <div className="max-w-md animate-fade-in relative">
      {/* Ambient glow */}
      <div
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-[200px] h-[200px] rounded-full blur-[100px] pointer-events-none transition-colors duration-500"
        style={{ backgroundColor: color, opacity: 0.05 }}
      />

      <Link
        href="/"
        className="text-zinc-600 hover:text-zinc-300 text-xs mb-6 inline-flex items-center gap-1.5 transition"
      >
        <span>←</span> Матрица
      </Link>

      <h2 className="text-2xl font-bold tracking-tight mb-8">Новая сфера</h2>

      <form onSubmit={handleSubmit} className="space-y-7">
        <div>
          <label className="block text-[10px] text-zinc-600 uppercase tracking-widest mb-2.5">
            Название
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например: Путешествия"
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 text-white placeholder-zinc-700 focus:outline-none focus:border-violet-500/30 focus:bg-white/[0.05] transition-all text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] text-zinc-600 uppercase tracking-widest mb-3">
            Цвет
          </label>
          <div className="flex gap-3 flex-wrap">
            {COLORS.map((c) => {
              const cRgb = hexToRgb(c);
              const active = color === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
                  style={{
                    backgroundColor: c,
                    boxShadow: active
                      ? `0 0 20px rgba(${cRgb.r},${cRgb.g},${cRgb.b},0.5), 0 0 40px rgba(${cRgb.r},${cRgb.g},${cRgb.b},0.2)`
                      : "none",
                    transform: active ? "scale(1.15)" : "scale(1)",
                  }}
                >
                  {active && <span className="text-white text-xs font-bold">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-[10px] text-zinc-600 uppercase tracking-widest mb-3">
            Целевой уровень · {targetLevel}
          </label>
          <div className="flex gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setTargetLevel(n)}
                className="flex-1 h-2.5 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: n <= targetLevel ? color : "rgba(255,255,255,0.04)",
                  boxShadow:
                    n <= targetLevel
                      ? `0 0 8px rgba(${rgb.r},${rgb.g},${rgb.b},0.3)`
                      : "none",
                }}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="flex items-center justify-center py-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500"
            style={{
              background: `radial-gradient(circle at 35% 35%, ${color}, ${color}aa)`,
              boxShadow: `0 0 30px rgba(${rgb.r},${rgb.g},${rgb.b},0.3)`,
            }}
          >
            <span className="text-white text-sm font-bold">{targetLevel}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="w-full font-semibold py-3.5 rounded-xl transition-all text-sm disabled:opacity-30"
          style={{
            backgroundColor: color,
            color: "#fff",
            boxShadow: `0 0 20px rgba(${rgb.r},${rgb.g},${rgb.b},0.3)`,
          }}
        >
          {saving ? "Создание..." : "Создать сферу"}
        </button>
      </form>
    </div>
  );
}
