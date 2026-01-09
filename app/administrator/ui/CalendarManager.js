"use client";

import React, { useEffect, useMemo, useState } from "react";

function ymd(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    .toISOString()
    .slice(0, 10);
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

function formatRON(n) {
  const v = Number(n || 0);
  return new Intl.NumberFormat("ro-RO").format(v);
}

function truncateName(name) {
  if (!name) return "";
  return name.length > 13 ? name.slice(0, 13) + "…" : name;
}

export default function CalendarManager() {
  const [confirmModal, setConfirmModal] = useState(null);
  const [month, setMonth] = useState(() => new Date());

  const [settings, setSettings] = useState({ basePrice: 220, currency: "RON" });
  const [daysMap, setDaysMap] = useState(new Map());
  const [bookingsMap, setBookingsMap] = useState(new Map());
  const [blockedSet, setBlockedSet] = useState(new Set());

  const [loading, setLoading] = useState(false);

  const [selectedDates, setSelectedDates] = useState(new Set());
  const [isDragging, setIsDragging] = useState(false);

  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);

  const [dayModal, setDayModal] = useState(null);

  const [createBookingModal, setCreateBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({ name: "", phone: "", people: 1, pets: 0 });

  const grid = useMemo(() => daysGrid(month), [month]);

  async function load() {
    setLoading(true);
    const from = ymd(grid.cells[0]);
    const to = ymd(grid.cells[41]);

    const res = await fetch(`/api/calendar?from=${from}&to=${to}`, { cache: "no-store" });
    const data = await res.json();

    if (data.ok) {
      setSettings(data.settings || { basePrice: 220, currency: "RON" });

      const m = new Map();
      for (const d of data.days || []) m.set(d.date, d);
      setDaysMap(m);

      setBlockedSet(new Set((data.blockedDates || []).map(String)));

      const bm = new Map();
      for (const b of data.bookings || []) bm.set(String(b.id), b);
      setBookingsMap(bm);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  function isLockedDay(dateStr) {
    const day = daysMap.get(dateStr);
    if (!day) return false;
    const hasApproved = Boolean(day.booked?.id);
    const hasPending = (day.pendingCount || 0) > 0;
    return hasApproved || hasPending;
  }

  function handleMouseDown(dateStr, e) {
    if (isLockedDay(dateStr)) return;
    e.preventDefault();
    setIsDragging(true);
    const newSelected = new Set();
    newSelected.add(dateStr);
    setSelectedDates(newSelected);
  }

  function handleMouseEnter(dateStr) {
    if (!isDragging) return;
    if (isLockedDay(dateStr)) return;
    setSelectedDates((prev) => {
      const newSet = new Set(prev);
      newSet.add(dateStr);
      return newSet;
    });
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

  function openDayModal(dateStr) {
    const day = daysMap.get(dateStr);
    if (!day) return;

    const booked = day.booked?.id ? bookingsMap.get(day.booked.id) || day.booked : null;

    const pending = (day.pendingIds || [])
      .map((id) => bookingsMap.get(id))
      .filter(Boolean);

    if (!booked && (!pending || pending.length === 0)) return;

    setDayModal({ date: dateStr, booked, pending });
  }

  async function bulkBlock() {
    if (selectedDates.size === 0 || bulkSaving) return;
    setBulkSaving(true);

    const dates = Array.from(selectedDates);

    const res = await fetch("/api/admin/day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bulk: true, dates, isAvailable: false }),
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
      body: JSON.stringify({ bulk: true, dates, isAvailable: true }),
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
    if (Number.isNaN(price)) return;

    setBulkSaving(true);
    const dates = Array.from(selectedDates);

    const res = await fetch("/api/admin/day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bulk: true, dates, price }),
    });
    const data = await res.json();
    if (data.ok) {
      setSelectedDates(new Set());
      setBulkPrice("");
      await load();
    }
    setBulkSaving(false);
  }

  async function approveBooking(id) {
    setBulkSaving(true);
    const res = await fetch("/api/admin/day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approveBookingId: id }),
    });
    const data = await res.json();
    setBulkSaving(false);
    if (!data.ok) {
      alert(data.error || "Approve failed");
      return;
    }
    setDayModal(null);
    await load();
  }

  async function deleteBooking(id) {
    setConfirmModal({
      title: "Delete booking?",
      message: "This will permanently delete this booking request/booking. This cannot be undone.",
      confirmText: "Delete",
      danger: true,
      onConfirm: async () => {
        setBulkSaving(true);
        try {
          const res = await fetch("/api/admin/day", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deleteBookingId: id }),
          });

          const data = await res.json().catch(() => ({}));

          if (!res.ok || !data.ok) {
            // Optional: show a nicer inline error UI; for now keep a minimal fallback
            console.error("Delete failed", data);
            return;
          }

          setDayModal(null);
          await load();
        } finally {
          setBulkSaving(false);
        }
      },
    });
  }

  async function handleSaveManualBooking(e) {
    e.preventDefault();
    if (selectedDates.size === 0 || bulkSaving) return;

    setBulkSaving(true);

    const dates = Array.from(selectedDates);

    const res = await fetch("/api/admin/day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        createBooking: true,
        dates,
        booking: {
          name: bookingForm.name,
          phone: bookingForm.phone,
          people: bookingForm.people,
          pets: bookingForm.pets,
        },
      }),
    });

    const data = await res.json();
    setBulkSaving(false);

    if (!data.ok) {
      alert(data.error || "Failed to create booking");
      return;
    }

    setSelectedDates(new Set());
    setCreateBookingModal(false);
    setBookingForm({ name: "", phone: "", people: 1, pets: 0 });
    await load();
  }

  const hasSelection = selectedDates.size > 0;

  return (
    <div className="bg-white">
      {/* Mobile Controls */}
      <div className="lg:hidden border-b border-gray-200 p-4 space-y-3">
        <div className="bg-gray-50 rounded-2xl p-4">
          <div className="text-sm font-semibold text-zinc-900 mb-3">
            {hasSelection ? `${selectedDates.size} selected` : "Select dates to manage"}
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setCreateBookingModal(true)}
              disabled={!hasSelection || bulkSaving}
              className="w-full px-4 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold transition-all text-sm"
            >
              Create Booking
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={bulkBlock}
                disabled={!hasSelection || bulkSaving}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold transition-all text-sm"
              >
                Block
              </button>

              <button
                onClick={bulkUnblock}
                disabled={!hasSelection || bulkSaving}
                className="px-4 py-2.5 rounded-xl bg-white border-2 border-gray-200 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed font-semibold transition-all text-sm"
              >
                Unblock
              </button>
            </div>

            <div className="pt-2 border-t border-gray-200">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Price ({settings.currency === "RON" ? "RON" : settings.currency})
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={String(settings.basePrice || 220)}
                  value={bulkPrice}
                  onChange={(e) => setBulkPrice(e.target.value)}
                  disabled={!hasSelection || bulkSaving}
                  className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-rose-200 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                  inputMode="numeric"
                />
                <button
                  onClick={bulkSetPrice}
                  disabled={!hasSelection || !bulkPrice || bulkSaving}
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold transition-all text-sm"
                >
                  Set
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 p-4 lg:p-8 space-y-4 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <div className="text-xl sm:text-2xl font-bold text-zinc-900">{monthLabel(month)}</div>
            <div className="flex gap-2">
              <button
                className="px-3 sm:px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-sm sm:text-base font-medium"
                onClick={() => setMonth((m) => addMonths(m, -1))}
              >
                Prev
              </button>
              <button
                className="px-3 sm:px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-sm sm:text-base font-medium"
                onClick={() => setMonth((m) => addMonths(m, 1))}
              >
                Next
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-xs sm:text-sm text-gray-600 mb-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="px-1 sm:px-2 py-2 font-semibold text-center">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2" onMouseLeave={() => setIsDragging(false)}>
            {grid.cells.map((d) => {
              const inMonth = d.getMonth() === month.getMonth();
              const dateStr = ymd(d);
              const day = daysMap.get(dateStr);

              const price = typeof day?.price === "number" ? day.price : settings.basePrice;

              const isSelected = selectedDates.has(dateStr);
              const isBlocked = blockedSet.has(dateStr);

              const approvedId = day?.booked?.id;
              const pendingCount = day?.pendingCount || 0;

              const hasApproved = Boolean(approvedId);
              const hasPending = pendingCount > 0;

              const locked = hasApproved || hasPending;

              const className = [
                "rounded-xl sm:rounded-2xl border-2 p-2 sm:p-3 transition-all select-none cursor-pointer",
                inMonth ? "" : "opacity-40",
                hasApproved
                  ? "border-green-700 bg-green-700 text-white hover:bg-green-600"
                  : hasPending
                    ? "border-yellow-400 bg-yellow-300 text-zinc-900 hover:bg-yellow-200"
                    : isSelected
                      ? "border-rose-400 bg-rose-100"
                      : isBlocked
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-gray-200 bg-white hover:bg-gray-50",
              ].join(" ");

              const label = hasApproved
                ? truncateName(day?.booked?.name || "Booked")
                : hasPending
                  ? pendingCount > 1
                    ? `Pending (${pendingCount})`
                    : "Pending"
                  : `${formatRON(price)} ${settings.currency === "RON" ? "lei" : settings.currency}`;

              return (
                <div
                  key={dateStr}
                  onMouseDown={(e) => handleMouseDown(dateStr, e)}
                  onMouseEnter={() => handleMouseEnter(dateStr)}
                  onClick={() => {
                    if (locked) openDayModal(dateStr);
                  }}
                  className={className}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={[
                        "text-sm sm:text-base font-semibold",
                        hasApproved || isBlocked ? "text-white" : "text-zinc-900",
                      ].join(" ")}
                    >
                      {d.getDate()}
                    </div>
                  </div>

                  <div
                    className={[
                      "text-[10px] sm:text-xs mt-1 truncate leading-tight",
                      hasApproved
                        ? "text-green-100 font-medium"
                        : hasPending
                          ? "text-zinc-800 font-semibold"
                          : isBlocked
                            ? "text-gray-300"
                            : "text-gray-600",
                    ].join(" ")}
                  >
                    {label}
                  </div>
                </div>
              );
            })}
          </div>

          {loading || bulkSaving ? (
            <div className="text-sm text-gray-500 mt-4">{bulkSaving ? "Saving..." : "Loading…"}</div>
          ) : null}
        </div>

        <div className="hidden lg:block w-80 border-l border-gray-200 p-6 space-y-4">
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="text-sm font-semibold text-zinc-900 mb-3">
              {hasSelection ? `${selectedDates.size} selected` : "No selection"}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setCreateBookingModal(true)}
                disabled={!hasSelection || bulkSaving}
                className="w-full px-4 py-2 rounded-xl bg-green-700 hover:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold transition-all mb-4"
              >
                Create Booking (Approved)
              </button>

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
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Price ({settings.currency === "RON" ? "RON" : settings.currency})
                </label>
                <input
                  type="text"
                  placeholder={String(settings.basePrice || 220)}
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

                <div className="text-xs text-gray-500 mt-2">
                  Tip: setting a day back to base price removes it from overrides automatically.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Day details with pending approvals */}
      {confirmModal ? (
        <div
          className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center px-4"
          onClick={() => setConfirmModal(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xl font-bold text-zinc-900">{confirmModal.title}</div>
                <div className="text-sm text-gray-600 mt-2">{confirmModal.message}</div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold transition-all"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={bulkSaving}
                onClick={async () => {
                  const fn = confirmModal.onConfirm;
                  setConfirmModal(null);
                  await fn?.();
                }}
                className={[
                  "flex-1 px-4 py-3 rounded-xl font-semibold transition-all text-white disabled:opacity-60",
                  confirmModal.danger ? "bg-rose-500 hover:bg-rose-600" : "bg-zinc-900 hover:bg-black",
                ].join(" ")}
              >
                {bulkSaving ? "Working..." : confirmModal.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {dayModal ? (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4"
          onClick={() => setDayModal(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-xl font-bold text-zinc-900">Day: {dayModal.date}</div>
              <button
                onClick={() => setDayModal(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {dayModal.booked ? (
              <div className="mb-6">
                <div className="text-sm font-semibold text-green-800 mb-2">Approved booking</div>
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-2">
                  <div className="font-semibold text-zinc-900">{dayModal.booked.name}</div>
                  <div className="text-sm text-gray-700">{dayModal.booked.phone || "—"}</div>
                  <div className="text-sm text-gray-700">
                    {dayModal.booked.checkIn} → {dayModal.booked.checkOut}
                  </div>

                  {dayModal.booked.details ? (
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      <span className="font-semibold">Details:</span> {dayModal.booked.details}
                    </div>
                  ) : null}

                  <div className="text-sm text-gray-700">
                    Total:{" "}
                    <span className="font-semibold">
                      {formatRON(dayModal.booked.pricing?.total || 0)}{" "}
                      {(dayModal.booked.pricing?.currency || settings.currency) === "RON"
                        ? "lei"
                        : dayModal.booked.pricing?.currency}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => deleteBooking(dayModal.booked.id)}
                  className="w-full mt-3 px-4 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold transition-all"
                >
                  Delete Booking
                </button>
              </div>
            ) : null}

            {dayModal.pending && dayModal.pending.length ? (
              <div>
                <div className="text-sm font-semibold text-yellow-700 mb-2">
                  Pending requests ({dayModal.pending.length})
                </div>

                <div className="space-y-3">
                  {dayModal.pending.map((b) => (
                    <div key={b.id} className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-zinc-900 truncate">{b.name}</div>
                          <div className="text-sm text-gray-700">{b.phone || "—"}</div>
                          <div className="text-sm text-gray-700">
                            {b.checkIn} → {b.checkOut}
                          </div>

                          {b.details ? (
                            <div className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                              <span className="font-semibold">Details:</span> {b.details}
                            </div>
                          ) : null}

                          <div className="text-sm text-gray-700 mt-1">
                            Total:{" "}
                            <span className="font-semibold">
                              {formatRON(b.pricing?.total || 0)}{" "}
                              {(b.pricing?.currency || settings.currency) === "RON"
                                ? "lei"
                                : b.pricing?.currency}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 shrink-0">
                          <button
                            onClick={() => approveBooking(b.id)}
                            className="px-4 py-2 rounded-xl bg-green-700 hover:bg-green-800 text-white font-semibold transition-all"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => deleteBooking(b.id)}
                            className="px-4 py-2 rounded-xl bg-white border-2 border-gray-200 hover:bg-gray-50 font-semibold transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 mt-3">
                        Approving one request will delete all other overlapping pending requests automatically.
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {!dayModal.booked && (!dayModal.pending || dayModal.pending.length === 0) ? (
              <div className="text-sm text-gray-600">No booking data for this day.</div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* MODAL: CREATE MANUAL BOOKING */}
      {createBookingModal ? (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4"
          onClick={() => setCreateBookingModal(false)}
        >
          <form
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSaveManualBooking}
          >
            <div className="flex items-center justify-between">
              <div className="text-xl font-bold text-zinc-900">Create Manual Booking</div>
              <button
                type="button"
                onClick={() => setCreateBookingModal(false)}
                className="text-gray-400 text-2xl"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-gray-500">
              Creating approved booking for <strong>{selectedDates.size}</strong> selected nights.
              <br />
              (Selection must be a continuous range.)
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Guest Name</label>
                <input
                  required
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-2 focus:border-green-600 outline-none"
                  value={bookingForm.name}
                  onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone Number</label>
                <input
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-2 focus:border-green-600 outline-none"
                  value={bookingForm.phone}
                  onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Number of People</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full border-2 border-gray-100 rounded-xl px-4 py-2 focus:border-green-600 outline-none"
                    value={bookingForm.people}
                    onChange={(e) => setBookingForm({ ...bookingForm, people: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Pets</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border-2 border-gray-100 rounded-xl px-4 py-2 focus:border-green-600 outline-none"
                    value={bookingForm.pets}
                    onChange={(e) => setBookingForm({ ...bookingForm, pets: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCreateBookingModal(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-100 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 rounded-xl bg-green-700 text-white font-semibold hover:bg-green-800 transition-all"
              >
                Confirm Booking
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}



