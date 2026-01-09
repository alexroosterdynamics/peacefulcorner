"use client";

import React, { useMemo, useState } from "react";
import CalendarManager from "./CalendarManager";

function Card({ title, children }) {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-3xl p-4 sm:p-6 shadow-xl">
      {title ? <div className="text-xl font-bold text-zinc-900 mb-4">{title}</div> : null}
      {children}
    </div>
  );
}

export default function AdminApp({ initialSession }) {
  const [session, setSession] = useState(initialSession);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const loggedIn = useMemo(() => Boolean(session?.sub), [session]);

  async function login(e) {
    e.preventDefault();
    setErr("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!data.ok) return setErr(data.error || "Login failed");
    setSession(data.session);
    setUsername("");
    setPassword("");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession(null);
  }

  return (
    <div className="min-h-screen bg-white">
      {!loggedIn ? (
        <div className="p-4 sm:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900">Administrator</h1>
            </div>
            <Card>
              <div className="max-w-md mx-auto space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  <input
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-200"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-200"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>

                {err ? <div className="text-rose-600 text-sm font-medium">{err}</div> : null}

                <button
                  onClick={login}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-xl font-semibold transition-all"
                >
                  Sign in
                </button>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <>
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 sm:px-8 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">Administrator</h1>
              <div className="flex gap-2 sm:gap-3">
                <a
                  href="/"
                  className="px-3 sm:px-4 py-2 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 font-semibold transition-all text-sm sm:text-base"
                >
                  Home
                </a>
                <button
                  onClick={logout}
                  className="px-3 sm:px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold transition-all text-sm sm:text-base"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
          <CalendarManager />
        </>
      )}
    </div>
  );
}