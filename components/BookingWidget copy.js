"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle, X, ChevronLeft, ChevronRight } from "lucide-react";

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

/** Media query */
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

function FieldBox({ label, value, onClear, onClick, disabled, children }) {
  return (
    <div
      className={[
        "flex-1 rounded-2xl border border-gray-200 p-4",
        onClick ? "cursor-pointer select-none" : "",
        disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50",
      ].join(" ")}
      role={onClick ? "button" : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      onClick={disabled ? undefined : onClick}
      onKeyDown={
        onClick && !disabled
          ? (e) => {
            if (e.key === "Enter" || e.key === " ") onClick?.();
          }
          : undefined
      }
    >
      <div className="text-xs font-semibold text-gray-600">{label}</div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <div className="font-semibold text-zinc-900">{value || "—"}</div>
        {value ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear?.();
            }}
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            Șterge
          </button>
        ) : null}
      </div>
      {children ? <div className="mt-3">{children}</div> : null}
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
    details: "Detalii (opțional)",
    send: "Trimite cererea de rezervare",
    sending: "Se trimite…",
    notCharged: "Nu vei fi taxat(ă) încă.",
    selectDates: "Selectează datele de sosire și plecare.",
    fillContact: "Te rugăm să completezi numele și numărul de telefon.",
    rangeUnavailable: "Există nopți indisponibile în interval.",
    sentOkTitle: "Cererea a fost trimisă!",
    sentOkBody: "Am primit datele și te contactăm telefonic în mai puțin de 1 oră.",
    nights: "nopți",
    total: "Total",
    invalidRange: "Interval invalid.",
    unavailable: "Indisponibil",
    available: "Disponibil",
    pickDates: "Alege datele",
    weekdays: ["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"],
    required: "Obligatoriu",
    optional: "Opțional",
    pickerTitle: "Alege datele",
    pickerHintCheckin: "Alege check-in",
    pickerHintCheckout: "Alege check-out",
    done: "Gata",
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
    details: "Details (optional)",
    send: "Send booking request",
    sending: "Sending…",
    notCharged: "You will not be charged yet.",
    selectDates: "Select check-in and check-out dates.",
    fillContact: "Please enter your name and phone number.",
    rangeUnavailable: "Some nights in the selected range are unavailable.",
    sentOkTitle: "Request sent!",
    sentOkBody: "We received your information and will call you within 1 hour.",
    nights: "nights",
    total: "Total",
    invalidRange: "Invalid range.",
    unavailable: "Unavailable",
    available: "Available",
    pickDates: "Pick dates",
    weekdays: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
    required: "Required",
    optional: "Optional",
    pickerTitle: "Pick dates",
    pickerHintCheckin: "Pick check-in",
    pickerHintCheckout: "Pick check-out",
    done: "Done",
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
    details: "Dettagli (opzionale)",
    send: "Invia richiesta",
    sending: "Invio…",
    notCharged: "Non verrà addebitato nulla ora.",
    selectDates: "Seleziona check-in e check-out.",
    fillContact: "Inserisci nome e telefono.",
    rangeUnavailable: "Alcune notti non sono disponibili.",
    sentOkTitle: "Richiesta inviata!",
    sentOkBody: "Abbiamo ricevuto i dati e ti chiameremo entro 1 ora.",
    nights: "notti",
    total: "Totale",
    invalidRange: "Intervallo non valido.",
    unavailable: "Non disponibile",
    available: "Disponibile",
    pickDates: "Scegli date",
    weekdays: ["Lu", "Ma", "Me", "Gi", "Ve", "Sa", "Do"],
    required: "Obbligatorio",
    optional: "Opzionale",
    pickerTitle: "Scegli date",
    pickerHintCheckin: "Scegli check-in",
    pickerHintCheckout: "Scegli check-out",
    done: "Fatto",
  };

  if (lang === "it") return it;
  if (lang === "en") return en;
  return ro;
}

/**
 * Mobile “native-like” modal calendar:
 * - opens like native picker (overlay)
 * - highlights check-in + check-out + range
 * - no "today outline" (we show a tiny dot)
 * - after selecting check-in, it automatically switches to checkout selection
 */
function MobileDateRangeModal({
  open,
  onClose,
  lang,
  L,
  month,
  setMonth,
  checkIn,
  checkOut,
  activeField,
  setActiveField,
  dayInfo,
  pickDate,
}) {
  const grid = useMemo(() => gridCells(month), [month]);
  const today = useMemo(() => ymd(new Date()), []);

  // lock body scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const hint =
    activeField === "checkin" ? L.pickerHintCheckin : L.pickerHintCheckout;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-end sm:items-center justify-center">
      {/* sheet */}
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* top bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <div className="text-xs text-gray-500 font-semibold">{L.pickerTitle}</div>
            <div className="text-sm font-semibold text-zinc-900">{hint}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* selected chips */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setActiveField("checkin")}
              className={[
                "rounded-2xl border p-3 text-left transition-all",
                activeField === "checkin" ? "border-gray-900" : "border-gray-200",
              ].join(" ")}
            >
              <div className="text-xs font-semibold text-gray-500">{L.checkIn}</div>
              <div className="mt-1 font-semibold text-zinc-900">{checkIn || "—"}</div>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!checkIn) setActiveField("checkin");
                else setActiveField("checkout");
              }}
              className={[
                "rounded-2xl border p-3 text-left transition-all",
                activeField === "checkout" ? "border-gray-900" : "border-gray-200",
                !checkIn ? "opacity-60" : "",
              ].join(" ")}
            >
              <div className="text-xs font-semibold text-gray-500">{L.checkOut}</div>
              <div className="mt-1 font-semibold text-zinc-900">{checkOut || "—"}</div>
            </button>
          </div>
        </div>

        {/* month nav */}
        <div className="flex items-center justify-between px-5 py-4">
          <button
            type="button"
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
            onClick={() => setMonth((m) => addMonths(m, -1))}
            aria-label="Prev month"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>

          <div className="font-bold text-zinc-900 capitalize">
            {monthLabel(month, lang)}
          </div>

          <button
            type="button"
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* weekdays */}
        <div className="grid grid-cols-7 px-5 pb-2 text-[11px] text-gray-500 font-semibold">
          {L.weekdays.map((d) => (
            <div key={d} className="text-center py-1">
              {d}
            </div>
          ))}
        </div>

        {/* days */}
        <div className="grid grid-cols-7 px-4 pb-5 gap-y-2">
          {grid.cells.map((d) => {
            const dateStr = ymd(d);
            const inMonth = d.getMonth() === month.getMonth();
            const info = dayInfo(dateStr);
            const unavailable = !info.isAvailable;

            const isStart = !!checkIn && dateStr === checkIn;
            const isEnd = !!checkOut && dateStr === checkOut;
            const isInRange =
              !!checkIn && !!checkOut && dateStr > checkIn && dateStr < checkOut;

            const isToday = dateStr === today;

            return (
              <button
                key={dateStr}
                type="button"
                disabled={unavailable}
                onClick={() => pickDate(dateStr)}
                className={[
                  "relative overflow-hidden h-11 w-full flex items-center justify-center transition-all",
                  inMonth ? "" : "opacity-35",
                  unavailable
                    ? "cursor-not-allowed bg-gray-50 dark:bg-white/5" // ✅ no opacity on the whole button
                    : "hover:bg-gray-50",
                ].join(" ")}
              >
                {/* hatch overlay for unavailable */}
                {unavailable ? (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 pc-hatch-unavailable opacity-80"
                  />
                ) : null}

                {/* range background */}
                {isInRange ? (
                  <span className="absolute inset-y-1 left-1 right-1 rounded-full bg-rose-100" />
                ) : null}

                {/* start/end background */}
                {(isStart || isEnd) ? (
                  <span className="absolute inset-1 rounded-full bg-rose-500" />
                ) : null}

                <span
                  className={[
                    "relative z-10 text-sm font-semibold",
                    (isStart || isEnd) ? "text-white" : "text-gray-900",
                    unavailable ? "text-gray-400 dark:text-white/50" : "",
                  ].join(" ")}
                >
                  {d.getDate()}
                </span>

                {isToday && !(isStart || isEnd) ? (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gray-400" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function BookingWidget({
  defaultNightly = 220,
  onAverageComputed,
  lang = "ro",
  layout = "split",
  mobileMode = "date-inputs",
  hideFees = true, // unused (kept for compatibility)
}) {
  const L = useMemo(() => t(lang), [lang]);
  const isMobile = useIsMobile();

  // Desktop calendar month (only used when showing desktop grid)
  const [month, setMonth] = useState(() => new Date());
  const grid = useMemo(() => gridCells(month), [month]);

  // Mobile modal month (separate, so desktop doesn’t jump)
  const [mobileMonth, setMobileMonth] = useState(() => new Date());

  // Pricing/settings + day map (computed by API)
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
  const [details, setDetails] = useState("");

  // UX
  const [status, setStatus] = useState({ type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  // ✅ Success popup
  const [successModal, setSuccessModal] = useState(null);
  const [successOpen, setSuccessOpen] = useState(false);

  // ✅ Mobile picker modal
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeField, setActiveField] = useState("checkin"); // "checkin" | "checkout"

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
      return data;
    }
    return null;
  }

  // desktop calendar loads when visible
  useEffect(() => {
    if (isMobile && mobileMode === "date-inputs") return;
    const from = ymd(grid.cells[0]);
    const to = ymd(grid.cells[41]);
    loadCalendar(from, to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, isMobile, mobileMode]);

  // mobile modal loads when opened / month changes
  useEffect(() => {
    if (!isMobile || mobileMode !== "date-inputs") return;
    if (!pickerOpen) return;

    const g = gridCells(mobileMonth);
    const from = ymd(g.cells[0]);
    const to = ymd(g.cells[41]);
    loadCalendar(from, to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickerOpen, mobileMonth, isMobile, mobileMode]);

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
          : (data.settings?.basePrice ?? defaultNightly);
      });

      const avg = Math.round(prices.reduce((a, b) => a + b, 0) / Math.max(1, prices.length));
      onAverageComputed?.(avg);
    }
    computeAvg();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  /**
   * Desktop behavior:
   * If user has checkIn and clicks a checkOut date but range contains unavailable nights,
   * then set checkIn to the clicked date and clear checkOut.
   */
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
      if (!res.ok) {
        setCheckIn(dateStr);
        setCheckOut("");
        return;
      }
      setCheckOut(dateStr);
    }
  }

  /**
   * Mobile modal picker behavior:
   * - Tap check-in field => choose check-in, then automatically switch to checkout selection
   * - Tap check-out field => if no check-in, start with check-in; otherwise choose checkout with range highlight
   * - Close modal when both dates are selected
   */
  function pickDateMobile(dateStr) {
    if (!dayInfo(dateStr).isAvailable) return;

    setStatus({ type: "", message: "" });

    // Selecting check-in: set it and close immediately
    if (activeField === "checkin") {
      setCheckIn(dateStr);

      // If checkout exists but is now invalid, clear it
      setCheckOut((prev) => (prev && prev <= dateStr ? "" : prev));

      setPickerOpen(false);
      return;
    }

    // Selecting check-out (checkout field is disabled until checkIn exists, so checkIn should be set)
    if (!checkIn) {
      // safety fallback: treat as check-in
      setCheckIn(dateStr);
      setCheckOut("");
      setPickerOpen(false);
      return;
    }

    // If user taps a date <= check-in, treat it as a new check-in and close
    if (dateStr <= checkIn) {
      setCheckIn(dateStr);
      setCheckOut("");
      setPickerOpen(false);
      return;
    }

    const res = validateRange(checkIn, dateStr);
    if (!res.ok) {
      // same behavior as desktop: treat as new check-in and close
      setCheckIn(dateStr);
      setCheckOut("");
      setPickerOpen(false);
      return;
    }

    // Valid checkout selected: set and close immediately
    setCheckOut(dateStr);
    setStatus({ type: "success", message: L.available });
    setPickerOpen(false);
  }

  function openPicker(field) {
    const base =
      field === "checkout"
        ? (checkOut || checkIn || ymd(new Date()))
        : (checkIn || ymd(new Date()));

    setMobileMonth(new Date(base + "T00:00:00Z"));

    if (field === "checkout" && !checkIn) {
      setActiveField("checkin");
    } else {
      setActiveField(field);
    }

    setPickerOpen(true);
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
        details: details.trim() || "",
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!data?.ok) {
      setStatus({ type: "error", message: data?.error || "Eroare." });
      return;
    }

    setSuccessModal({
      bookingId: data.bookingId,
      name: name.trim(),
      phone: phone.trim(),
      details: details.trim(),
      checkIn,
      checkOut,
      guests: { adults, children },
      total,
      currency: settings.currency || "RON",
    });
    setSuccessOpen(true);
    setStatus({ type: "success", message: "" });

    await loadCalendar(checkIn, addDays(checkOut, 1));
  }

  const showDesktopCalendar = !(isMobile && mobileMode === "date-inputs");

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

      {/* Contact */}
      <div className="grid gap-3">
        <div className="relative">
          <input
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-200"
            placeholder={L.name}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            {L.required}
          </span>
        </div>

        <div className="relative">
          <input
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-200"
            placeholder={L.phone}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            {L.required}
          </span>
        </div>

        <div className="relative">
          <textarea
            rows={3}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-200 resize-none"
            placeholder={`${L.details} • ${L.optional}`}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
        </div>
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

  const DateInputs = (
    <div className="flex flex-col sm:flex-row gap-3">
      <FieldBox
        label={L.checkIn}
        value={checkIn}
        onClear={() => {
          setCheckIn("");
          setCheckOut("");
          setStatus({ type: "", message: "" });
        }}
        onClick={isMobile && mobileMode === "date-inputs" ? () => openPicker("checkin") : undefined}
        disabled={false}
      >
        {isMobile && mobileMode === "date-inputs" ? (
          <div className="text-sm text-gray-500">{L.pickDates}</div>
        ) : null}
      </FieldBox>

      <FieldBox
        label={L.checkOut}
        value={checkOut}
        onClear={() => {
          setCheckOut("");
          setStatus({ type: "", message: "" });
        }}
        onClick={isMobile && mobileMode === "date-inputs" ? () => openPicker("checkout") : undefined}
        disabled={isMobile && mobileMode === "date-inputs" ? !checkIn : false}
      >
        {isMobile && mobileMode === "date-inputs" ? (
          <div className="text-sm text-gray-500">{checkIn ? L.pickDates : L.selectDates}</div>
        ) : null}
      </FieldBox>
    </div>
  );

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
                "relative overflow-hidden rounded-2xl border p-2 sm:p-3 text-left transition-all",
                inMonth ? "border-gray-200" : "border-gray-100 opacity-50",
                unavailable ? "bg-gray-50 opacity-50 cursor-not-allowed" : "hover:bg-gray-50",
                selected ? "ring-2 ring-rose-200 bg-rose-50" : "",
              ].join(" ")}
            >
              {/* hatch overlay for unavailable */}
              {unavailable ? (
                <span
                  aria-hidden="true"
                  className={[
                    "pointer-events-none absolute inset-0",
                    // light theme hatch (darker lines)
                    "bg-[repeating-linear-gradient(135deg,rgba(80,80,80,0.30)_0,rgba(80,80,80,0.30)_7px,transparent_7px,transparent_14px)]",
                    // dark theme hatch (lighter lines, more visible)
                    "dark:bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.35)_0,rgba(255,255,255,0.35)_7px,transparent_7px,transparent_14px)]",
                  ].join(" ")}
                />
              ) : null}

              <div className="relative z-10 text-sm sm:text-base font-semibold text-zinc-900">
                {d.getDate()}
              </div>
              <div className="relative z-10 text-[11px] text-gray-600 mt-1">
                {formatRON(info.price)} lei
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Mobile date-input mode (fields + controls only)
  if (isMobile && mobileMode === "date-inputs") {
    return (
      <>
        <div className="space-y-5">
          {DateInputs}
          {Controls}
        </div>

        <MobileDateRangeModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          lang={lang}
          L={L}
          month={mobileMonth}
          setMonth={setMobileMonth}
          checkIn={checkIn}
          checkOut={checkOut}
          activeField={activeField}
          setActiveField={setActiveField}
          dayInfo={dayInfo}
          pickDate={pickDateMobile}
        />

        {/* ✅ Success Modal */}
        {successOpen && successModal ? (
          <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center px-4">
            <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl relative">
              <button
                onClick={() => setSuccessOpen(false)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-700"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-3">
                <CheckCircle className="w-10 h-10 text-green-700" />
                <div>
                  <div className="text-xl font-bold text-zinc-900">{L.sentOkTitle}</div>
                  <div className="text-gray-600">{L.sentOkBody}</div>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="text-xs font-semibold text-gray-600 mb-1">Dates</div>
                  <div className="font-semibold text-zinc-900">
                    {successModal.checkIn} → {successModal.checkOut}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="text-xs font-semibold text-gray-600 mb-1">Name</div>
                    <div className="font-semibold text-zinc-900">{successModal.name}</div>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="text-xs font-semibold text-gray-600 mb-1">Phone</div>
                    <div className="font-semibold text-zinc-900">{successModal.phone}</div>
                  </div>
                </div>

                {successModal.details ? (
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="text-xs font-semibold text-gray-600 mb-1">Details</div>
                    <div className="text-sm text-zinc-900 whitespace-pre-wrap">
                      {successModal.details}
                    </div>
                  </div>
                ) : null}

                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between">
                  <div className="text-sm text-green-900 font-semibold">Total</div>
                  <div className="text-lg font-bold text-green-900">
                    {formatRON(successModal.total)}{" "}
                    {(successModal.currency || "RON") === "RON" ? "lei" : successModal.currency}
                  </div>
                </div>

                <button
                  onClick={() => setSuccessOpen(false)}
                  className="w-full mt-1 px-4 py-3 rounded-2xl bg-gray-900 hover:bg-black text-white font-semibold transition-all"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  // Desktop split
  if (layout === "split") {
    return (
      <>
        <div className="space-y-5">
          {DateInputs}

          <div className="grid lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">{showDesktopCalendar ? Calendar : null}</div>
            <div className="lg:col-span-1">{Controls}</div>
          </div>
        </div>

        {/* ✅ Success Modal on desktop too */}
        {successOpen && successModal ? (
          <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center px-4">
            <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl relative">
              <button
                onClick={() => setSuccessOpen(false)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-700"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-3">
                <CheckCircle className="w-10 h-10 text-green-700" />
                <div>
                  <div className="text-xl font-bold text-zinc-900">{L.sentOkTitle}</div>
                  <div className="text-gray-600">{L.sentOkBody}</div>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="text-xs font-semibold text-gray-600 mb-1">Dates</div>
                  <div className="font-semibold text-zinc-900">
                    {successModal.checkIn} → {successModal.checkOut}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="text-xs font-semibold text-gray-600 mb-1">Name</div>
                    <div className="font-semibold text-zinc-900">{successModal.name}</div>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="text-xs font-semibold text-gray-600 mb-1">Phone</div>
                    <div className="font-semibold text-zinc-900">{successModal.phone}</div>
                  </div>
                </div>

                {successModal.details ? (
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="text-xs font-semibold text-gray-600 mb-1">Details</div>
                    <div className="text-sm text-zinc-900 whitespace-pre-wrap">
                      {successModal.details}
                    </div>
                  </div>
                ) : null}

                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between">
                  <div className="text-sm text-green-900 font-semibold">Total</div>
                  <div className="text-lg font-bold text-green-900">
                    {formatRON(successModal.total)}{" "}
                    {(successModal.currency || "RON") === "RON" ? "lei" : successModal.currency}
                  </div>
                </div>

                <button
                  onClick={() => setSuccessOpen(false)}
                  className="w-full mt-1 px-4 py-3 rounded-2xl bg-gray-900 hover:bg-black text-white font-semibold transition-all"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <div className="space-y-5">
      {DateInputs}
      {showDesktopCalendar ? Calendar : null}
      {Controls}
    </div>
  );
}
