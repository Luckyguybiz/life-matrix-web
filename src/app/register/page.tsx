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

    if (password.length < 6) {
      setError("Пароль должен быть не менее 6 символов");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/[0.04] rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-sm relative animate-fade-in">
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <span className="text-white text-xl font-bold">L</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white text-center mb-1 tracking-tight">
          Life Matrix
        </h1>
        <p className="text-zinc-500 text-center mb-8 text-sm">
          Создайте аккаунт
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/30 focus:bg-white/[0.06] transition-all text-sm"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/30 focus:bg-white/[0.06] transition-all text-sm"
            required
          />
          <input
            type="password"
            placeholder="Па��оль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/30 focus:bg-white/[0.06] transition-all text-sm"
            required
          />

          {error && (
            <p className="text-red-400 text-xs text-center bg-red-400/[0.06] rounded-lg py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-semibold py-3.5 rounded-xl hover:bg-zinc-100 transition-all disabled:opacity-50 text-sm"
          >
            {loading ? "Регистрация..." : "Зарегистрироваться"}
          </button>
        </form>

        <p className="text-zinc-600 text-center mt-6 text-xs">
          Уже есть а��каунт?{" "}
          <Link
            href="/login"
            className="text-zinc-400 hover:text-white transition"
          >
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
