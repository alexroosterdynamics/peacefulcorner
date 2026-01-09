"use client";

import React, { useEffect, useMemo, useState } from "react";

function ymd(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString().slice(0, 10);
}

function addMonths(date, delta) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + delta);
  return d;
}

function startOfMonth(date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfMonth(date) {
  const d = startOfMonth(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  return d;
}

function monthLabel(date) {
  return date.toLocaleString(undefined, { month: "long", year: "numeric" });
}

function daysGrid(monthDate) {
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);

  const startDow = (start.getDay() + 6) % 7;
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - startDow);

  const out = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    out.push(d);
  }
  return { start, end, cells: out };
}

export default function CalendarManager() {
  const [month, setMonth] = useState(() => new Date());
  const [settings, setSettings] = useState({ basePrice: 45, currency: "EUR" });
  const [daysMap, setDaysMap] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const [selectedDates, setSelectedDates] = useState(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bookingModal, setBookingModal] = useState(null);

  const grid = useMemo(() => daysGrid(month), [month]);

  async function load() {
    setLoading(true);
    const from = ymd(grid.cells[0]);
    const to = ymd(grid.cells[41]);
    const res = await fetch(`/api/calendar?from=${from}&to=${to}`);
    const data = await res.json();
    if (data.ok) {
      setSettings(data.settings || settings);
      const m = new Map();
      for (const d of data.days || []) m.set(d.date, d);
      setDaysMap(m);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  function handleMouseDown(dateStr, isBooked, e) {
    if (isBooked) return; // Don't allow drag selection on booked dates
    e.preventDefault();
    setIsDragging(true);
    const newSelected = new Set();
    newSelected.add(dateStr);
    setSelectedDates(newSelected);
  }

  function handleMouseEnter(dateStr, isBooked) {
    if (isDragging && !isBooked) {
      setSelectedDates((prev) => {
        const newSet = new Set(prev);
        newSet.add(dateStr);
        return newSet;
      });
    }
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mouseup", handleMouseUp);
      return () => document.removeEventListener("mouseup", handleMouseUp);
    }
  }, [isDragging]);

  function handleClick(dateStr, day, e) {
    if (day?.booked) {
      e.stopPropagation();
      setBookingModal({
        date: dateStr,
        booking: day.booked,
      });
    }
  }

  async function bulkBlock() {
    if (selectedDates.size === 0 || bulkSaving) return;
    setBulkSaving(true);
    
    const dates = Array.from(selectedDates);
    const res = await fetch("/api/admin/day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bulk: true,
        dates,
        isAvailable: false,
      }),
    });
    
    const data = await res.json();
    if (data.ok) {
      setSelectedDates(new Set());
      await load();
    }
    setBulkSaving(false);
  }

  async function bulkUnblock() {
    if (selectedDates.size === 0 || bulkSaving) return;
    setBulkSaving(true);
    
    const dates = Array.from(selectedDates);
    const res = await fetch("/api/admin/day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bulk: true,
        dates,
        isAvailable: true,
      }),
    });
    
    const data = await res.json();
    if (data.ok) {
      setSelectedDates(new Set());
      await load();
    }
    setBulkSaving(false);
  }

  async function bulkSetPrice() {
    if (selectedDates.size === 0 || !bulkPrice || bulkSaving) return;
    const price = parseFloat(bulkPrice);
    if (isNaN(price)) return;
    
    setBulkSaving(true);
    
    const dates = Array.from(selectedDates);
    const res = await fetch("/api/admin/day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bulk: true,
        dates,
        price,
      }),
    });
    
    const data = await res.json();
    if (data.ok) {
      setSelectedDates(new Set());
      setBulkPrice("");
      await load();
    }
    setBulkSaving(false);
  }

  const hasSelection = selectedDates.size > 0;

  return (
    <div className="flex gap-6">
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-lg sm:text-xl font-bold text-zinc-900">{monthLabel(month)}</div>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50"
              onClick={() => setMonth((m) => addMonths(m, -1))}
            >
              Prev
            </button>
            <button
              className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50"
              onClick={() => setMonth((m) => addMonths(m, 1))}
            >
              Next
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 text-xs sm:text-sm text-gray-600 mb-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="px-2 py-2 font-semibold">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2" onMouseLeave={() => setIsDragging(false)}>
          {grid.cells.map((d) => {
            const inMonth = d.getMonth() === month.getMonth();
            const dateStr = ymd(d);
            const day = daysMap.get(dateStr);
            const isBooked = Boolean(day?.booked);
            const isAvailable = day?.isAvailable ?? true;
            const price = typeof day?.price === "number" ? day.price : settings.basePrice;
            const isSelected = selectedDates.has(dateStr);

            return (
              <div
                key={dateStr}
                onMouseDown={(e) => handleMouseDown(dateStr, isBooked, e)}
                onMouseEnter={() => handleMouseEnter(dateStr, isBooked)}
                onClick={(e) => handleClick(dateStr, day, e)}
                className={[
                  "rounded-2xl border-2 p-2 sm:p-3 transition-all select-none",
                  isBooked
                    ? "border-green-700 bg-green-700 text-white cursor-pointer hover:bg-green-600"
                    : isSelected
                    ? "border-rose-400 bg-rose-100 cursor-pointer"
                    : isAvailable
                    ? "border-gray-200 bg-white hover:bg-gray-50 cursor-pointer"
                    : "border-zinc-900 bg-zinc-900 text-white cursor-pointer",
                  inMonth ? "" : "opacity-40",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={[
                      "text-sm sm:text-base font-semibold",
                      isBooked || !isAvailable ? "text-white" : "text-zinc-900",
                    ].join(" ")}
                  >
                    {d.getDate()}
                  </div>
                </div>
                <div
                  className={[
                    "text-xs sm:text-sm mt-1",
                    isBooked ? "text-green-100" : isAvailable ? "text-gray-600" : "text-gray-300",
                  ].join(" ")}
                >
                  {isBooked ? "Booked" : `€${price}`}
                </div>
              </div>
            );
          })}
        </div>

        {loading || bulkSaving ? (
          <div className="text-sm text-gray-500 mt-4">
            {bulkSaving ? "Saving..." : "Loading…"}
          </div>
        ) : null}
      </div>

      <div className="w-64 space-y-3">
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-4">
          <div className="text-sm font-semibold text-zinc-900 mb-3">
            {hasSelection ? `${selectedDates.size} selected` : "No selection"}
          </div>

          <div className="space-y-2">
            <button
              onClick={bulkBlock}
              disabled={!hasSelection || bulkSaving}
              className="w-full px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold transition-all"
            >
              Block
            </button>
            <button
              onClick={bulkUnblock}
              disabled={!hasSelection || bulkSaving}
              className="w-full px-4 py-2 rounded-xl bg-white border-2 border-gray-200 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed font-semibold transition-all"
            >
              Unblock
            </button>

            <div className="pt-2 border-t border-gray-200">
              <label className="block text-xs font-medium text-gray-700 mb-2">Price (€)</label>
              <input
                type="text"
                placeholder="45"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                disabled={!hasSelection || bulkSaving}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-rose-200 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                inputMode="numeric"
              />
              <button
                onClick={bulkSetPrice}
                disabled={!hasSelection || !bulkPrice || bulkSaving}
                className="w-full mt-2 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold transition-all"
              >
                Set Price
              </button>
            </div>
          </div>
        </div>
      </div>

      {bookingModal ? (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4"
          onClick={() => setBookingModal(null)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-xl font-bold text-zinc-900">Booking Details</div>
              <button
                onClick={() => setBookingModal(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <div className="text-sm font-medium text-gray-600">Date</div>
                <div className="text-lg font-semibold text-zinc-900">{bookingModal.date}</div>
              </div>

              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-sm font-medium text-gray-600 mb-1">Guest Name</div>
                <div className="text-base font-semibold text-zinc-900">
                  {bookingModal.booking?.name || "N/A"}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-sm font-medium text-gray-600 mb-1">Phone Number</div>
                <div className="text-base font-semibold text-zinc-900">
                  {bookingModal.booking?.phone || "N/A"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-sm font-medium text-gray-600 mb-1">Guests</div>
                  <div className="text-base font-semibold text-zinc-900">
                    {bookingModal.booking?.people || 0}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-sm font-medium text-gray-600 mb-1">Pets</div>
                  <div className="text-base font-semibold text-zinc-900">
                    {bookingModal.booking?.pets || 0}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setBookingModal(null)}
              className="w-full mt-6 px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold transition-all"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}