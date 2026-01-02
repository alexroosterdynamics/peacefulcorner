// components/BookingWidget.js
"use client";

import { useEffect, useMemo, useState } from "react";
import Calendar from "./Calendar";

function ymd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function BookingWidget() {
  const [booked, setBooked] = useState([]);
  const bookedSet = useMemo(() => new Set(booked), [booked]);

  const [monthDate, setMonthDate] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [guests, setGuests] = useState(2);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [status, setStatus] = useState({ type: "idle", msg: "" });

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/availability", { cache: "no-store" });
      const data = await res.json();
      setBooked(data.booked || []);
    })().catch(() => {});
  }, []);

  function onPick(day) {
    const d = new Date(day.getFullYear(), day.getMonth(), day.getDate());

    if (!startDate || (startDate && endDate)) {
      setStartDate(d);
      setEndDate(null);
      setStatus({ type: "idle", msg: "" });
      return;
    }

    if (d < startDate) {
      setStartDate(d);
      setStatus({ type: "idle", msg: "" });
      return;
    }

    // end date picked (checkout) - must be after start
    setEndDate(d);
    setStatus({ type: "idle", msg: "" });
  }

  const selection = useMemo(() => {
    if (!startDate) return null;
    const start = ymd(startDate);
    const end = endDate ? ymd(endDate) : null;
    return { start, end };
  }, [startDate, endDate]);

  const pretty = (d) =>
    new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "2-digit" }).format(d);

  async function submitBooking(e) {
    e.preventDefault();
    if (!startDate || !endDate) {
      setStatus({ type: "error", msg: "Pick check-in and check-out dates." });
      return;
    }
    setStatus({ type: "loading", msg: "Sending booking request..." });

    const payload = {
      start: ymd(startDate),
      end: ymd(endDate),
      guests,
      name: name.trim(),
      email: email.trim(),
    };

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      setStatus({ type: "error", msg: data.error || "Something went wrong." });
      return;
    }

    // refresh availability
    const a = await fetch("/api/availability", { cache: "no-store" }).then((r) => r.json());
    setBooked(a.booked || []);

    setStatus({
      type: "success",
      msg: `Request received! Booking ID: ${data.bookingId}`,
    });
  }

  return (
    <section id="availability" className="mx-auto max-w-6xl px-4 py-14">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Availability & Booking</h2>
        <p className="mt-1 text-sm text-zinc-300">
          Pick your dates (unavailable days are crossed out).
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Calendar
          monthDate={monthDate}
          bookedSet={bookedSet}
          startDate={startDate}
          endDate={endDate}
          onPick={onPick}
          onPrev={() => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          onNext={() => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
        />

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-lg font-semibold">Request to book</h3>

          <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-200">
            <div className="flex items-center justify-between">
              <span className="text-zinc-300">Check-in</span>
              <span className="font-semibold">{startDate ? pretty(startDate) : "—"}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-zinc-300">Check-out</span>
              <span className="font-semibold">{endDate ? pretty(endDate) : "—"}</span>
            </div>
          </div>

          <form onSubmit={submitBooking} className="mt-4 space-y-3">
            <div>
              <label className="text-xs text-zinc-300">Guests</label>
              <input
                type="number"
                min="1"
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-white/25"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-zinc-300">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-white/25"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-300">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-white/25"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 disabled:opacity-50"
              disabled={status.type === "loading"}
            >
              {status.type === "loading" ? "Sending..." : "Send booking request"}
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

            {selection?.start && selection?.end && (
              <p className="text-xs text-zinc-400">
                Selected: <span className="text-zinc-200">{selection.start}</span> →{" "}
                <span className="text-zinc-200">{selection.end}</span>
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
