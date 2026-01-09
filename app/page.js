"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  MapPin,
  Home,
  Star,
  ChevronLeft,
  ChevronRight,
  Wifi,
  Tv,
  Coffee,
  Wind,
  Snowflake,
  Utensils,
  Waves,
  Car,
  ShieldCheck,
} from "lucide-react";

import BookingWidget from "@/components/BookingWidget";

/**
 * ✅ Map zoom constant (smaller = more zoom)
 * Previous delta was 0.004.
 * 25% more zoom-in => 0.004 * 0.75 = 0.003
 */
const MAP_DELTA = 0.0017

/**
 * Icon maps (text comes from DB, icons stay in code)
 */
const HIGHLIGHT_ICONS = {
  home: Home,
  wind: Wind,
  star: Star,
};

const AMENITY_ICONS = {
  wifi: Wifi,
  utensils: Utensils,
  snowflake: Snowflake,
  waves: Waves,
  tv: Tv,
  coffee: Coffee,
  wind: Wind,
  home: Home,
  shield: ShieldCheck,
  car: Car,
};

const LANGS = [
  { code: "ro", short: "RO", flag: "🇷🇴" },
  { code: "en", short: "EN", flag: "🇬🇧" },
  { code: "it", short: "IT", flag: "🇮🇹" },
];

function formatRON(n) {
  const v = Number(n || 0);
  return new Intl.NumberFormat("ro-RO").format(v);
}

function ymd(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    .toISOString()
    .slice(0, 10);
}

function addDaysYMD(ymdStr, days) {
  const d = new Date(ymdStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return ymd(d);
}

function detectLanguage() {
  try {
    const locale =
      (typeof navigator !== "undefined" &&
        (navigator.language || navigator.languages?.[0])) ||
      "ro";
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";

    const l = locale.toLowerCase();
    if (l.startsWith("it") || tz.includes("Rome")) return "it";
    if (l.startsWith("en")) return "en";
    if (l.startsWith("ro") || tz.includes("Bucharest")) return "ro";
    return "ro";
  } catch {
    return "ro";
  }
}

function useOutsideClick(ref, onOutside) {
  useEffect(() => {
    function handler(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) onOutside?.();
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [ref, onOutside]);
}

export default function Page() {
  return <ModernAirbnbListing />;
}

function ModernAirbnbListing() {
  const bookingRef = useRef(null);
  const footerRef = useRef(null);
  const langMenuRef = useRef(null);

  const [activeImage, setActiveImage] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [lang, setLang] = useState("ro");
  const [langOpen, setLangOpen] = useState(false);

  const [content, setContent] = useState(null);
  const [avgPriceRON, setAvgPriceRON] = useState(null);

  useOutsideClick(langMenuRef, () => setLangOpen(false));

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? window.localStorage.getItem("pc_lang")
        : null;
    if (saved === "ro" || saved === "en" || saved === "it") {
      setLang(saved);
    } else {
      setLang(detectLanguage());
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem("pc_lang", lang);
  }, [lang]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToBooking = () =>
    bookingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const scrollToFooter = () =>
    footerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const nextImage = () =>
    setActiveImage((prev) => (prev + 1) % (content?.images?.length || 1));
  const prevImage = () =>
    setActiveImage(
      (prev) =>
        (prev - 1 + (content?.images?.length || 1)) % (content?.images?.length || 1)
    );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch(`/api/content?key=peacefulcorner&lang=${lang}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!cancelled && data?.ok) setContent(data.content);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  useEffect(() => {
    let cancelled = false;

    async function loadAvg() {
      const from = ymd(new Date());
      const to = addDaysYMD(from, 14);

      const res = await fetch(`/api/calendar?from=${from}&to=${to}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!data?.ok) return;

      const settings = data.settings || { basePrice: 220, currency: "RON" };
      const map = new Map((data.days || []).map((d) => [d.date, d]));

      const dates = Array.from({ length: 14 }, (_, i) => addDaysYMD(from, i));
      const prices = dates.map((dt) => {
        const day = map.get(dt);
        return typeof day?.price === "number"
          ? day.price
          : Number(settings.basePrice || 220);
      });

      const avg = Math.round(
        prices.reduce((a, b) => a + b, 0) / Math.max(1, prices.length)
      );
      if (!cancelled) setAvgPriceRON(avg);
    }

    loadAvg();
    return () => {
      cancelled = true;
    };
  }, []);

  const listing = useMemo(() => {
    if (!content) {
      return {
        title: "Peaceful Corner",
        tagline: "",
        description: "",
        address: "",
        city: "",
        country: "",
        rating: 4.9,
        reviews: 127,
        images: ["/listing/1.png"],
        highlights: [],
        amenities: [],
        hosts: [],
        ui: {
          bookNow: "Rezervă acum",
          checkAvailability: "Verifică disponibilitatea",
          about: "Despre această locuință",
          offers: "Ce oferă această locuință",
          amenitiesTitle: "Facilități",
          hostsTitle: "Gazdele tale",
          bookingTitle: "Rezervare",
          bookingSubtitle:
            "Selectează datele, numărul de persoane și trimite cererea. Te contactăm telefonic pentru confirmare.",
          infoTitle: "Informații",
          addressLabel: "Adresă",
          phoneLabel: "Telefon",
          emailLabel: "Email",
          contact: "Contact",
          rights: "Toate drepturile rezervate",
        },
      };
    }
    return content;
  }, [content]);

  const langMeta = useMemo(
    () => LANGS.find((l) => l.code === lang) || LANGS[0],
    [lang]
  );

  return (
    <div
      className="min-h-screen bg-white"
      style={{ WebkitTextSizeAdjust: "100%", textSizeAdjust: "100%" }}
    >
      {/* Glassy Navbar */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/70 backdrop-blur-xl shadow-lg border-b border-white/20"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div
              className={`text-base sm:text-2xl font-bold transition-colors ${
                scrolled ? "text-gray-900" : "text-white drop-shadow-lg"
              }`}
            >
              {listing.title}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={scrollToFooter}
                className={`px-3 sm:px-5 py-1.5 sm:py-3 text-xs sm:text-sm rounded-full font-semibold transition-all shadow-lg ${
                  scrolled
                    ? "bg-gray-900 hover:bg-black text-white"
                    : "bg-white/15 hover:bg-white/25 text-white border border-white/20"
                }`}
              >
                {listing.ui?.contact || "Contact"}
              </button>

              <div className="relative" ref={langMenuRef}>
                <button
                  type="button"
                  onClick={() => setLangOpen((v) => !v)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-3 text-xs sm:text-sm rounded-full font-semibold shadow-lg border transition-all ${
                    scrolled
                      ? "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
                      : "bg-white/15 text-white border-white/20 hover:bg-white/25"
                  }`}
                  aria-haspopup="menu"
                  aria-expanded={langOpen}
                >
                  <span className="text-xs sm:text-base leading-none">{langMeta.flag}</span>
                  <span className="tracking-wide leading-none">{langMeta.short}</span>
                  <span
                    className={`ml-0.5 text-[10px] sm:text-xs leading-none ${
                      scrolled ? "text-gray-500" : "text-white/80"
                    }`}
                  >
                    ▾
                  </span>
                </button>

                {langOpen ? (
                  <div
                    className="absolute right-0 mt-2 w-36 sm:w-40 rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden"
                    role="menu"
                  >
                    {LANGS.map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          setLang(l.code);
                          setLangOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-all ${
                          lang === l.code
                            ? "bg-gray-50 text-gray-900"
                            : "bg-white text-gray-800 hover:bg-gray-50"
                        }`}
                        role="menuitem"
                      >
                        <span className="flex items-center gap-2">
                          <span>{l.flag}</span>
                          <span className="font-semibold">{l.short}</span>
                        </span>
                        {lang === l.code ? <span className="text-gray-400">✓</span> : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <button
                onClick={scrollToBooking}
                className="px-3 sm:px-5 py-1.5 sm:py-3 text-xs sm:text-sm rounded-full font-semibold transition-all shadow-lg bg-rose-500 hover:bg-rose-600 text-white"
              >
                {listing.ui?.bookNow || "Rezervă acum"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Full-Screen Hero */}
      <section className="relative h-screen w-full flex items-center justify-center">
        <Image
          src={(listing.images && listing.images[0]) || "/listing/1.png"}
          alt={listing.title}
          fill
          priority
          sizes="100vw"
          className="object-cover object-right"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

        <div className="relative z-10 text-white text-center px-6 sm:px-12 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MapPin className="w-5 h-5" />
            <span className="text-sm sm:text-base">{listing.address}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-4">
            {listing.title}
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl mb-6 opacity-90">
            {listing.tagline}
          </p>

          <div className="flex items-center justify-center flex-wrap gap-4 sm:gap-6 text-sm sm:text-base mb-8">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{listing.rating}</span>
              <span className="opacity-75">({listing.reviews})</span>
            </div>

            <div className="text-2xl sm:text-3xl font-bold">
              {avgPriceRON ? `${formatRON(avgPriceRON)} lei` : "— lei"}
              <span className="text-lg sm:text-xl font-normal">
                {lang === "ro" ? "/noapte" : lang === "it" ? "/notte" : "/night"}
              </span>
            </div>
          </div>

          <button
            onClick={scrollToBooking}
            className="bg-rose-500 hover:bg-rose-600 text-white px-8 sm:px-12 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg transition-all shadow-2xl"
          >
            {listing.ui?.checkAvailability || "Verifică disponibilitatea"}
          </button>
        </div>
      </section>

      {/* Borderless Gallery Grid */}
      <section className="w-full">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-0">
          {(listing.images || []).slice(1).map((img, idx) => (
            <div
              key={idx}
              className="relative aspect-square cursor-pointer overflow-hidden group"
              onClick={() => {
                setActiveImage(idx + 1);
                setShowGallery(true);
              }}
            >
              <Image
                src={img}
                alt={`Gallery ${idx + 1}`}
                fill
                sizes="(max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
            </div>
          ))}
        </div>
      </section>

      {/* Content Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-16">
          <div className="lg:col-span-2 space-y-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-zinc-900">
                {listing.ui?.about}
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed">{listing.description}</p>
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-6 text-zinc-900">
                {listing.ui?.offers}
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {(listing.highlights || []).map((item, idx) => {
                  const IconComponent = HIGHLIGHT_ICONS[item.iconKey] || Home;
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-4 p-6 bg-gray-50 rounded-2xl"
                    >
                      <IconComponent className="w-8 h-8 text-rose-500 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-lg text-zinc-900">{item.title}</div>
                        <div className="text-gray-600">{item.subtitle}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-6 text-zinc-900">
                {listing.ui?.amenitiesTitle}
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {(listing.amenities || []).map((amenity, idx) => {
                  const IconComponent = AMENITY_ICONS[amenity.iconKey] || Home;
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-xl transition-all"
                    >
                      <IconComponent className="w-6 h-6 text-gray-700 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-900">{amenity.name}</div>
                        <div className="text-sm text-gray-600">{amenity.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-6 text-zinc-900">
                {listing.ui?.hostsTitle}
              </h3>
              <div className="grid sm:grid-cols-2 gap-6">
                {(listing.hosts || []).map((host, idx) => (
                  <div key={idx} className="flex gap-4 p-6 bg-gray-50 rounded-2xl">
                    <div className="relative w-16 h-16 min-w-16 min-h-16 flex-shrink-0 overflow-hidden rounded-full">
                      <Image
                        src={host.image}
                        alt={host.name}
                        fill
                        sizes="64px"
                        className="object-cover rounded-full"
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-lg text-zinc-900">{host.name}</div>
                      <div className="text-sm text-gray-500 mb-2">{host.role}</div>
                      <p className="text-gray-700 text-sm">{host.bio}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column CTA */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white border-2 border-gray-200 rounded-3xl p-6 shadow-xl">
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl font-bold text-zinc-900">
                  {avgPriceRON ? `${formatRON(avgPriceRON)} lei` : "— lei"}
                </span>
                <span className="text-gray-600">
                  {lang === "ro" ? "noapte" : lang === "it" ? "notte" : "night"}
                </span>
              </div>

              <button
                onClick={scrollToBooking}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white py-4 rounded-xl font-semibold text-lg transition-all"
              >
                {listing.ui?.checkAvailability || "Verifică disponibilitatea"}
              </button>

              <p className="text-center text-sm text-gray-600 mt-4">
                {lang === "ro"
                  ? "Selectează datele și trimite cererea."
                  : lang === "it"
                  ? "Seleziona le date e invia la richiesta."
                  : "Select dates and send your request."}
              </p>

              <button
                onClick={scrollToFooter}
                className="w-full mt-4 bg-gray-900 hover:bg-black text-white py-3 rounded-xl font-semibold transition-all"
              >
                {listing.ui?.contact || "Contact"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Booking */}
      <section
        ref={bookingRef}
        id="rezervare"
        className="w-full bg-gray-50 border-y border-gray-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900">
              {listing.ui?.bookingTitle}
            </h2>
            <p className="text-gray-600 mt-2">{listing.ui?.bookingSubtitle}</p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-3xl p-4 sm:p-6 shadow-xl">
            <BookingWidget
              defaultNightly={220}
              lang={lang}
              layout="split"
              mobileMode="date-inputs"
              hideFees
            />
          </div>

          <div className="mt-6 bg-white border-2 border-gray-200 rounded-3xl p-6 shadow-xl">
            <div className="text-xl font-bold text-zinc-900 mb-3">{listing.ui?.infoTitle}</div>
            <div className="text-gray-700 space-y-2">
              <div>
                <span className="font-semibold">{listing.ui?.addressLabel}:</span>{" "}
                {listing.address}, {listing.city}
              </div>
              <div>
                <span className="font-semibold">{listing.ui?.phoneLabel}:</span> +40 749 222 249
              </div>
              <div>
                <span className="font-semibold">{listing.ui?.emailLabel}:</span>{" "}
                ungureanupetronela23@gmail.com
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="w-full h-96 sm:h-[500px]">
        {(() => {
          const lat = listing?.geo?.lat ?? 47.18085959473225;
          const lng = listing?.geo?.lng ?? 27.57329758348965;

          const delta = MAP_DELTA;
          const left = lng - delta;
          const right = lng + delta;
          const top = lat + delta;
          const bottom = lat - delta;

          const src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
            `${left},${bottom},${right},${top}`
          )}&layer=mapnik&marker=${lat}%2C${lng}`;

          return <iframe title="Harta locației" className="w-full h-full" loading="lazy" src={src} />;
        })()}
      </section>

      {/* Footer */}
      <footer ref={footerRef} className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="text-center sm:text-left">
              <div className="text-2xl font-bold mb-2">{listing.title}</div>
              <div className="text-gray-400">
                {listing.address}, {listing.city}
              </div>
              <div className="text-gray-400 mt-3">
                +40 749 222 249 <br />
                ungureanupetronela23@gmail.com
              </div>
            </div>

            <div className="text-gray-400 text-center">
              © {new Date().getFullYear()} {listing.ui?.rights || "Toate drepturile rezervate"}
            </div>
          </div>
        </div>
      </footer>

      {/* Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <button
            onClick={() => setShowGallery(false)}
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full transition-all z-10"
          >
            <X className="w-8 h-8" />
          </button>

          <button
            onClick={prevImage}
            className="absolute left-4 text-white p-3 hover:bg-white/10 rounded-full transition-all"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <Image
            src={(listing.images && listing.images[activeImage]) || "/listing/1.png"}
            alt={`Galerie ${activeImage + 1}`}
            width={1600}
            height={1200}
            sizes="90vw"
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />

          <button
            onClick={nextImage}
            className="absolute right-4 text-white p-3 hover:bg-white/10 rounded-full transition-all"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {activeImage + 1} / {(listing.images || []).length}
          </div>
        </div>
      )}
    </div>
  );
}
