// components/Calendar.js
"use client";

import { useMemo } from "react";

function ymd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function sameDay(a, b) {
  return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function Calendar({
  monthDate,
  bookedSet,
  startDate,
  endDate,
  onPick,
  onPrev,
  onNext,
}) {
  const meta = useMemo(() => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startWeekday = (first.getDay() + 6) % 7; // Mon=0
    const daysInMonth = last.getDate();
    const label = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(monthDate);

    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);

    return { label, cells };
  }, [monthDate]);

  const today = useMemo(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  }, []);

  function inRange(day) {
    if (!startDate || !endDate || !day) return false;
    return day >= startDate && day <= endDate;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onPrev}
          className="rounded-full border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5"
        >
          Prev
        </button>
        <div className="text-sm font-semibold">{meta.label}</div>
        <button
          onClick={onNext}
          className="rounded-full border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5"
        >
          Next
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-zinc-300">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {meta.cells.map((day, idx) => {
          if (!day) return <div key={idx} className="h-10" />;

          const key = ymd(day);
          const isPast = day < today;
          const isBooked = bookedSet.has(key);

          const isStart = sameDay(day, startDate);
          const isEnd = sameDay(day, endDate);
          const isIn = inRange(day);

          const disabled = isPast || isBooked;

          return (
            <button
              key={key}
              disabled={disabled}
              onClick={() => onPick(day)}
              className={[
                "h-10 rounded-xl text-sm transition",
                disabled ? "cursor-not-allowed opacity-40" : "hover:bg-white/10",
                isIn ? "bg-white/10" : "bg-transparent",
                isStart || isEnd ? "bg-white text-zinc-950 font-semibold" : "text-zinc-100",
                isBooked ? "line-through" : "",
              ].join(" ")}
              title={isBooked ? "Unavailable" : ""}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-300">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-white" /> Selected
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-white/20" /> Range
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-white/40" /> Unavailable
        </span>
      </div>
    </div>
  );
}
