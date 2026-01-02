// components/Gallery.js
"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { listingImages } from "@/lib/listingImages";

export default function Gallery() {
  const imgs = useMemo(() => listingImages, []);
  const [open, setOpen] = useState(null);

  return (
    <section id="gallery" className="mx-auto max-w-6xl px-4 py-14">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Gallery</h2>
          <p className="mt-1 text-sm text-zinc-300">A peek inside Peaceful Corner.</p>
        </div>
        <button
          onClick={() => setOpen(0)}
          className="rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-100 hover:bg-white/5"
        >
          Open slideshow
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {imgs.map((img, idx) => (
          <button
            key={img.src}
            onClick={() => setOpen(idx)}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5"
          >
            <div className="relative aspect-[4/3]">
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                sizes="(max-width: 1024px) 50vw, 33vw"
                priority={idx < 2}
              />
            </div>
          </button>
        ))}
      </div>

      {open !== null && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4"
          onClick={() => setOpen(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-950"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="text-sm text-zinc-200">
                {open + 1} / {imgs.length}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setOpen((v) => (v - 1 + imgs.length) % imgs.length)}
                  className="rounded-full border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5"
                >
                  Prev
                </button>
                <button
                  onClick={() => setOpen((v) => (v + 1) % imgs.length)}
                  className="rounded-full border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5"
                >
                  Next
                </button>
                <button
                  onClick={() => setOpen(null)}
                  className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-zinc-950 hover:bg-zinc-200"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="relative aspect-[16/10]">
              <Image
                src={imgs[open].src}
                alt={imgs[open].alt}
                fill
                className="object-contain"
                sizes="90vw"
                priority
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
