"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import Link from "next/link";
import ProgressBar from "@/components/ProgressBar";
import type { Sphere } from "@/lib/types";

export default function MatrixPage() {
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Матрица жизни</h2>
        <Link
          href="/sphere/new"
          className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-200 transition"
        >
          + Новая сфера
        </Link>
      </div>

      {spheres.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">◎</p>
          <p className="text-zinc-400 mb-2">Нет сфер</p>
          <p className="text-zinc-600 text-sm">
            Добавьте первую сферу жизни для начала
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {spheres.map((s) => {
            const pct =
              (Number(s.target_level) || 1) > 0
                ? ((Number(s.current_level) || 0) /
                    (Number(s.target_level) || 1)) *
                  100
                : 0;

            return (
              <Link
                key={s.id}
                href={`/sphere/${s.id}`}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                    style={{ backgroundColor: (s.color || "#8b5cf6") + "20" }}
                  >
                    <span style={{ color: s.color || "#8b5cf6" }}>●</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white group-hover:text-zinc-100">
                      {s.name}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {Number(s.current_level) || 0} / {Number(s.target_level) || 10}
                    </div>
                  </div>
                  <span className="text-zinc-600 group-hover:text-zinc-400 transition">
                    →
                  </span>
                </div>
                <ProgressBar progress={pct} color={s.color || "#8b5cf6"} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
