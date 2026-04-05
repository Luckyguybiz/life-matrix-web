"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import Link from "next/link";
import RadarChart from "@/components/RadarChart";
import type { Sphere } from "@/lib/types";

export default function RadarPage() {
  const [spheres, setSpheres] = useState<Sphere[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("spheres")
      .select("*")
      .order("sort_order")
      .then(({ data }) => {
        setSpheres(data || []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-zinc-500">Загрузка...</div>
      </div>
    );
  }

  if (spheres.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-4xl">◎</p>
        <p className="text-zinc-400">Нужно минимум 3 сферы для радара</p>
        <p className="text-zinc-600 text-sm">Сейчас: {spheres.length}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Радарная диаграмма</h2>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
        <RadarChart spheres={spheres} />
      </div>

      <div className="grid gap-2">
        {spheres.map((s) => (
          <Link
            key={s.id}
            href={`/sphere/${s.id}`}
            className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 hover:border-zinc-700 transition"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: s.color || "#8b5cf6" }}
            />
            <span className="flex-1 text-sm font-medium">{s.name}</span>
            <span className="text-xs text-zinc-500">
              {Number(s.current_level) || 0} / {Number(s.target_level) || 10}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
