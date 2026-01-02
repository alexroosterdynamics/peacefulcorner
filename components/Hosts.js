// components/Hosts.js
import Image from "next/image";
import { hosts } from "@/lib/hosts";

export default function Hosts() {
  return (
    <section id="hosts" className="mx-auto max-w-6xl px-4 py-14">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Your hosts</h2>
        <p className="mt-1 text-sm text-zinc-300">Friendly, responsive, and here to help.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {hosts.map((h) => (
          <div key={h.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start gap-4">
              <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
                <Image src={h.img} alt={h.name} fill className="object-cover" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold">{h.name}</p>
                  <span className="rounded-full border border-white/15 px-2 py-0.5 text-xs text-zinc-200">
                    {h.role}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-300">{h.bio}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-zinc-400">
        Add your host photos in <span className="text-zinc-200">/public/hosts</span> and update{" "}
        <span className="text-zinc-200">lib/hosts.js</span>.
      </p>
    </section>
  );
}
