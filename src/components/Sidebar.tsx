"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import type { User } from "@supabase/supabase-js";

const NAV = [
  { href: "/", label: "Матрица", icon: "◎" },
  { href: "/radar", label: "Радар", icon: "◈" },
];

export default function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const name = user.user_metadata?.name || user.email?.split("@")[0] || "User";

  return (
    <aside className="w-56 bg-zinc-950/80 backdrop-blur-xl border-r border-zinc-800/50 flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-zinc-800/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
            <span className="text-white text-sm font-bold">L</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">
              Life Matrix
            </h1>
            <p className="text-[10px] text-zinc-600">Трекинг жизни</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-white/[0.06] text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"
              }`}
            >
              <span className={`text-base ${active ? "opacity-100" : "opacity-50"}`}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-zinc-800/50">
        <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
            <span className="text-xs text-zinc-400 font-semibold">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-400 font-medium truncate">{name}</p>
            <p className="text-[10px] text-zinc-600 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full px-3 py-2 text-xs text-zinc-600 hover:text-red-400 text-left rounded-lg hover:bg-white/[0.03] transition-all"
        >
          Выйти
        </button>
      </div>
    </aside>
  );
}
