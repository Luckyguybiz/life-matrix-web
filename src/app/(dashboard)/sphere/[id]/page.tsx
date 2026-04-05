"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Sphere, Project } from "@/lib/types";

export default function SphereDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [sphere, setSphere] = useState<Sphere | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      supabase.from("spheres").select("*").eq("id", id).single(),
      supabase.from("projects").select("*").eq("sphere_id", id).order("created_at", { ascending: false }),
    ]).then(([s, p]) => { setSphere(s.data); setProjects(p.data || []); setLoading(false); });
  }, [id]);

  async function handleDelete() {
    if (!confirm("Удалить сферу?")) return;
    await supabase.from("spheres").delete().eq("id", id);
    router.push("/"); router.refresh();
  }

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border border-white/20 border-t-white/60 rounded-full animate-spin" /></div>;
  if (!sphere) return <div className="flex items-center justify-center h-full text-white/20">Не найдена</div>;

  const score = Number(sphere.score) || 0;
  const pct = (score / 10) * 100;

  return (
    <div className="max-w-xl animate-fade-in">
      <Link href="/" className="text-white/20 hover:text-white/40 text-[11px] mb-8 inline-block transition">← Матрица</Link>

      <div className="flex items-center gap-5 mb-8">
        <div className="w-14 h-14 rounded-full border border-white/15 bg-black flex items-center justify-center relative">
          <span className="text-lg font-semibold text-white/60">{score.toFixed(score % 1 === 0 ? 0 : 1)}</span>
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="27" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.05" />
            <circle cx="28" cy="28" r="27" fill="none" stroke="#fff" strokeWidth="1" opacity="0.25"
              strokeDasharray={`${pct * 1.696} 200`} strokeLinecap="round" className="transition-all duration-700" />
          </svg>
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-medium text-white/80">{sphere.name}</h2>
          <p className="text-white/20 text-xs mt-1">{score} / 10</p>
        </div>
        <button onClick={handleDelete} className="text-white/10 hover:text-white/30 text-xs transition">Удалить</button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] text-white/20 uppercase tracking-widest">Проекты · {projects.length}</span>
        <Link href={`/project/new?sphereId=${id}`}
          className="border border-white/10 text-white/30 px-3 py-1 rounded-full text-[10px] hover:text-white/50 hover:border-white/20 transition">+ Проект</Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 text-white/15 text-xs">Нет проектов</div>
      ) : (
        <div className="space-y-2">
          {projects.map((p) => (
            <Link key={p.id} href={`/project/${p.id}`}
              className="block border border-white/[0.04] rounded-lg p-4 hover:border-white/[0.1] transition-all group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/50 group-hover:text-white/70 transition">{p.name}</span>
                <span className="text-[10px] text-white/15">{p.status === "completed" ? "✓" : `${p.progress}%`}</span>
              </div>
              <div className="h-px bg-white/[0.04] overflow-hidden">
                <div className="h-full bg-white/20 transition-all duration-500" style={{ width: `${p.progress}%` }} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
