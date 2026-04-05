"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Минимум 6 символов"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    if (error) { setError(error.message); setLoading(false); }
    else { router.push("/"); router.refresh(); }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-xs animate-fade-in">
        <h1 className="text-xs font-medium text-white/40 tracking-widest uppercase text-center mb-10">
          Life Matrix
        </h1>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="text" placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-white/20 transition" required />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-white/20 transition" required />
          <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-white/20 transition" required />

          {error && <p className="text-white/40 text-xs text-center">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full border border-white/20 text-white/70 py-3 rounded-lg text-xs hover:border-white/40 hover:text-white transition disabled:opacity-30">
            {loading ? "..." : "Создать аккаунт"}
          </button>
        </form>

        <p className="text-white/15 text-center mt-8 text-[11px]">
          <Link href="/login" className="hover:text-white/40 transition">Войти</Link>
        </p>
      </div>
    </div>
  );
}
