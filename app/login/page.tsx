"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookMarked, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Login failed");
      }
      router.replace(next);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 safe-top safe-bottom">
      <div className="w-full max-w-sm bg-[#141821] border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-400">
            <BookMarked className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">My Library</h1>
            <p className="text-xs text-slate-400">Personal access</p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm text-slate-300">Password</span>
            <div className="mt-1 relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-[#0f131a] border border-slate-800 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                placeholder="Enter library password"
                required
              />
            </div>
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-medium py-2.5"
          >
            {loading ? "Unlocking..." : "Unlock Library"}
          </button>
        </form>
        <p className="text-[11px] text-slate-500 mt-4">
          Set <code>LIBRARY_PASSWORD</code> and <code>AUTH_SECRET</code> in your environment.
        </p>
      </div>
    </main>
  );
}
