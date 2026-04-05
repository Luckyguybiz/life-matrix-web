"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import type { User } from "@supabase/supabase-js";

const NAV = [
  { href: "/", label: "Матрица" },
  { href: "/radar", label: "Радар" },
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

  const name = user.user_metadata?.name || user.email?.split("@")[0] || "U";

  return (
    <aside className="w-48 border-r border-white/[0.04] flex flex-col h-full">
      <div className="p-5 border-b border-white/[0.04]">
        <h1 className="text-xs font-medium text-white/50 tracking-widest uppercase">
          Life Matrix
        </h1>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              className={`block px-3 py-2 rounded-lg text-xs transition-all ${
                active
                  ? "text-white/80 bg-white/[0.04]"
                  : "text-white/25 hover:text-white/50"
              }`}>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/[0.04]">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-6 h-6 rounded-full border border-white/15 flex items-center justify-center">
            <span className="text-[9px] text-white/40">{name.charAt(0).toUpperCase()}</span>
          </div>
          <span className="text-[10px] text-white/25 truncate">{user.email}</span>
        </div>
        <button onClick={handleSignOut}
          className="w-full px-3 py-1.5 text-[10px] text-white/20 text-left hover:text-white/40 transition">
          Выйти
        </button>
      </div>
    </aside>
  );
}
