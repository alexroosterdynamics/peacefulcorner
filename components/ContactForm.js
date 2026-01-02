// components/ContactForm.js
"use client";

import { useState } from "react";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState({ type: "idle", msg: "" });

  async function submit(e) {
    e.preventDefault();
    setStatus({ type: "loading", msg: "Sending..." });

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      setStatus({ type: "error", msg: data.error || "Could not send." });
      return;
    }

    setForm({ name: "", email: "", message: "" });
    setStatus({ type: "success", msg: "Message sent! We’ll reply soon." });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs text-zinc-300">Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-white/25"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-300">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-white/25"
            placeholder="you@email.com"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-zinc-300">Message</label>
        <textarea
          value={form.message}
          onChange={(e) => setForm((s) => ({ ...s, message: e.target.value }))}
          rows={5}
          className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-white/25"
          placeholder="Tell us your dates, questions, or anything you need."
        />
      </div>

      <button
        type="submit"
        disabled={status.type === "loading"}
        className="w-full rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 disabled:opacity-50"
      >
        {status.type === "loading" ? "Sending..." : "Send message"}
      </button>

      {status.type !== "idle" && (
        <div
          className={[
            "rounded-xl border px-3 py-2 text-sm",
            status.type === "success"
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
              : status.type === "error"
              ? "border-rose-400/30 bg-rose-500/10 text-rose-200"
              : "border-white/10 bg-white/5 text-zinc-200",
          ].join(" ")}
        >
          {status.msg}
        </div>
      )}
    </form>
  );
}
