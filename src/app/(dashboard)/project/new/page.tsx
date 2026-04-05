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

    const {
      data: { user },
    } = await supabase.auth.getUser();
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

  return (
    <div className="max-w-md">
      <Link
        href={sphereId ? `/sphere/${sphereId}` : "/"}
        className="text-zinc-500 hover:text-white text-sm mb-4 inline-block"
      >
        ← Назад
      </Link>

      <h2 className="text-xl font-bold mb-6">Новый проект</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs text-zinc-500 uppercase tracking-wide mb-2">
            Название
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Пробежать марафон"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            required
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-500 uppercase tracking-wide mb-2">
            Точка А — где сейчас
          </label>
          <input
            type="text"
            value={pointA}
            onChange={(e) => setPointA(e.target.value)}
            placeholder="Не могу пробежать 1 км"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-500 uppercase tracking-wide mb-2">
            Точка Б — куда хочу
          </label>
          <input
            type="text"
            value={pointB}
            onChange={(e) => setPointB(e.target.value)}
            placeholder="Пробежать марафон 42 км"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-500 uppercase tracking-wide mb-2">
            Описание (опционально)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Детали, заметки..."
            rows={3}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition disabled:opacity-50"
        >
          {saving ? "Создание..." : "Создать проект"}
        </button>
      </form>
    </div>
  );
}
