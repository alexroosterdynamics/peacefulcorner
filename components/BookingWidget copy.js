"use client";

import React, { useEffect, useMemo, useState } from "react";

/** Date helpers */
function ymd(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    .toISOString()
    .slice(0, 10);
}
function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return ymd(d);
}
function nightsBetween(a, b) {
  const d1 = new Date(a + "T00:00:00Z");
  const d2 = new Date(b + "T00:00:00Z");
  return Math.round((d2 - d1) / 86400000);
}
function eachNight(a, b) {
  const n = nightsBetween(a, b);
  return Array.from({ length: Math.max(0, n) }, (_, i) => addDays(a, i));
}
function formatDatePretty(dateStr, lang) {
  if (!dateStr) return "";
  const locale = lang === "it" ? "it-IT" : lang === "en" ? "en-GB" : "ro-RO";
  try {
    const d = new Date(dateStr + "T00:00:00Z");
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

/** Calendar helpers */
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
function addMonths(date, delta) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + delta);
  return d;
}
function gridCells(monthDate) {
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);
  const startDow = (start.getDay() + 6) % 7; // Monday-first
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - startDow);

  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push(d);
  }
  return { start, end, cells };
}
function monthLabel(date, lang) {
  const locale = lang === "it" ? "it-IT" : lang === "en" ? "en-GB" : "ro-RO";
  return date.toLocaleString(locale, { month: "long", year: "numeric" });
}
function formatRON(value) {
  const n = Number(value || 0);
  return new Intl.NumberFormat("ro-RO").format(n);
}

/** Media query (mobile detection) */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const handle = () => setIsMobile(mq.matches);
    handle();
    mq.addEventListener?.("change", handle);
    return () => mq.removeEventListener?.("change", handle);
  }, []);
  return isMobile;
}

/** Small UI parts */
function Counter({ label, value, setValue, min = 0, helper }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-200">
      <div>
        <div className="font-semibold text-zinc-900">{label}</div>
        {helper ? <div className="text-sm text-gray-600">{helper}</div> : null}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="w-10 h-10 rounded-xl border border-gray-200 hover:bg-gray-50 font-semibold"
          onClick={() => setValue((v) => Math.max(min, v - 1))}
        >
          -
        </button>
        <div className="w-8 text-center font-semibold text-zinc-900">{value}</div>
        <button
          type="button"
          className="w-10 h-10 rounded-xl border border-gray-200 hover:bg-gray-50 font-semibold"
          onClick={() => setValue((v) => v + 1)}
        >
          +
        </button>
      </div>
    </div>
  );
}

function FieldBox({ label, value, onClear }) {
  return (
    <div className="flex-1 rounded-2xl border border-gray-200 p-4">
      <div className="text-xs font-semibold text-gray-600">{label}</div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <div className="font-semibold text-zinc-900">{value || "—"}</div>
        {value ? (
          <button
            type="button"
            onClick={onClear}
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            Șterge
          </button>
        ) : null}
      </div>
    </div>
  );
}

function t(lang) {
  const ro = {
    checkIn: "CHECK-IN",
    checkOut: "CHECK-OUT",
    back: "Înapoi",
    next: "Înainte",
    adults: "Adulți",
    children: "Copii",
    pets: "Animale de companie",
    petsHelp: "Selectează dacă vii cu animal de companie.",
    petsCount: "Număr animale",
    name: "Numele tău",
    phone: "Număr de telefon",
    send: "Trimite cererea de rezervare",
    sending: "Se trimite…",
    notCharged: "Nu vei fi taxat(ă) încă.",
    selectDates: "Selectează datele de sosire și plecare.",
    fillContact: "Te rugăm să completezi numele și numărul de telefon.",
    rangeUnavailable: "Există nopți indisponibile în interval.",
    sentOk: "Cererea a fost trimisă! Te contactăm telefonic pentru confirmare.",
    nights: "nopți",
    total: "Total",
    invalidRange: "Interval invalid.",
    pickDates: "Alege datele",
    weekdays: ["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"],
    pickCheckInFirst: "Alege check-in întâi",
    selectCheckIn: "Selectează check-in",
    selectCheckOut: "Selectează check-out",
    close: "Închide",
  };

  const en = {
    checkIn: "CHECK-IN",
    checkOut: "CHECK-OUT",
    back: "Back",
    next: "Next",
    adults: "Adults",
    children: "Children",
    pets: "Pets",
    petsHelp: "Select if you are bringing a pet.",
    petsCount: "Number of pets",
    name: "Your name",
    phone: "Phone number",
    send: "Send booking request",
    sending: "Sending…",
    notCharged: "You will not be charged yet.",
    selectDates: "Select check-in and check-out dates.",
    fillContact: "Please enter your name and phone number.",
    rangeUnavailable: "Some nights in the selected range are unavailable.",
    sentOk: "Request sent! We will call you to confirm.",
    nights: "nights",
    total: "Total",
    invalidRange: "Invalid range.",
    pickDates: "Pick dates",
    weekdays: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
    pickCheckInFirst: "Pick check-in first",
    selectCheckIn: "Select check-in",
    selectCheckOut: "Select check-out",
    close: "Close",
  };

  const it = {
    checkIn: "CHECK-IN",
    checkOut: "CHECK-OUT",
    back: "Indietro",
    next: "Avanti",
    adults: "Adulti",
    children: "Bambini",
    pets: "Animali",
    petsHelp: "Seleziona se porti un animale.",
    petsCount: "Numero animali",
    name: "Il tuo nome",
    phone: "Telefono",
    send: "Invia richiesta",
    sending: "Invio…",
    notCharged: "Non verrà addebitato nulla ora.",
    selectDates: "Seleziona check-in e check-out.",
    fillContact: "Inserisci nome e telefono.",
    rangeUnavailable: "Alcune notti non sono disponibili.",
    sentOk: "Richiesta inviata! Ti chiameremo per conferma.",
    nights: "notti",
    total: "Totale",
    invalidRange: "Intervallo non valido.",
    pickDates: "Scegli date",
    weekdays: ["Lu", "Ma", "Me", "Gi", "Ve", "Sa", "Do"],
    pickCheckInFirst: "Scegli prima il check-in",
    selectCheckIn: "Seleziona check-in",
    selectCheckOut: "Seleziona check-out",
    close: "Chiudi",
  };

  if (lang === "it") return it;
  if (lang === "en") return en;
  return ro;
}

export default function BookingWidget({
  defaultNightly = 220,
  onAverageComputed,
  lang = "ro",
  layout = "split",
  mobileMode = "date-inputs",
  hideFees = true, // unused but kept for compatibility
}) {
  const L = useMemo(() => t(lang), [lang]);
  const isMobile = useIsMobile();

  // Desktop month calendar state
  const [month, setMonth] = useState(() => new Date());
  const grid = useMemo(() => gridCells(month), [month]);

  // ✅ Mobile calendar modal state
  const [mobileCalOpen, setMobileCalOpen] = useState(false);
  const [activeMobileField, setActiveMobileField] = useState(null); // "checkIn" | "checkOut" | null
  const [mobileMonth, setMobileMonth] = useState(() => new Date());
  const mobileGrid = useMemo(() => gridCells(mobileMonth), [mobileMonth]);

  // Pricing/settings from DB (we ignore cleaning/service fees in UI/total)
  const [settings, setSettings] = useState({ basePrice: defaultNightly, currency: "RON" });
  const [daysMap, setDaysMap] = useState(new Map());

  // Selection
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  // People + pets
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [hasPets, setHasPets] = useState(false);
  const [petsCount, setPetsCount] = useState(1);

  // Contact
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // UX
  const [status, setStatus] = useState({ type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const canOpenCheckout = Boolean(checkIn);

  function dayInfo(dateStr) {
    const d = daysMap.get(dateStr);
    return {
      isAvailable: d?.isAvailable ?? true,
      price: typeof d?.price === "number" ? d.price : settings.basePrice,
    };
  }

  async function loadCalendar(from, to) {
    const res = await fetch(`/api/calendar?from=${from}&to=${to}`, { cache: "no-store" });
    const data = await res.json();

    if (data.ok) {
      setSettings(data.settings || { basePrice: defaultNightly, currency: "RON" });
      const m = new Map();
      for (const d of data.days || []) m.set(d.date, d);
      setDaysMap(m);
      return { settings: data.settings, days: data.days || [] };
    }
    return null;
  }

  // Desktop month load
  useEffect(() => {
    if (isMobile && mobileMode === "date-inputs") return;
    const from = ymd(grid.cells[0]);
    const to = ymd(grid.cells[41]);
    loadCalendar(from, to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, isMobile, mobileMode]);

  // ✅ Mobile modal month load (only when modal open)
  useEffect(() => {
    if (!mobileCalOpen) return;
    const from = ymd(mobileGrid.cells[0]);
    const to = ymd(mobileGrid.cells[41]);
    loadCalendar(from, to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileCalOpen, mobileMonth]);

  // Average next 14 days (for hero)
  useEffect(() => {
    async function computeAvg() {
      const from = ymd(new Date());
      const to = addDays(from, 14);
      const data = await loadCalendar(from, to);
      if (!data) return;

      const map = new Map((data.days || []).map((d) => [d.date, d]));
      const dates = Array.from({ length: 14 }, (_, i) => addDays(from, i));
      const prices = dates.map((dt) => {
        const day = map.get(dt);
        return typeof day?.price === "number"
          ? day.price
          : data.settings?.basePrice ?? defaultNightly;
      });

      const avg = Math.round(prices.reduce((a, b) => a + b, 0) / Math.max(1, prices.length));
      onAverageComputed?.(avg);
    }
    computeAvg();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Nights & subtotal (NO fees)
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return [];
    return eachNight(checkIn, checkOut);
  }, [checkIn, checkOut]);

  const subtotal = useMemo(() => {
    let s = 0;
    for (const date of nights) s += dayInfo(date).price;
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nights, daysMap, settings]);

  const total = subtotal;

  function validateRange(ci, co) {
    if (!ci || !co) return { ok: true };
    if (co <= ci) return { ok: false, message: L.invalidRange };
    const trial = eachNight(ci, co);
    for (const n of trial) {
      if (!dayInfo(n).isAvailable) return { ok: false, message: L.rangeUnavailable };
    }
    return { ok: true };
  }

  function pickDateDesktop(dateStr) {
    if (!dayInfo(dateStr).isAvailable) return;

    setStatus({ type: "", message: "" });

    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(dateStr);
      setCheckOut("");
      return;
    }

    if (checkIn && !checkOut) {
      if (dateStr <= checkIn) {
        setCheckIn(dateStr);
        setCheckOut("");
        return;
      }
      const res = validateRange(checkIn, dateStr);
      if (!res.ok) return setStatus({ type: "error", message: res.message });
      setCheckOut(dateStr);
    }
  }

  // ✅ Mobile open/close (click anywhere on boxes)
  async function openMobileCalendar(field) {
    if (field === "checkOut" && !checkIn) return; // hard lock
    setStatus({ type: "", message: "" });
    setActiveMobileField(field);

    // show relevant month
    if (field === "checkOut" && checkIn) {
      const d = new Date(checkIn + "T00:00:00");
      setMobileMonth(d);
      // preload range for checkout validation (next ~120 days)
      await loadCalendar(checkIn, addDays(checkIn, 120));
    } else if (field === "checkIn" && checkIn) {
      const d = new Date(checkIn + "T00:00:00");
      setMobileMonth(d);
    } else {
      setMobileMonth(new Date());
    }

    setMobileCalOpen(true);
  }

  function closeMobileCalendar() {
    setMobileCalOpen(false);
    setActiveMobileField(null);
  }

  async function pickDateMobile(dateStr) {
    const info = dayInfo(dateStr);
    if (!info.isAvailable) return;

    // if selecting checkout, disallow <= checkin
    if (activeMobileField === "checkOut" && checkIn && dateStr <= checkIn) return;

    if (activeMobileField === "checkIn") {
      setCheckIn(dateStr);
      setCheckOut("");
      setStatus({ type: "", message: "" });

      // preload data for upcoming checkout selection
      await loadCalendar(dateStr, addDays(dateStr, 120));

      // close calendar (user then taps checkout box)
      closeMobileCalendar();
      return;
    }

    if (activeMobileField === "checkOut") {
      if (!checkIn) return;
      const res = validateRange(checkIn, dateStr);
      if (!res.ok) {
        setStatus({ type: "error", message: res.message });
        return;
      }
      setCheckOut(dateStr);
      setStatus({ type: "success", message: "" });
      closeMobileCalendar();
    }
  }

  function getMobileDayBtnClass(d, inMonth, unavailable) {
    const dateStr = ymd(d);
    const isCheckIn = checkIn && dateStr === checkIn;
    const isCheckOut = checkOut && dateStr === checkOut;

    const isBetween =
      checkIn && checkOut && dateStr > checkIn && dateStr < checkOut;

    // ✅ key requirement: when picking checkout, check-in must be CLEARLY highlighted
    const anchorHighlight =
      activeMobileField === "checkOut" && isCheckIn;

    const invalidCheckoutPick =
      activeMobileField === "checkOut" && checkIn && dateStr <= checkIn;

    const disabled = unavailable || invalidCheckoutPick;

    return [
      "w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold transition-all select-none",
      inMonth ? "" : "opacity-40",
      disabled ? "text-gray-300 cursor-not-allowed" : "text-gray-800 hover:bg-gray-100",
      isBetween ? "bg-rose-50" : "",
      isCheckOut ? "bg-rose-500 text-white" : "",
      // check-in default selected styling
      isCheckIn ? "bg-gray-900 text-white" : "",
      // ✅ extra strong anchor ring when selecting checkout
      anchorHighlight ? "ring-2 ring-gray-900 ring-offset-2" : "",
    ].join(" ");
  }

  async function submit() {
    setStatus({ type: "", message: "" });

    if (!checkIn || !checkOut) return setStatus({ type: "error", message: L.selectDates });
    const vr = validateRange(checkIn, checkOut);
    if (!vr.ok) return setStatus({ type: "error", message: vr.message });

    if (!name.trim() || !phone.trim()) return setStatus({ type: "error", message: L.fillContact });

    setSubmitting(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checkIn,
        checkOut,
        adults,
        children,
        pets: { hasPets, count: hasPets ? petsCount : 0 },
        name,
        phone,
      }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!data.ok) {
      setStatus({ type: "error", message: data.error || "Eroare." });
      return;
    }

    setStatus({ type: "success", message: L.sentOk });

    // Refresh availability for chosen window
    const from = checkIn;
    const to = addDays(checkOut, 1);
    loadCalendar(from, to);
  }

  const showDesktopCalendar = !(isMobile && mobileMode === "date-inputs");

  /** Controls (same) */
  const Controls = (
    <div className="space-y-4">
      <div className="space-y-3">
        <Counter label={L.adults} value={adults} setValue={setAdults} min={1} />
        <Counter label={L.children} value={children} setValue={setChildren} min={0} />
      </div>

      <div className="rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-zinc-900">{L.pets}</div>
            <div className="text-sm text-gray-600">{L.petsHelp}</div>
          </div>

          <button
            type="button"
            className={[
              "w-14 h-8 rounded-full transition-all relative",
              hasPets ? "bg-gray-900" : "bg-gray-300",
            ].join(" ")}
            onClick={() => setHasPets((v) => !v)}
            aria-label={L.pets}
          >
            <span
              className={[
                "absolute top-1 w-6 h-6 bg-white rounded-full transition-all",
                hasPets ? "left-7" : "left-1",
              ].join(" ")}
            />
          </button>
        </div>

        {hasPets ? (
          <div className="mt-4">
            <Counter label={L.petsCount} value={petsCount} setValue={setPetsCount} min={1} />
          </div>
        ) : null}
      </div>

      <div className="grid gap-3">
        <input
          className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-200"
          placeholder={L.name}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-200"
          placeholder={L.phone}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <button
        onClick={submit}
        disabled={submitting}
        className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-70 text-white py-4 rounded-2xl font-semibold text-lg transition-all"
      >
        {submitting ? L.sending : L.send}
      </button>

      <p className="text-center text-sm text-gray-600">{L.notCharged}</p>

      {status.message ? (
        <div className={status.type === "error" ? "text-sm text-rose-600" : "text-sm text-gray-700"}>
          {status.message}
        </div>
      ) : null}

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-700">
            {formatRON(settings.basePrice)} lei × {nights.length} {L.nights}
          </span>
          <span className="font-semibold text-gray-700">{formatRON(subtotal)} lei</span>
        </div>

        <div className="border-t pt-3 flex justify-between font-bold text-base">
          <span>{L.total}</span>
          <span>{formatRON(total)} lei</span>
        </div>
      </div>
    </div>
  );

  /** ✅ Mobile date boxes (click anywhere opens; checkout disabled until checkin) */
  const MobileDateBoxes = (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => openMobileCalendar("checkIn")}
        className="w-full text-left rounded-2xl border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50 transition-all"
      >
        <div className="text-[11px] uppercase tracking-wide text-gray-500">{L.checkIn}</div>
        <div className="mt-1 font-semibold text-gray-900">
          {checkIn ? formatDatePretty(checkIn, lang) : "—"}
        </div>
      </button>

      <button
        type="button"
        onClick={() => openMobileCalendar("checkOut")}
        disabled={!canOpenCheckout}
        className={[
          "w-full text-left rounded-2xl border px-4 py-3 transition-all",
          canOpenCheckout
            ? "border-gray-200 bg-white hover:bg-gray-50"
            : "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed",
        ].join(" ")}
      >
        <div className="text-[11px] uppercase tracking-wide text-gray-500">{L.checkOut}</div>
        <div className="mt-1 font-semibold">
          {checkOut ? formatDatePretty(checkOut, lang) : canOpenCheckout ? "—" : L.pickCheckInFirst}
        </div>
      </button>
    </div>
  );

  /** ✅ Mobile calendar modal (check-in anchor highlighted while choosing checkout) */
  const MobileCalendarModal = mobileCalOpen ? (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={closeMobileCalendar}
        aria-label="Close calendar"
      />
      <div className="absolute left-0 right-0 bottom-0 bg-white rounded-t-3xl shadow-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold text-gray-900">
            {activeMobileField === "checkIn" ? L.selectCheckIn : L.selectCheckOut}
          </div>
          <button
            type="button"
            onClick={closeMobileCalendar}
            className="px-3 py-1.5 rounded-full text-sm font-semibold bg-gray-100 hover:bg-gray-200"
          >
            {L.close}
          </button>
        </div>

        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 font-semibold"
            onClick={() => setMobileMonth((m) => addMonths(m, -1))}
          >
            {L.back}
          </button>
          <div className="font-bold text-zinc-900 capitalize">{monthLabel(mobileMonth, lang)}</div>
          <button
            type="button"
            className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 font-semibold"
            onClick={() => setMobileMonth((m) => addMonths(m, 1))}
          >
            {L.next}
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-xs text-gray-600 mb-2">
          {L.weekdays.map((d) => (
            <div key={d} className="text-center py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 pb-2">
          {mobileGrid.cells.map((d) => {
            const inMonth = d.getMonth() === mobileMonth.getMonth();
            const dateStr = ymd(d);
            const info = dayInfo(dateStr);
            const unavailable = !info.isAvailable;

            const invalidCheckoutPick =
              activeMobileField === "checkOut" && checkIn && dateStr <= checkIn;

            const disabled = unavailable || invalidCheckoutPick;

            return (
              <button
                key={dateStr}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && pickDateMobile(dateStr)}
                className={getMobileDayBtnClass(d, inMonth, unavailable)}
                aria-label={dateStr}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>

        {/* small helper line showing selection */}
        <div className="mt-2 text-sm text-gray-600 flex items-center justify-between">
          <span className="font-semibold text-gray-900">
            {checkIn ? formatDatePretty(checkIn, lang) : "—"}
          </span>
          <span>→</span>
          <span className="font-semibold text-gray-900">
            {checkOut ? formatDatePretty(checkOut, lang) : "—"}
          </span>
        </div>
      </div>
    </div>
  ) : null;

  /** Desktop date display boxes */
  const DesktopDateBoxes = (
    <div className="flex flex-col sm:flex-row gap-3">
      <FieldBox
        label={L.checkIn}
        value={checkIn}
        onClear={() => {
          setCheckIn("");
          setCheckOut("");
          setStatus({ type: "", message: "" });
        }}
      />
      <FieldBox
        label={L.checkOut}
        value={checkOut}
        onClear={() => {
          setCheckOut("");
          setStatus({ type: "", message: "" });
        }}
      />
    </div>
  );

  /** Desktop calendar */
  const Calendar = (
    <div className="rounded-3xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        <div className="font-bold text-zinc-900 capitalize">{monthLabel(month, lang)}</div>
        <div className="flex gap-2">
          <button
            type="button"
            className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50"
            onClick={() => setMonth((m) => addMonths(m, -1))}
          >
            {L.back}
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50"
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            {L.next}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 px-4 sm:px-6 pb-2 text-xs text-gray-600">
        {L.weekdays.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 px-4 sm:px-6 pb-5">
        {grid.cells.map((d) => {
          const inMonth = d.getMonth() === month.getMonth();
          const dateStr = ymd(d);
          const info = dayInfo(dateStr);

          const selected =
            (checkIn && dateStr === checkIn) ||
            (checkOut && dateStr === checkOut) ||
            (checkIn && checkOut && dateStr > checkIn && dateStr < checkOut);

          const unavailable = !info.isAvailable;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => pickDateDesktop(dateStr)}
              disabled={unavailable}
              className={[
                "rounded-2xl border p-2 sm:p-3 text-left transition-all",
                inMonth ? "border-gray-200" : "border-gray-100 opacity-50",
                unavailable ? "bg-gray-50 opacity-40 cursor-not-allowed" : "hover:bg-gray-50",
                selected ? "ring-2 ring-rose-200 bg-rose-50" : "",
              ].join(" ")}
            >
              <div className="text-sm sm:text-base font-semibold text-zinc-900">{d.getDate()}</div>
              <div className="text-[11px] text-gray-600 mt-1">{formatRON(info.price)} lei</div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ✅ MOBILE date-inputs mode now uses our own modal calendar (not <input type="date">)
  if (isMobile && mobileMode === "date-inputs") {
    return (
      <div className="space-y-5">
        {MobileDateBoxes}
        {MobileCalendarModal}
        {Controls}
      </div>
    );
  }

  // Desktop & non-mobile: split
  if (layout === "split") {
    return (
      <div className="space-y-5">
        {DesktopDateBoxes}

        <div className="grid lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">{showDesktopCalendar ? Calendar : null}</div>
          <div className="lg:col-span-1">{Controls}</div>
        </div>
      </div>
    );
  }

  // Fallback stacked
  return (
    <div className="space-y-5">
      {DesktopDateBoxes}
      {showDesktopCalendar ? Calendar : null}
      {Controls}
    </div>
  );
}
