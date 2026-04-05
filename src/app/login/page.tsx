"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
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
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-white/20 transition" required />
          <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-white/20 transition" required />

          {error && <p className="text-white/40 text-xs text-center">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full border border-white/20 text-white/70 py-3 rounded-lg text-xs hover:border-white/40 hover:text-white transition disabled:opacity-30">
            {loading ? "..." : "Войти"}
          </button>
        </form>

        <p className="text-white/15 text-center mt-8 text-[11px]">
          <Link href="/register" className="hover:text-white/40 transition">Регистрация</Link>
        </p>
      </div>
    </div>
  );
}
